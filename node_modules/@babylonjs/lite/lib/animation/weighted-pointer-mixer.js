import { ThrowLiteError } from "../lite-error.js";
import { F32 } from "../engine/typed-arrays.js";
import { evaluatePropertySampler } from "./evaluate.js";
import { tickAnimationCore } from "./animation-group.js";
import { setAnimationTaskCategoryHandler } from "./animation-manager.js";
import { ANIMATION_GROUP_TASK_CATEGORY, getAnimationGroups } from "./animation-group-task.js";
// src/animation/weighted-pointer-mixer.ts
var MIX_TRACKS = 0;
var MIX_FROM = 1;
var MIX_TO = 2;
var MIX_DURATION = 3;
var MIX_START = 4;
var scratchByManager;
/** Enables weighted property-animation blending on `manager` by registering its category handler. */
function enablePropertyAnimationBlending(manager) {
	setAnimationTaskCategoryHandler(manager, ANIMATION_GROUP_TASK_CATEGORY, _updateWeightedPointerAnimations);
}
function getScratch(manager) {
	scratchByManager ??= /* @__PURE__ */ new WeakMap();
	let scratch = scratchByManager.get(manager);
	if (!scratch) {
		scratch = {
			buckets: [],
			sample: new F32(16),
			afterWrites: /* @__PURE__ */ new Set(),
			bucketCount: 0
		};
		scratchByManager.set(manager, scratch);
	}
	return scratch;
}
/** @internal Drive property-mixer groups, optionally leaving every other animation-group category member untouched. */
function _updateWeightedPointerAnimations(manager, deltaMs, onlyPropertyGroups = false) {
	const scratch = getScratch(manager);
	scratch.afterWrites.clear();
	scratch.bucketCount = 0;
	let contestedCount = 0;
	const groups = getAnimationGroups(manager);
	for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
		const group = groups[groupIndex];
		group._propertyMixerHandled = false;
		const mixer = group._propertyMixer;
		if (group._stopped || !mixer) continue;
		group._mixerCleanup = clearManagerScratch;
		if (group.weight === 1) continue;
		const tracks = mixer[MIX_TRACKS];
		for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
			const track = tracks[trackIndex];
			if (trackMaskedOut(group, track)) continue;
			const bucket = getTrackBucket(scratch, track);
			if (!bucket.contested) {
				bucket.contested = true;
				contestedCount++;
			}
		}
	}
	if (contestedCount === 0 && !onlyPropertyGroups) {
		scratch.buckets.length = 0;
		return false;
	}
	let handledPropertyGroups = 0;
	for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
		const group = groups[groupIndex];
		if (group._stopped) continue;
		const mixer = group._propertyMixer;
		const tracks = mixer?.[MIX_TRACKS];
		if (!tracks) {
			if (!onlyPropertyGroups) tickAnimationCore(group, deltaMs, manager.engine);
			continue;
		}
		if (!(onlyPropertyGroups || group.weight !== 1 || tracks.some((track) => !trackMaskedOut(group, track) && findTrackBucket(scratch, track)?.contested))) {
			if (!onlyPropertyGroups) tickAnimationCore(group, deltaMs, manager.engine);
			continue;
		}
		group._propertyMixerHandled = true;
		handledPropertyGroups++;
		const t = advancePropertyGroupTime(group, mixer, deltaMs);
		const weight = group.weight;
		if (weight === 0) continue;
		for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
			const track = tracks[trackIndex];
			if (trackMaskedOut(group, track)) continue;
			evaluatePropertySampler(track.sampler, t, track.stride, track.quaternion, track.easing, scratch.sample, 0);
			const bucket = findTrackBucket(scratch, track);
			if (!bucket?.contested) {
				if (!onlyPropertyGroups) {
					track.writer(scratch.sample, 0);
					if (track._afterWrite) scratch.afterWrites.add(track._afterWrite);
				}
				continue;
			}
			if (weight !== 0) accumulateWeightedTrack(bucket, track, scratch.sample, weight);
		}
	}
	scratch.buckets.length = scratch.bucketCount;
	for (let bucketIndex = 0; bucketIndex < scratch.bucketCount; bucketIndex++) {
		const bucket = scratch.buckets[bucketIndex];
		if (!bucket.active) continue;
		if (bucket.quaternion && bucket.arity === 4) normalizeQuaternion(bucket.values);
		bucket.mix?.finish(bucket.values, bucket.totalWeight);
		bucket.writer(bucket.values, 0);
		if (bucket.afterWrite) scratch.afterWrites.add(bucket.afterWrite);
	}
	if (!onlyPropertyGroups) _finishWeightedPointerAnimations(manager);
	return handledPropertyGroups > 0;
}
/** @internal Write a mixed group's uncontested tracks when the outer manager reaches its registration slot. */
function _writeUncontestedPointerTracks(manager, group) {
	const scratch = scratchByManager?.get(manager);
	const tracks = group._propertyMixer?.[MIX_TRACKS];
	if (!scratch || !tracks || !group._propertyMixerHandled) return;
	for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
		const track = tracks[trackIndex];
		if (trackMaskedOut(group, track) || findTrackBucket(scratch, track)?.contested) continue;
		evaluatePropertySampler(track.sampler, group.currentTime, track.stride, track.quaternion, track.easing, scratch.sample, 0);
		track.writer(scratch.sample, 0);
		if (track._afterWrite) scratch.afterWrites.add(track._afterWrite);
	}
}
/** @internal Publish deduplicated property side effects after every manager group has evaluated. */
function _finishWeightedPointerAnimations(manager) {
	const afterWrites = scratchByManager?.get(manager)?.afterWrites;
	if (!afterWrites) return;
	for (const publish of afterWrites) publish();
	afterWrites.clear();
}
function clearManagerScratch(manager) {
	scratchByManager?.delete(manager);
}
function trackMaskedOut(group, track) {
	const mask = group.mask;
	if (!mask || mask.disabled) return false;
	return mask.names.indexOf(track._targetName ?? "") !== -1 !== (mask.mode === 0);
}
function advancePropertyGroupTime(group, mixer, deltaMs) {
	if (group.isPlaying) group.currentTime += deltaMs / 1e3 * group.speedRatio;
	const clipStart = mixer[MIX_START] ?? 0;
	const clipEnd = clipStart + mixer[MIX_DURATION];
	const fromTime = Math.max(clipStart, Math.min(mixer[MIX_FROM], clipEnd));
	const toTime = mixer[MIX_TO] > fromTime ? Math.min(mixer[MIX_TO], clipEnd) : clipEnd;
	const duration = Math.max(0, toTime - fromTime);
	if (duration <= 0) {
		group.currentTime = fromTime;
		return group.currentTime;
	}
	if (group.isPlaying) {
		if (group.loopAnimation) {
			group.currentTime = fromTime + (group.currentTime - fromTime) % duration;
			if (group.currentTime < fromTime) group.currentTime += duration;
		} else {
			group.currentTime = Math.min(Math.max(group.currentTime, fromTime), toTime);
			if (group.speedRatio >= 0 && group.currentTime >= toTime) {
				group.isPlaying = false;
				group._stopped = true;
			}
		}
	} else group.currentTime = Math.min(Math.max(group.currentTime, clipStart), clipEnd);
	return group.currentTime;
}
function findTrackBucket(scratch, track) {
	const target = track.mixTarget();
	for (let bucketIndex = 0; bucketIndex < scratch.bucketCount; bucketIndex++) {
		const bucket = scratch.buckets[bucketIndex];
		if (bucket.target === target && bucket.property === track.mixProperty) return bucket;
	}
}
function getTrackBucket(scratch, track) {
	const buckets = scratch.buckets;
	const arity = track.stride;
	const target = track.mixTarget();
	for (let bucketIndex = 0; bucketIndex < scratch.bucketCount; bucketIndex++) {
		const candidate = buckets[bucketIndex];
		if (candidate.target !== target || candidate.property !== track.mixProperty) continue;
		if (candidate.arity !== arity) ThrowLiteError(27);
		candidate.writer = track.writer;
		candidate.quaternion = track.quaternion;
		if (!!candidate.mix !== !!track._mix) ThrowLiteError(28);
		candidate.mix = track._mix;
		candidate.afterWrite = track._afterWrite;
		return candidate;
	}
	let bucket = buckets[scratch.bucketCount];
	if (bucket) {
		bucket.target = target;
		bucket.property = track.mixProperty;
		bucket.writer = track.writer;
		bucket.quaternion = track.quaternion;
		bucket.mix = track._mix;
		bucket.afterWrite = track._afterWrite;
		bucket.contested = false;
		bucket.active = false;
		bucket.hasReference = false;
		bucket.totalWeight = 0;
		bucket.refX = 0;
		bucket.refY = 0;
		bucket.refZ = 0;
		bucket.refW = 1;
		if (bucket.arity === arity) bucket.values.fill(0);
		else {
			bucket.values = new F32(arity);
			bucket.arity = arity;
		}
	} else {
		bucket = {
			target,
			property: track.mixProperty,
			values: new F32(arity),
			writer: track.writer,
			arity,
			quaternion: track.quaternion,
			mix: track._mix,
			afterWrite: track._afterWrite,
			contested: false,
			active: false,
			hasReference: false,
			totalWeight: 0,
			refX: 0,
			refY: 0,
			refZ: 0,
			refW: 1
		};
		buckets.push(bucket);
	}
	scratch.bucketCount++;
	return bucket;
}
function accumulateWeightedTrack(bucket, track, sample, weight) {
	bucket.active = true;
	if (bucket.mix) {
		bucket.mix.accumulate(bucket.values, sample, weight, bucket.totalWeight);
		bucket.totalWeight += weight;
		return;
	}
	let sign = 1;
	if (bucket.quaternion && track.stride === 4) {
		if (!bucket.hasReference) {
			bucket.refX = sample[0];
			bucket.refY = sample[1];
			bucket.refZ = sample[2];
			bucket.refW = sample[3];
			bucket.hasReference = true;
		} else sign = bucket.refX * sample[0] + bucket.refY * sample[1] + bucket.refZ * sample[2] + bucket.refW * sample[3] < 0 ? -1 : 1;
	}
	for (let i = 0; i < track.stride; i++) bucket.values[i] = bucket.values[i] + sample[i] * weight * sign;
	bucket.totalWeight += weight;
}
function normalizeQuaternion(values) {
	const x = values[0];
	const y = values[1];
	const z = values[2];
	const w = values[3];
	const lenSq = x * x + y * y + z * z + w * w;
	if (lenSq > 0) {
		const inv = 1 / Math.sqrt(lenSq);
		values[0] = x * inv;
		values[1] = y * inv;
		values[2] = z * inv;
		values[3] = w * inv;
	}
}
export { _finishWeightedPointerAnimations, _updateWeightedPointerAnimations, _writeUncontestedPointerTracks, enablePropertyAnimationBlending };

//# sourceMappingURL=weighted-pointer-mixer.js.map