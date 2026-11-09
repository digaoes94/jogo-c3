import { ThrowLiteError } from "../lite-error.js";
import { F32, I32, U8 } from "../engine/typed-arrays.js";
import "./types.js";
import { evaluateSampler } from "./evaluate.js";
import { composeMat4IntoBuffer } from "../math/compose-mat4-into-buffer.js";
import { multiplyMat4IntoBuffer } from "../math/multiply-mat4-into-buffer.js";
import { _boneApplier } from "../skeleton/bone-control-hooks.js";
import { tickAnimationCore } from "./animation-group.js";
import { setAnimationTaskCategoryHandler } from "./animation-manager.js";
import { ANIMATION_GROUP_TASK_CATEGORY, getAnimationGroupOwner, getAnimationGroups } from "./animation-group-task.js";
import { _rightHanded } from "#coordinate-system";
// src/animation/weighted-gltf-mixer.ts
var _propertyMixerHandler = null;
var _propertyMixerDirectHandler = null;
var _propertyMixerFinishHandler = null;
/** @internal Install opt-in property-track handling for the skeletal blend manager. */
function _installPropertyMixerHandler(handler, directHandler = null, finishHandler = null) {
	_propertyMixerHandler = handler;
	_propertyMixerDirectHandler = directHandler;
	_propertyMixerFinishHandler = finishHandler;
}
var GLTF_CLIP = 0;
var GLTF_NODES = 1;
var GLTF_SKELETONS = 2;
var TRS_STRIDE = 12;
var T_OFF = 0;
var R_OFF = 3;
var S_OFF = 7;
var ROOT_TRANSFORM = new F32([
	_rightHanded ? 1 : -1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1
]);
var _boneTmp = new F32(16);
var scratchByManager;
/** Enable advanced animation blending for a manager. Kept opt-in so manual-only weights do not pay for skeletal mixing code. */
function enableAnimationBlending(manager) {
	setAnimationTaskCategoryHandler(manager, ANIMATION_GROUP_TASK_CATEGORY, updateWeightedGltfAnimations);
}
/** Mark an animation group as additive. Reference defaults to frame 0, matching Babylon.js MakeAnimationAdditive. */
function setAnimationAdditive(group, options) {
	if (options?.referenceFrame !== void 0 && options.referenceTime !== void 0) ThrowLiteError(23);
	const referenceTime = options?.referenceTime ?? (options?.referenceFrame ?? 0) / (group.frameRate || 60);
	if (!Number.isFinite(referenceTime) || referenceTime < 0) ThrowLiteError(24, referenceTime);
	group._additive = { referenceTime };
	const owner = getAnimationGroupOwner(group);
	if (owner) enableAnimationBlending(owner);
}
function getScratch(manager) {
	scratchByManager ??= /* @__PURE__ */ new WeakMap();
	let scratch = scratchByManager.get(manager);
	if (!scratch) {
		scratch = {
			keys: /* @__PURE__ */ new Set(),
			targets: /* @__PURE__ */ new Map(),
			sample: new F32(16),
			reference: new F32(16),
			delta: new F32(16)
		};
		scratchByManager.set(manager, scratch);
	}
	return scratch;
}
function updateWeightedGltfAnimations(manager, deltaMs) {
	const handledPropertyGroups = _propertyMixerHandler?.(manager, deltaMs, true) ?? false;
	const scratch = getScratch(manager);
	const keys = scratch.keys;
	keys.clear();
	const groups = getAnimationGroups(manager);
	for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
		const group = groups[groupIndex];
		const mixer = group._gltfMixer;
		if (group._stopped || !mixer || group.weight === 1 && !group._additive) continue;
		keys.add(mixer[GLTF_NODES]);
	}
	if (keys.size === 0) {
		if (handledPropertyGroups) {
			for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
				const group = groups[groupIndex];
				if (group._stopped) continue;
				if (group._propertyMixerHandled) _propertyMixerDirectHandler?.(manager, group);
				else tickAnimationCore(group, deltaMs, manager.engine);
			}
			_propertyMixerFinishHandler?.(manager);
		}
		return handledPropertyGroups;
	}
	scratch.targets.forEach(resetWeightedGltfTarget);
	for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
		const group = groups[groupIndex];
		if (group._stopped) continue;
		if (handledPropertyGroups && group._propertyMixerHandled) {
			_propertyMixerDirectHandler?.(manager, group);
			continue;
		}
		const mixer = group._gltfMixer;
		if (mixer && keys.has(mixer[GLTF_NODES])) {
			if (group._additive) {
				getTarget(scratch, mixer).active = true;
				advanceGroupTime(group, mixer, deltaMs);
			} else accumulateGroup(manager, scratch, group, mixer, deltaMs);
			continue;
		}
		tickAnimationCore(group, deltaMs, manager.engine);
	}
	for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
		const group = groups[groupIndex];
		const mixer = group._gltfMixer;
		if (!group._stopped && group._additive && mixer && keys.has(mixer[GLTF_NODES])) accumulateAdditiveGroup(scratch, group, mixer);
	}
	scratch.targets.forEach((target, key) => {
		if (target.active && keys.has(key)) uploadTarget(manager, target);
	});
	if (handledPropertyGroups) _propertyMixerFinishHandler?.(manager);
	return true;
}
function resetWeightedGltfTarget(target) {
	target.active = false;
	target.tWeight.fill(0);
	target.rWeight.fill(0);
	target.sWeight.fill(0);
	resetTarget(target);
	const overrides = target.overrides;
	if (overrides !== void 0) {
		if (overrides.size > 0) _boneApplier?.(overrides, target.trs, target.nodes.length);
		const baseRot = target.baseRot;
		const trs = target.trs;
		for (let i = 0; i < target.nodes.length; i++) {
			const src = i * TRS_STRIDE + R_OFF;
			const dst = i * 4;
			baseRot[dst] = trs[src];
			baseRot[dst + 1] = trs[src + 1];
			baseRot[dst + 2] = trs[src + 2];
			baseRot[dst + 3] = trs[src + 3];
		}
	}
}
/** True when this channel is masked OUT for the group (mask active, node named, excluded).
*  One helper shared by both accumulate paths — mirrors `animationGroupMaskRetainsTarget`
*  (animation-group-mask.ts) inline so blend-only bundles don't pull in the mask module. */
function channelMaskedOut(group, channelIndex, nodeIdx) {
	const mask = group.mask;
	if (mask === void 0 || mask.disabled || nodeIdx < 0) return false;
	const name = group.targetedAnimations[channelIndex].targetName ?? "";
	return mask.names.indexOf(name) !== -1 !== (mask.mode === 0);
}
function getTarget(scratch, mixer) {
	const nodes = mixer[GLTF_NODES];
	let target = scratch.targets.get(nodes);
	if (!target) {
		const numNodes = nodes.length;
		const skeletons = mixer[GLTF_SKELETONS];
		const overrides = skeletons.length > 0 ? skeletons[0].runtimeSkeleton?._overrides : void 0;
		target = {
			nodes,
			skeletons,
			overrides,
			baseRot: overrides !== void 0 ? new F32(numNodes * 4) : void 0,
			trs: new F32(numNodes * TRS_STRIDE),
			localMat: new F32(numNodes * 16),
			worldMat: new F32(numNodes * 16),
			topoOrder: computeTopoOrder(nodes),
			tWeight: new F32(numNodes),
			rWeight: new F32(numNodes),
			sWeight: new F32(numNodes),
			active: false
		};
		scratch.targets.set(nodes, target);
		resetWeightedGltfTarget(target);
	}
	return target;
}
function resetTarget(target) {
	const { nodes, trs } = target;
	for (let i = 0; i < nodes.length; i++) {
		const n = nodes[i];
		const off = i * TRS_STRIDE;
		trs[off + T_OFF] = n.tx;
		trs[off + T_OFF + 1] = n.ty;
		trs[off + T_OFF + 2] = n.tz;
		trs[off + R_OFF] = n.rx;
		trs[off + R_OFF + 1] = n.ry;
		trs[off + R_OFF + 2] = n.rz;
		trs[off + R_OFF + 3] = n.rw;
		trs[off + S_OFF] = n.sx;
		trs[off + S_OFF + 1] = n.sy;
		trs[off + S_OFF + 2] = n.sz;
	}
}
function accumulateAdditiveGroup(scratch, group, mixer) {
	const additive = group._additive;
	const weight = group.weight;
	if (!additive || weight === 0) return;
	const target = getTarget(scratch, mixer);
	const clip = mixer[GLTF_CLIP];
	const t = group.currentTime;
	for (let channelIndex = 0; channelIndex < clip.channels.length; channelIndex++) {
		const ch = clip.channels[channelIndex];
		const sampler = clip.samplers[ch.samplerIdx];
		const nodeIdx = ch.nodeIdx;
		if (channelMaskedOut(group, channelIndex, nodeIdx)) continue;
		const base = nodeIdx * TRS_STRIDE;
		switch (ch.path) {
			case 0:
				evaluateSampler(sampler, t, 3, false, scratch.sample, 0);
				evaluateSampler(sampler, additive.referenceTime, 3, false, scratch.reference, 0);
				target.trs[base + T_OFF] = target.trs[base + T_OFF] + (scratch.sample[0] - scratch.reference[0]) * weight;
				target.trs[base + T_OFF + 1] = target.trs[base + T_OFF + 1] + (scratch.sample[1] - scratch.reference[1]) * weight;
				target.trs[base + T_OFF + 2] = target.trs[base + T_OFF + 2] + (scratch.sample[2] - scratch.reference[2]) * weight;
				break;
			case 2:
				evaluateSampler(sampler, t, 3, false, scratch.sample, 0);
				evaluateSampler(sampler, additive.referenceTime, 3, false, scratch.reference, 0);
				target.trs[base + S_OFF] = target.trs[base + S_OFF] + (scratch.sample[0] - scratch.reference[0]) * weight;
				target.trs[base + S_OFF + 1] = target.trs[base + S_OFF + 1] + (scratch.sample[1] - scratch.reference[1]) * weight;
				target.trs[base + S_OFF + 2] = target.trs[base + S_OFF + 2] + (scratch.sample[2] - scratch.reference[2]) * weight;
				break;
			case 1:
				evaluateSampler(sampler, t, 4, true, scratch.sample, 0);
				evaluateSampler(sampler, additive.referenceTime, 4, true, scratch.reference, 0);
				quatRefInverseTimesSample(scratch.delta, scratch.reference, scratch.sample);
				applyAdditiveQuaternion(target.trs, base + R_OFF, scratch.delta, weight);
		}
	}
}
function accumulateGroup(manager, scratch, group, mixer, deltaMs) {
	if (!manager.engine) ThrowLiteError(25);
	const target = getTarget(scratch, mixer);
	const t = advanceGroupTime(group, mixer, deltaMs);
	const weight = group.weight;
	target.active = true;
	if (weight === 0) return;
	const clip = mixer[GLTF_CLIP];
	for (let channelIndex = 0; channelIndex < clip.channels.length; channelIndex++) {
		const ch = clip.channels[channelIndex];
		const sampler = clip.samplers[ch.samplerIdx];
		const nodeIdx = ch.nodeIdx;
		if (channelMaskedOut(group, channelIndex, nodeIdx)) continue;
		const base = nodeIdx * TRS_STRIDE;
		switch (ch.path) {
			case 0:
				evaluateSampler(sampler, t, 3, false, scratch.sample, 0);
				if (target.tWeight[nodeIdx] === 0) {
					target.trs[base + T_OFF] = 0;
					target.trs[base + T_OFF + 1] = 0;
					target.trs[base + T_OFF + 2] = 0;
				}
				target.trs[base + T_OFF] = target.trs[base + T_OFF] + scratch.sample[0] * weight;
				target.trs[base + T_OFF + 1] = target.trs[base + T_OFF + 1] + scratch.sample[1] * weight;
				target.trs[base + T_OFF + 2] = target.trs[base + T_OFF + 2] + scratch.sample[2] * weight;
				target.tWeight[nodeIdx] = target.tWeight[nodeIdx] + weight;
				break;
			case 2:
				evaluateSampler(sampler, t, 3, false, scratch.sample, 0);
				if (target.sWeight[nodeIdx] === 0) {
					target.trs[base + S_OFF] = 0;
					target.trs[base + S_OFF + 1] = 0;
					target.trs[base + S_OFF + 2] = 0;
				}
				target.trs[base + S_OFF] = target.trs[base + S_OFF] + scratch.sample[0] * weight;
				target.trs[base + S_OFF + 1] = target.trs[base + S_OFF + 1] + scratch.sample[1] * weight;
				target.trs[base + S_OFF + 2] = target.trs[base + S_OFF + 2] + scratch.sample[2] * weight;
				target.sWeight[nodeIdx] = target.sWeight[nodeIdx] + weight;
				break;
			case 1: {
				evaluateSampler(sampler, t, 4, true, scratch.sample, 0);
				if (target.rWeight[nodeIdx] === 0) {
					target.trs[base + R_OFF] = scratch.sample[0];
					target.trs[base + R_OFF + 1] = scratch.sample[1];
					target.trs[base + R_OFF + 2] = scratch.sample[2];
					target.trs[base + R_OFF + 3] = scratch.sample[3];
					target.rWeight[nodeIdx] = weight;
					break;
				}
				const accumulatedWeight = target.rWeight[nodeIdx];
				quatSlerpInto(target.trs, base + R_OFF, target.trs[base + R_OFF], target.trs[base + R_OFF + 1], target.trs[base + R_OFF + 2], target.trs[base + R_OFF + 3], scratch.sample[0], scratch.sample[1], scratch.sample[2], scratch.sample[3], weight / (accumulatedWeight + weight));
				target.rWeight[nodeIdx] = accumulatedWeight + weight;
				break;
			}
		}
	}
}
function advanceGroupTime(group, mixer, deltaMs) {
	const clip = mixer[GLTF_CLIP];
	const startTime = clip._startTime ?? 0;
	const endTime = startTime + clip.duration;
	const isPlaying = group.isPlaying;
	if (isPlaying) group.currentTime += deltaMs / 1e3 * group.speedRatio;
	if (clip.duration <= 0) {
		group.currentTime = startTime;
		return group.currentTime;
	}
	if (group.loopAnimation && isPlaying) {
		group.currentTime = startTime + (group.currentTime - startTime) % clip.duration;
		if (group.currentTime < startTime) group.currentTime += clip.duration;
	} else group.currentTime = Math.min(Math.max(group.currentTime, startTime), endTime);
	return group.currentTime;
}
function uploadTarget(manager, target) {
	if (!manager.engine) ThrowLiteError(26);
	const device = manager.engine._device;
	const { nodes, trs, localMat, worldMat } = target;
	const overrides = target.overrides;
	if (overrides !== void 0 && overrides.size > 0) _boneApplier?.(overrides, trs, nodes.length, true);
	for (let i = 0; i < nodes.length; i++) {
		const rotationWeight = target.rWeight[i];
		if (rotationWeight > 0 && rotationWeight < 1) {
			const off = i * TRS_STRIDE + R_OFF;
			const baseRot = target.baseRot;
			const node = nodes[i];
			const bo = i * 4;
			quatSlerpInto(trs, off, baseRot ? baseRot[bo] : node.rx, baseRot ? baseRot[bo + 1] : node.ry, baseRot ? baseRot[bo + 2] : node.rz, baseRot ? baseRot[bo + 3] : node.rw, trs[off], trs[off + 1], trs[off + 2], trs[off + 3], rotationWeight);
		} else if (rotationWeight > 0) normalizeQuaternionAt(trs, i * TRS_STRIDE + R_OFF);
	}
	for (let idx = 0; idx < nodes.length; idx++) {
		const nodeIdx = target.topoOrder[idx];
		const node = nodes[nodeIdx];
		const off = nodeIdx * TRS_STRIDE;
		if (node._matrix) localMat.set(node._matrix, nodeIdx * 16);
		else composeMat4IntoBuffer(localMat, nodeIdx * 16, trs[off + T_OFF], trs[off + T_OFF + 1], trs[off + T_OFF + 2], trs[off + R_OFF], trs[off + R_OFF + 1], trs[off + R_OFF + 2], trs[off + R_OFF + 3], trs[off + S_OFF], trs[off + S_OFF + 1], trs[off + S_OFF + 2]);
		const parentIdx = node.parentIdx;
		if (parentIdx >= 0) multiplyMat4IntoBuffer(worldMat, nodeIdx * 16, worldMat, parentIdx * 16, localMat, nodeIdx * 16);
		else multiplyMat4IntoBuffer(worldMat, nodeIdx * 16, ROOT_TRANSFORM, 0, localMat, nodeIdx * 16);
	}
	for (let skeletonIndex = 0; skeletonIndex < target.skeletons.length; skeletonIndex++) {
		const skel = target.skeletons[skeletonIndex];
		if (skel.runtimeSkeleton?._disposed) continue;
		const boneData = skel.boneMatrices;
		for (let bi = 0; bi < skel.boneCount; bi++) {
			const jointIdx = skel.jointNodes[bi];
			const ibmOff = bi * 16;
			multiplyMat4IntoBuffer(_boneTmp, 0, skel.invMeshWorld, 0, worldMat, jointIdx * 16);
			multiplyMat4IntoBuffer(boneData, bi * 16, _boneTmp, 0, skel.inverseBindMatrices, ibmOff);
		}
		const texWidth = skel.boneCount * 4;
		device.queue.writeTexture({ texture: skel.boneTexture }, boneData.buffer, { bytesPerRow: texWidth * 16 }, {
			width: texWidth,
			height: 1
		});
	}
}
function computeTopoOrder(nodes) {
	const order = new I32(nodes.length);
	const visited = new U8(nodes.length);
	let cursor = 0;
	function visit(idx) {
		if (visited[idx]) return;
		visited[idx] = 1;
		const p = nodes[idx].parentIdx;
		if (p >= 0) visit(p);
		order[cursor++] = idx;
	}
	for (let i = 0; i < nodes.length; i++) visit(i);
	return order;
}
function normalizeQuaternionAt(values, offset) {
	const x = values[offset];
	const y = values[offset + 1];
	const z = values[offset + 2];
	const w = values[offset + 3];
	const lenSq = x * x + y * y + z * z + w * w;
	if (lenSq > 0) {
		const inv = 1 / Math.sqrt(lenSq);
		values[offset] = x * inv;
		values[offset + 1] = y * inv;
		values[offset + 2] = z * inv;
		values[offset + 3] = w * inv;
	}
}
function quatRefInverseTimesSample(out, ref, sample) {
	const ax = -ref[0];
	const ay = -ref[1];
	const az = -ref[2];
	const aw = ref[3];
	const bx = sample[0];
	const by = sample[1];
	const bz = sample[2];
	const bw = sample[3];
	out[0] = aw * bx + ax * bw + ay * bz - az * by;
	out[1] = aw * by - ax * bz + ay * bw + az * bx;
	out[2] = aw * bz + ax * by - ay * bx + az * bw;
	out[3] = aw * bw - ax * bx - ay * by - az * bz;
	normalizeQuaternionAt(out, 0);
}
function applyAdditiveQuaternion(base, offset, delta, weight) {
	const bx = base[offset];
	const by = base[offset + 1];
	const bz = base[offset + 2];
	const bw = base[offset + 3];
	const dx = delta[0];
	const dy = delta[1];
	const dz = delta[2];
	const dw = delta[3];
	quatSlerpInto(base, offset, bx, by, bz, bw, bw * dx + bx * dw + by * dz - bz * dy, bw * dy - bx * dz + by * dw + bz * dx, bw * dz + bx * dy - by * dx + bz * dw, bw * dw - bx * dx - by * dy - bz * dz, weight);
}
function quatSlerpInto(out, offset, ax, ay, az, aw, bx, by, bz, bw, t) {
	let dot = ax * bx + ay * by + az * bz + aw * bw;
	if (dot < 0) {
		bx = -bx;
		by = -by;
		bz = -bz;
		bw = -bw;
		dot = -dot;
	}
	if (dot > .9995) {
		out[offset] = ax + t * (bx - ax);
		out[offset + 1] = ay + t * (by - ay);
		out[offset + 2] = az + t * (bz - az);
		out[offset + 3] = aw + t * (bw - aw);
		normalizeQuaternionAt(out, offset);
		return;
	}
	const theta = Math.acos(dot);
	const sinTheta = Math.sin(theta);
	const wa = Math.sin((1 - t) * theta) / sinTheta;
	const wb = Math.sin(t * theta) / sinTheta;
	out[offset] = wa * ax + wb * bx;
	out[offset + 1] = wa * ay + wb * by;
	out[offset + 2] = wa * az + wb * bz;
	out[offset + 3] = wa * aw + wb * bw;
}
export { _installPropertyMixerHandler, enableAnimationBlending, setAnimationAdditive };

//# sourceMappingURL=weighted-gltf-mixer.js.map