import "./types.js";
import { createAnimationController } from "../skeleton/skeleton-updater.js";
import { _setTickAnimationImpl } from "./animation-tick.js";
// src/animation/animation-group.ts
var DEFAULT_FRAME_RATE = 60;
/** Start playing an animation group. */
function playAnimation(group) {
	group.isPlaying = true;
	group._stopped = false;
}
/** Pause playback of an animation group. */
function pauseAnimation(group) {
	group.isPlaying = false;
}
/** Stop playback and reset to the first authored frame. */
function stopAnimation(group) {
	group.isPlaying = false;
	group.currentTime = group._startTime ?? 0;
	group._stopped = true;
}
/** Push the group's public playback state into its controller. */
function syncControllerFromGroup(group, ctrl) {
	ctrl.time = group.currentTime;
	ctrl.playing = group.isPlaying;
	ctrl.speedRatio = group.speedRatio;
	ctrl.loop = group.loopAnimation;
	ctrl._setMask?.(group.mask ?? null);
}
/** @internal The real per-frame stepper, advancing the group unconditionally. Manager-driven
*  callers (the weighted mixers and the generic group task) invoke this directly because they
*  own the group and must always advance it. Lives in this dynamically-loaded module. */
function tickAnimationCore(group, deltaMs, engine) {
	if (!group._stopped && group._ctrl) {
		syncControllerFromGroup(group, group._ctrl);
		group._ctrl.tick(deltaMs, engine);
		group.currentTime = group._ctrl.time;
	}
}
/** The scene auto-tick path. Registered on the always-loaded animation-tick forwarder, so this
*  runs for the scene render-loop tick. Defers to an AnimationManager if one owns the group — the
*  manager drives and blends it, so ticking here too would double-advance time and clobber the
*  blended pose (last-writer-wins). Checked per-frame because the manager typically attaches after
*  addToScene. Keeping the guard here (dynamically-loaded) rather than in scene-core keeps the
*  always-loaded core free of the property read. */
function tickAnimationImpl(group, deltaMs, engine) {
	if (group._animationManager) return;
	tickAnimationCore(group, deltaMs, engine);
}
/** @internal Wire the always-loaded tickAnimation forwarder to its real implementation.
*  Called by the group factories so a scene cannot hold groups before the impl is registered. */
function _installTickAnimation() {
	_setTickAnimationImpl(tickAnimationImpl);
}
/** Seek to a specific frame, apply the pose, and pause. */
function goToFrame(group, frame, engine) {
	const ctrl = group._ctrl;
	group.currentTime = frame / (group.frameRate || DEFAULT_FRAME_RATE);
	group.isPlaying = false;
	if (ctrl) {
		syncControllerFromGroup(group, ctrl);
		if (group._evaluate) {
			group._evaluate(engine);
			group.currentTime = ctrl.time;
		} else if (engine || !group._stopped || !group._gltfMixer) {
			ctrl.tick(0, engine);
			group.currentTime = ctrl.time;
		}
	}
}
/** Create AnimationGroup(s) from parsed glTF animation data.
*  Returns one group per animation clip. */
function createAnimationGroups(animData) {
	const { clips, nodes, skeletons, morphBindings, nodeTargets, excludedNodeIndices, nodeNames, boneOverrides } = animData;
	if (clips.length === 0) return [];
	_installTickAnimation();
	return clips.map((clip, clipIndex) => {
		const ctrl = createAnimationController(clip, nodes, skeletons, morphBindings, nodeTargets, excludedNodeIndices, boneOverrides, nodeNames);
		const started = clipIndex === 0;
		const startTime = clip._startTime ?? 0;
		const group = {
			name: clip.name || `animation_${clipIndex}`,
			duration: clip.duration,
			frameRate: clip.frameRate || DEFAULT_FRAME_RATE,
			isPlaying: started,
			currentTime: startTime,
			_startTime: startTime || void 0,
			targetedAnimations: clip.channels.map((ch) => {
				const nodeIndex = ch.nodeIdx >= 0 ? ch.nodeIdx : void 0;
				return {
					target: nodeIndex !== void 0 ? nodeTargets[nodeIndex] : void 0,
					targetName: nodeIndex !== void 0 ? nodeNames[nodeIndex] : void 0,
					nodeIndex,
					path: pathName(ch.path)
				};
			}),
			speedRatio: 1,
			loopAnimation: true,
			weight: 1,
			_ctrl: ctrl,
			_stopped: !started
		};
		group._gltfMixer = [
			clip,
			nodes,
			skeletons
		];
		return group;
	});
}
function pathName(path) {
	return path === 0 ? "translation" : path === 1 ? "rotation" : path === 2 ? "scale" : path === 4 ? "pointer" : "weights";
}
export { _installTickAnimation, createAnimationGroups, goToFrame, pauseAnimation, playAnimation, stopAnimation, tickAnimationCore };

//# sourceMappingURL=animation-group.js.map