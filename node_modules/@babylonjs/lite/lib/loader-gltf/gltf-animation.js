import { F32 } from "../engine/typed-arrays.js";
import "../animation/types.js";
import { multiplyMat4IntoBuffer } from "../math/multiply-mat4-into-buffer.js";
import { invertMat4 } from "../math/invert-mat4.js";
import { createIdentityMat4 } from "../math/create-identity-mat4.js";
import { getLoaderTmpAnim } from "./_loader-scratch.js";
import { computeNodeWorldMatrix, findParent, resolveAccessor } from "./gltf-parser.js";
// src/loader-gltf/gltf-animation.ts
/**
*  Lazy-loaded animation/skin parsing for glTF.
*  Dynamically imported by load-gltf.ts only when a glTF contains animations or skins.
*
*  This module is pointer-feature agnostic: KHR_animation_pointer is installed
*  via the registration seam below, so scenes that don't declare the extension
*  pay zero bytes for pointer resolution.
*/
var _parsePointerChannel = null;
function _installPointerHandlers(parser) {
	_parsePointerChannel = parser;
}
var _convertSampler = null;
function _installSamplerConverter(converter) {
	_convertSampler = converter;
}
/** Convert a sampler input/output accessor to a tightly-packed Float32Array. Aligned Float32 sources
*  (the overwhelmingly common case) are reinterpreted in place for free; non-Float32 / normalized
*  sources are handled by the lazily-installed converter. */
function toSamplerFloat32(src, length, normalized) {
	if (_convertSampler) return _convertSampler(src, length, normalized);
	return new F32(src.buffer, src.byteOffset, length);
}
/** Resolve a skin's inverse-bind matrices, filling with identities when absent. */
function resolveIBMs(json, binChunk, skin) {
	const jointCount = skin.joints.length;
	if (skin.inverseBindMatrices !== void 0) {
		const ibmData = resolveAccessor(json, binChunk, skin.inverseBindMatrices);
		return new F32(ibmData._data.buffer, ibmData._data.byteOffset, jointCount * 16);
	}
	const out = new F32(jointCount * 16);
	for (let i = 0; i < jointCount; i++) {
		const o = i * 16;
		out[o] = out[o + 5] = out[o + 10] = out[o + 15] = 1;
	}
	return out;
}
function extractSkin(json, binChunk, skinIdx, meshWorldMatrix, parentMap, worldMatrixCache) {
	const skin = json.skins[skinIdx];
	const jointNodes = skin.joints;
	return {
		jointNodes,
		inverseBindMatrices: resolveIBMs(json, binChunk, skin),
		jointWorldMatrices: jointNodes.map((nodeIdx) => computeNodeWorldMatrix(json, nodeIdx, parentMap, worldMatrixCache)),
		meshWorldMatrix
	};
}
/** Compute rest-pose bone texture data. Each bone gets 4 vec4 (one 4×4 matrix).
*  Formula: boneMatrix[i] = inverse(meshWorld) * jointWorld[i] * IBM[i]
*  At rest pose this simplifies to identity for each bone. */
function computeBoneTextureData(skin) {
	const numBones = skin.jointNodes.length;
	const data = new F32(numBones * 16);
	const invMeshWorld = invertMat4(skin.meshWorldMatrix) ?? createIdentityMat4();
	const tmp = getLoaderTmpAnim();
	for (let i = 0; i < numBones; i++) {
		multiplyMat4IntoBuffer(tmp, 0, invMeshWorld, 0, skin.jointWorldMatrices[i], 0);
		multiplyMat4IntoBuffer(data, i * 16, tmp, 0, skin.inverseBindMatrices, i * 16);
	}
	return data;
}
var INTERP_MAP = {
	LINEAR: 0,
	STEP: 1,
	CUBICSPLINE: 2
};
var PATH_MAP = {
	translation: 0,
	rotation: 1,
	scale: 2,
	weights: 3
};
/**
* Parse glTF animation data: clips, node hierarchy, and skeleton bindings.
* Returns null if no animations, or no drivable state at all (no skeletons,
* no morphs, no pointer channels).
*
* `nodeMap` (optional) maps glTF node index → SceneNode. It's required to
* resolve KHR_animation_pointer targets that write to node properties.
*/
function parseAnimationData(json, binChunk, meshes, parentMap, worldMatrixCache, nodeMap, boneOverrides) {
	if (!json.animations || json.animations.length === 0) return null;
	let pointerChannelCount = 0;
	const clips = [];
	for (const anim of json.animations) {
		const samplers = [];
		for (const s of anim.samplers) {
			const inputAcc = resolveAccessor(json, binChunk, s.input);
			const outputAcc = resolveAccessor(json, binChunk, s.output);
			const inNorm = json.accessors[s.input]?.normalized === true;
			const outNorm = json.accessors[s.output]?.normalized === true;
			samplers.push({
				input: toSamplerFloat32(inputAcc._data, inputAcc._count, inNorm),
				output: toSamplerFloat32(outputAcc._data, outputAcc._count * outputAcc._componentCount, outNorm),
				interpolation: INTERP_MAP[s.interpolation ?? "LINEAR"] ?? 0
			});
		}
		const channels = [];
		for (const c of anim.channels) {
			const ptr = c.target?.extensions?.KHR_animation_pointer?.pointer;
			if (ptr) {
				if (!_parsePointerChannel) continue;
				const ch = _parsePointerChannel(ptr, c, nodeMap, json, meshes);
				if (ch) {
					channels.push(ch);
					pointerChannelCount++;
				}
				continue;
			}
			if (c.target.node === void 0) continue;
			const path = PATH_MAP[c.target.path];
			if (path === void 0) continue;
			channels.push({
				samplerIdx: c.sampler,
				nodeIdx: c.target.node,
				path
			});
		}
		let duration = 0;
		for (const s of samplers) if (s.input.length > 0) {
			const last = s.input[s.input.length - 1];
			if (last > duration) duration = last;
		}
		clips.push({
			name: anim.name ?? "",
			channels,
			samplers,
			duration
		});
	}
	const nodeCount = json.nodes?.length ?? 0;
	const nodes = [];
	for (let i = 0; i < nodeCount; i++) {
		const n = json.nodes[i];
		const t = n.translation ?? [
			0,
			0,
			0
		];
		const r = n.rotation ?? [
			0,
			0,
			0,
			1
		];
		const s = n.scale ?? [
			1,
			1,
			1
		];
		nodes.push({
			parentIdx: findParent(parentMap, i),
			_matrix: n.matrix,
			tx: t[0],
			ty: t[1],
			tz: t[2],
			rx: r[0],
			ry: r[1],
			rz: r[2],
			rw: r[3],
			sx: s[0],
			sy: s[1],
			sz: s[2]
		});
	}
	const nodeToMeshIndices = /* @__PURE__ */ new Map();
	let gpuIdx = 0;
	for (let ni = 0; ni < nodeCount; ni++) {
		const node = json.nodes[ni];
		if (node.mesh === void 0) continue;
		const mesh = json.meshes[node.mesh];
		const indices = [];
		for (let p = 0; p < mesh.primitives.length; p++) indices.push(gpuIdx++);
		nodeToMeshIndices.set(ni, indices);
	}
	const skeletons = [];
	for (let nodeIdx = 0; nodeIdx < nodeCount; nodeIdx++) {
		const node = json.nodes[nodeIdx];
		if (node.skin === void 0 || !json.skins) continue;
		const meshIndices = nodeToMeshIndices.get(nodeIdx);
		if (!meshIndices) continue;
		const skin = json.skins[node.skin];
		const jointNodes = skin.joints;
		const inverseBindMatrices = resolveIBMs(json, binChunk, skin);
		const meshWorldMatrix = computeNodeWorldMatrix(json, nodeIdx, parentMap, worldMatrixCache);
		const invMeshWorld = invertMat4(meshWorldMatrix) ?? createIdentityMat4();
		for (const mi of meshIndices) {
			const skeleton = meshes[mi]?.skeleton;
			if (!skeleton) continue;
			skeletons.push({
				jointNodes,
				inverseBindMatrices,
				invMeshWorld,
				boneTexture: skeleton.boneTexture,
				boneCount: jointNodes.length,
				boneMatrices: skeleton.boneMatrices,
				runtimeSkeleton: skeleton
			});
		}
	}
	const morphBindings = [];
	for (let nodeIdx = 0; nodeIdx < nodeCount; nodeIdx++) {
		const node = json.nodes[nodeIdx];
		if (node.mesh === void 0) continue;
		if (!json.meshes[node.mesh].primitives?.[0]?.targets?.length) continue;
		const meshIndices = nodeToMeshIndices.get(nodeIdx);
		if (!meshIndices) continue;
		for (const mi of meshIndices) {
			const morphTargets = meshes[mi]?.morphTargets;
			if (!morphTargets) continue;
			morphBindings.push({
				nodeIdx,
				weightsBuffer: morphTargets.weightsBuffer,
				weights: morphTargets.weights,
				targetCount: morphTargets.count,
				runtimeMorphTargets: morphTargets
			});
		}
	}
	const nodeTargets = nodeMap ?? [];
	const excludedNodeIndices = /* @__PURE__ */ new Set();
	for (const skin of json.skins ?? []) for (const ji of skin.joints ?? []) excludedNodeIndices.add(ji);
	for (let ni = 0; ni < nodeCount; ni++) {
		if (json.nodes[ni]?.skin === void 0) continue;
		let p = ni;
		while (p >= 0 && !excludedNodeIndices.has(p)) {
			excludedNodeIndices.add(p);
			p = findParent(parentMap, p);
		}
	}
	if (clips.length === 0 || skeletons.length === 0 && morphBindings.length === 0 && pointerChannelCount === 0 && !hasWritableNodeChannel(clips, nodeTargets, excludedNodeIndices)) return null;
	return {
		clips,
		nodes,
		skeletons,
		morphBindings,
		nodeTargets,
		excludedNodeIndices,
		nodeNames: (json.nodes ?? []).map((n) => n?.name),
		boneOverrides
	};
}
/** True if any clip animates a non-excluded node that has a live scene target —
*  i.e. there is at least one plain node-TRS channel the controller can write
*  back. Lets purely-skinned/morph/pointer assets short-circuit unchanged. */
function hasWritableNodeChannel(clips, nodeTargets, excludedNodeIndices) {
	for (const clip of clips) for (const ch of clip.channels) if ((ch.path === 0 || ch.path === 1 || ch.path === 2) && ch.nodeIdx >= 0 && !excludedNodeIndices.has(ch.nodeIdx) && nodeTargets[ch.nodeIdx]) return true;
	return false;
}
export { _installPointerHandlers, _installSamplerConverter, computeBoneTextureData, extractSkin, parseAnimationData };

//# sourceMappingURL=gltf-animation.js.map