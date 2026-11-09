import { ThrowLiteError } from "../lite-error.js";
import { F32 } from "../engine/typed-arrays.js";
import "./types.js";
import { evaluatePropertySampler } from "./evaluate.js";
import { _installTickAnimation, playAnimation } from "./animation-group.js";
import { addAnimationGroup } from "./animation-group-task.js";
// src/animation/property-animation.ts
var DEFAULT_FRAME_RATE = 60;
/** Compiles a set of track definitions into a reusable {@link PropertyAnimationClip}.
*  @param name - Clip name.
*  @param tracks - One or more track definitions; their keyframes are sorted and baked into samplers.
*  @param options - Optional default frame rate.
*  @returns The compiled clip, with its duration set to the longest track.
*  @throws If no tracks are provided. */
function createPropertyAnimationClip(name, tracks, options) {
	if (tracks.length === 0) ThrowLiteError(7);
	const frameRate = options?.frameRate ?? tracks[0]?.frameRate ?? DEFAULT_FRAME_RATE;
	let duration = 0;
	return {
		name,
		tracks: tracks.map((track) => {
			const sampler = createSampler(track, track.frameRate ?? frameRate);
			const trackDuration = sampler.input[sampler.input.length - 1] ?? 0;
			if (trackDuration > duration) duration = trackDuration;
			return {
				path: track.path,
				sampler,
				stride: getTrackStride(track),
				quaternion: track.quaternion === true || track.path === "rotationQuaternion" || track.path.endsWith(".rotationQuaternion"),
				easing: track.easing
			};
		}),
		duration,
		frameRate
	};
}
/** Binds `clip` to `target`'s properties, creates a playing animation group, and attaches it to `manager`.
*  @param manager - Animation manager that drives the resulting group.
*  @param target - Object whose properties (resolved by each track's dotted path) are animated.
*  @param clip - Compiled clip to play.
*  @param options - Optional looping, speed, and play-range overrides.
*  @returns The started animation group.
*  @throws If the resolved play range does not have `toTime` greater than `fromTime`. */
function createPropertyAnimationGroup(manager, target, clip, options) {
	const runtimeTracks = [];
	for (let i = 0; i < clip.tracks.length; i++) {
		const track = clip.tracks[i];
		const binding = resolvePropertyBinding(target, track.path, track.stride);
		runtimeTracks.push({
			sampler: track.sampler,
			stride: track.stride,
			quaternion: track.quaternion,
			easing: track.easing,
			writer: binding.writer,
			mixTarget: binding.mixTarget,
			mixProperty: binding.mixProperty
		});
	}
	const fromTime = options?.fromTime ?? (options?.fromFrame !== void 0 ? options.fromFrame / clip.frameRate : 0);
	const toTime = options?.toTime ?? (options?.toFrame !== void 0 ? options.toFrame / clip.frameRate : clip.duration);
	if (!(toTime > fromTime)) ThrowLiteError(8);
	const group = createPointerAnimationGroup(clip.name, clip.duration, clip.frameRate, runtimeTracks, fromTime, toTime, options);
	group.loopAnimation = options?.loop ?? true;
	group.speedRatio = options?.speedRatio ?? 1;
	group._propertyMixer = [
		runtimeTracks,
		fromTime,
		toTime,
		clip.duration
	];
	playAnimation(group);
	addAnimationGroup(manager, group);
	return group;
}
function createPointerAnimationGroup(name, duration, frameRate, tracks, fromTime, toTime, options) {
	const applyAt = (time) => {
		for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
			const track = tracks[trackIndex];
			evaluatePropertySampler(track.sampler, time, track.stride, track.quaternion, track.easing, _pointerScratch, 0);
			track.writer(_pointerScratch, 0);
			track._afterWrite?.();
		}
	};
	const ctrl = {
		time: fromTime,
		playing: false,
		speedRatio: options?.speedRatio ?? 1,
		loop: options?.loop ?? true,
		tick(deltaMs) {
			if (!ctrl.playing) return;
			ctrl.time += deltaMs / 1e3 * ctrl.speedRatio;
			const rangeDuration = Math.max(0, toTime - fromTime);
			if (rangeDuration <= 0) return;
			if (ctrl.loop) {
				ctrl.time = fromTime + (ctrl.time - fromTime) % rangeDuration;
				if (ctrl.time < fromTime) ctrl.time += rangeDuration;
			} else ctrl.time = Math.min(Math.max(ctrl.time, fromTime), toTime);
			applyAt(ctrl.time);
			if (!ctrl.loop && ctrl.speedRatio >= 0 && ctrl.time >= toTime) {
				ctrl.playing = false;
				group.isPlaying = false;
				group._stopped = true;
			}
		}
	};
	_installTickAnimation();
	const group = {
		name,
		duration,
		frameRate: frameRate || DEFAULT_FRAME_RATE,
		isPlaying: false,
		currentTime: fromTime,
		_startTime: fromTime || void 0,
		targetedAnimations: tracks.map((track) => ({
			target: track.mixTarget(),
			path: track.mixProperty
		})),
		speedRatio: options?.speedRatio ?? 1,
		loopAnimation: options?.loop ?? true,
		weight: 1,
		_ctrl: ctrl,
		_stopped: false,
		_evaluate: () => {
			ctrl.time = Math.min(Math.max(ctrl.time, 0), duration);
			applyAt(ctrl.time);
		}
	};
	return group;
}
var _pointerScratch = new F32(16);
function createSampler(track, frameRate) {
	if (track.keys.length === 0) ThrowLiteError(9, track.path);
	if (!(frameRate > 0)) ThrowLiteError(10, track.path);
	const stride = getTrackStride(track);
	const sorted = [...track.keys].sort((a, b) => getKeyTime(a, frameRate, track.path) - getKeyTime(b, frameRate, track.path));
	const input = new F32(sorted.length);
	const output = new F32(sorted.length * stride);
	let lastTime = -Infinity;
	for (let i = 0; i < sorted.length; i++) {
		const key = sorted[i];
		const time = getKeyTime(key, frameRate, track.path);
		if (time < lastTime) ThrowLiteError(11, track.path);
		input[i] = time;
		lastTime = time;
		writeKeyValue(track.path, key.value, stride, output, i * stride);
	}
	return {
		input,
		output,
		interpolation: track.interpolation === "step" ? 1 : 0
	};
}
function getTrackStride(track) {
	const value = track.keys[0]?.value;
	if (value === void 0) ThrowLiteError(12, track.path);
	return typeof value === "number" ? 1 : value.length;
}
function getKeyTime(key, frameRate, path) {
	const hasTime = key.time !== void 0;
	if (hasTime === (key.frame !== void 0)) ThrowLiteError(13, path);
	const time = hasTime ? key.time : key.frame / frameRate;
	if (!(time >= 0)) ThrowLiteError(14, path);
	return time;
}
function writeKeyValue(path, value, stride, output, offset) {
	if (typeof value === "number") {
		if (stride !== 1) ThrowLiteError(15, path, stride);
		output[offset] = value;
		return;
	}
	if (value.length !== stride) ThrowLiteError(16, path, stride);
	for (let i = 0; i < stride; i++) output[offset + i] = value[i];
}
function resolvePropertyBinding(target, path, stride) {
	const parts = path.split(".");
	if (parts.length === 0 || parts.some((p) => p.length === 0)) ThrowLiteError(17, path);
	const property = parts[parts.length - 1];
	const mixTarget = createMixTargetResolver(target, parts, property, path);
	return {
		mixTarget,
		mixProperty: property,
		writer: createPathPropertyWriter(mixTarget, mixTarget(), property, stride, path)
	};
}
function resolvePropertyOwner(target, parts, path) {
	let owner = target;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		const record = asRecord(owner, path);
		if (!(part in record)) ThrowLiteError(18, path, part);
		owner = record[part];
	}
	return asRecord(owner, path);
}
function asRecord(value, path) {
	if (typeof value !== "object" && typeof value !== "function" || value === null) ThrowLiteError(19, path);
	return value;
}
function isSettable(value) {
	return (typeof value === "object" || typeof value === "function") && value !== null && typeof value.set === "function";
}
function createMixTargetResolver(target, parts, property, path) {
	return () => {
		const owner = resolvePropertyOwner(target, parts, path);
		if (!(property in owner)) ThrowLiteError(20, path, property);
		return owner;
	};
}
function createPathPropertyWriter(resolveTarget, initialOwner, property, stride, path) {
	let owner = initialOwner;
	let write = createPropertyWriter(owner, property, stride, path);
	return (output, offset) => {
		const currentOwner = resolveTarget();
		if (currentOwner !== owner) {
			owner = currentOwner;
			write = createPropertyWriter(owner, property, stride, path);
		}
		write(output, offset);
	};
}
function createPropertyWriter(target, property, stride, path) {
	if (stride === 1) return (output, offset) => {
		target[property] = output[offset];
	};
	if (stride > 4) ThrowLiteError(21, path, stride);
	let targetValue = target[property];
	let writeValue = createVectorValueWriter(targetValue, stride, path);
	return (output, offset) => {
		const currentValue = target[property];
		if (currentValue !== targetValue) {
			targetValue = currentValue;
			writeValue = createVectorValueWriter(currentValue, stride, path);
		}
		writeValue(output, offset);
	};
}
function createVectorValueWriter(targetValue, stride, path) {
	if (isSettable(targetValue)) switch (stride) {
		case 2: return (output, offset) => targetValue.set(output[offset], output[offset + 1]);
		case 3: return (output, offset) => targetValue.set(output[offset], output[offset + 1], output[offset + 2]);
		case 4: return (output, offset) => targetValue.set(output[offset], output[offset + 1], output[offset + 2], output[offset + 3]);
	}
	const valueRecord = asRecord(targetValue, path);
	const components = "xyzw";
	for (let i = 0; i < stride; i++) if (!(components[i] in valueRecord)) ThrowLiteError(22, path, components[i]);
	return (output, offset) => {
		for (let i = 0; i < stride; i++) valueRecord[components[i]] = output[offset + i];
	};
}
export { createPropertyAnimationClip, createPropertyAnimationGroup };

//# sourceMappingURL=property-animation.js.map