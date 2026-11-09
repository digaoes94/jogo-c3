import { F32 } from "../engine/typed-arrays.js";
import { composeMat4IntoBuffer } from "../math/compose-mat4-into-buffer.js";
import { _installBoneControl } from "./bone-control-hooks.js";
import { invertMat4 } from "../math/invert-mat4.js";
import { createIdentityMat4 } from "../math/create-identity-mat4.js";
import { computeNodeWorldMatrix, findParent, resolveAccessor } from "../loader-gltf/gltf-parser.js";
import { computeNodeWorldMatrices, computeTopoOrder, resetTRS, writeBoneTextures } from "./skeleton-pose.js";
import { _rightHanded } from "#coordinate-system";
// src/skeleton/bone-control.ts
/** Opt-in bone control for skinned glTF models.
*
*  Call `enableBoneControl()` once (before loading skinned assets) to populate
*  `AssetContainer.skeletons` with a {@link Skeleton} per glTF skin. You can then
*  override any bone's local transform via the `setBone*` functions. Overrides:
*    • are baked into the bone matrices immediately (works even with no animation), and
*    • are re-applied every animation frame BEFORE channel evaluation — so a clip
*      that animates the same bone overwrites the override (animation wins), while a
*      bone the clip does not touch keeps the override.
*  This is exactly the Babylon.js "scale a bone to 0 to hide its sub-tree" workflow.
*
*  Opt-in & near-zero-cost when unused: the always-fetched skeleton/animation chunk
*  references this module only through the two null hooks in `bone-control-hooks.ts`.
*  Until `enableBoneControl()` is imported + called, the tree-shaker folds this whole
*  module (handle building, skin extraction, eager bake, override application) away.
*
*  Standalone functions, zero methods — idiomatic Lite, fully tree-shakeable. */
/** Find a bone by its (glTF joint node) name. Returns `undefined` if not present.
*  When several joints share a name, the first in joint order is returned. */
function getBoneByName(skeleton, name) {
	return skeleton._byName.get(name);
}
/** Public skeleton driving this mesh, if glTF bone control was enabled before loading. */
function getMeshSkeleton(mesh) {
	return mesh.skeleton?._skeleton;
}
function ensureOverride(skeleton, bone) {
	let o = skeleton._overrides.get(bone._nodeIndex);
	if (!o) {
		o = {
			mask: 0,
			tx: 0,
			ty: 0,
			tz: 0,
			rx: 0,
			ry: 0,
			rz: 0,
			rw: 1,
			sx: 1,
			sy: 1,
			sz: 1
		};
		skeleton._overrides.set(bone._nodeIndex, o);
	}
	return o;
}
/** Override a bone's local translation, then re-bake. Ignored each frame for a
*  bone whose translation the playing clip animates. */
function setBonePosition(skeleton, bone, x, y, z) {
	const o = ensureOverride(skeleton, bone);
	o.tx = x;
	o.ty = y;
	o.tz = z;
	o.mask |= 1;
	skeleton._bake();
}
/** Override a bone's local rotation (quaternion), then re-bake. Ignored each frame
*  for a bone whose rotation the playing clip animates. */
function setBoneRotationQuaternion(skeleton, bone, x, y, z, w) {
	const o = ensureOverride(skeleton, bone);
	o.rx = x;
	o.ry = y;
	o.rz = z;
	o.rw = w;
	o.mask |= 2;
	skeleton._bake();
}
/** Override a bone's local scale, then re-bake. Ignored each frame for a bone
*  whose scale the playing clip animates. */
function setBoneScaling(skeleton, bone, x, y, z) {
	const o = ensureOverride(skeleton, bone);
	o.sx = x;
	o.sy = y;
	o.sz = z;
	o.mask |= 4;
	skeleton._bake();
}
/** Show or hide the sub-tree driven by a bone, the Babylon.js way: hiding scales
*  the bone to zero (collapsing it and its descendant bones to a point so the
*  skinned triangles degenerate and disappear).
*
*  Unlike {@link setBoneScaling}, visibility is **not** a transform override that
*  animation can overwrite — it is re-applied AFTER channel evaluation, so a hidden
*  bone stays hidden while clips play. This matters in practice because most rigs
*  (every Mixamo export, for instance) bake a constant scale track onto every bone,
*  which would otherwise restore the bone to full size on the next frame.
*
*  Showing clears only the hidden state; any explicit {@link setBoneScaling} override
*  is left untouched. */
function setBoneVisible(skeleton, bone, visible) {
	if (!visible) {
		const o = ensureOverride(skeleton, bone);
		o.mask |= 8;
		skeleton._bake();
		return;
	}
	const o = skeleton._overrides.get(bone._nodeIndex);
	if (o && o.mask & 8) {
		o.mask &= -9;
		if (o.mask === 0) skeleton._overrides.delete(bone._nodeIndex);
		skeleton._bake();
	}
}
/** Override a bone's local translation + rotation together **without** re-baking.
*  For per-frame drivers that pose many bones each frame (e.g. WebXR hand tracking):
*  call this for every bone, then {@link bakeSkeleton} once to recompute + upload the
*  skin a single time, instead of paying a full bake per {@link setBonePosition} /
*  {@link setBoneRotationQuaternion} call. Like those setters, each masked component is
*  overwritten every frame by a clip that animates the same bone. */
function setBonePoseDeferred(skeleton, bone, px, py, pz, rx, ry, rz, rw) {
	const o = ensureOverride(skeleton, bone);
	o.tx = px;
	o.ty = py;
	o.tz = pz;
	o.rx = rx;
	o.ry = ry;
	o.rz = rz;
	o.rw = rw;
	o.mask |= 3;
}
/** Override a glTF bone from an absolute Lite world-space position and rotation
*  without re-baking. The loader's handedness reflection is applied internally.
*  Use this for world-space pose drivers such as physics ragdolls: update every
*  driven bone, then call {@link bakeSkeleton} once for the complete batch.
*  @param skeleton - Skeleton containing the bone.
*  @param bone - Bone to override.
*  @param px - World-space X position.
*  @param py - World-space Y position.
*  @param pz - World-space Z position.
*  @param rx - World-space quaternion X component.
*  @param ry - World-space quaternion Y component.
*  @param rz - World-space quaternion Z component.
*  @param rw - World-space quaternion W component.
*  @public */
function setBoneWorldPoseDeferred(skeleton, bone, px, py, pz, rx, ry, rz, rw) {
	let world = skeleton._worldOverrides.get(bone._nodeIndex);
	if (!world) {
		world = new F32(16);
		skeleton._worldOverrides.set(bone._nodeIndex, world);
	}
	composeMat4IntoBuffer(world, 0, px, py, pz, rx, ry, rz, rw, _rightHanded ? 1 : -1, 1, 1);
}
/** Recompute a skeleton's node hierarchy from rest + overrides and upload its bone
*  matrices. Pair with {@link setBonePoseDeferred} (which skips baking) to apply a
*  batch of per-frame bone edits with a single GPU upload. */
function bakeSkeleton(skeleton) {
	skeleton._bake();
}
/** Remove all overrides for a bone, reverting it to animation / rest pose, then re-bake. */
function clearBoneOverride(skeleton, bone) {
	const localCleared = skeleton._overrides.delete(bone._nodeIndex);
	const worldCleared = skeleton._worldOverrides.delete(bone._nodeIndex);
	if (localCleared || worldCleared) skeleton._bake();
}
/** Per-frame applier hook. Two phases:
*   • `hiddenOnly` unset — write the masked translation/rotation/scale overrides into the
*     working buffer after the rest reset, before channel eval (so animation wins).
*   • `hiddenOnly = true` — collapse hidden bones to zero scale after channel eval, so
*     `setBoneVisible` survives clips that animate the bone's scale. */
function applyOverridesToTRS(overrides, currentTRS, numNodes, hiddenOnly) {
	for (const [ni, o] of overrides) {
		if (ni < 0 || ni >= numNodes) continue;
		const off = ni * 12;
		const m = o.mask;
		if (hiddenOnly === true) {
			if (m & 8) {
				currentTRS[off + 7] = 0;
				currentTRS[off + 7 + 1] = 0;
				currentTRS[off + 7 + 2] = 0;
			}
			continue;
		}
		if (m & 1) {
			currentTRS[off + 0] = o.tx;
			currentTRS[off + 0 + 1] = o.ty;
			currentTRS[off + 0 + 2] = o.tz;
		}
		if (m & 2) {
			currentTRS[off + 3] = o.rx;
			currentTRS[off + 3 + 1] = o.ry;
			currentTRS[off + 3 + 2] = o.rz;
			currentTRS[off + 3 + 3] = o.rw;
		}
		if (m & 4) {
			currentTRS[off + 7] = o.sx;
			currentTRS[off + 7 + 1] = o.sy;
			currentTRS[off + 7 + 2] = o.sz;
		}
	}
}
function buildRestNodes(json, parentMap) {
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
	return nodes;
}
function resolveIBMs(json, binChunk, skin) {
	const jointCount = skin.joints.length;
	if (skin.inverseBindMatrices !== void 0) {
		const ibm = resolveAccessor(json, binChunk, skin.inverseBindMatrices);
		return new F32(ibm._data.buffer, ibm._data.byteOffset, jointCount * 16);
	}
	const out = new F32(jointCount * 16);
	for (let i = 0; i < jointCount; i++) {
		const o = i * 16;
		out[o] = out[o + 5] = out[o + 10] = out[o + 15] = 1;
	}
	return out;
}
function buildNodeToMeshIndices(json) {
	const nodeCount = json.nodes?.length ?? 0;
	const map = /* @__PURE__ */ new Map();
	let gpuIdx = 0;
	for (let ni = 0; ni < nodeCount; ni++) {
		const node = json.nodes[ni];
		if (node.mesh === void 0) continue;
		const indices = [];
		for (let p = 0; p < json.meshes[node.mesh].primitives.length; p++) indices.push(gpuIdx++);
		map.set(ni, indices);
	}
	return map;
}
function extractSkinGroups(json, binChunk, meshes, parentMap, worldMatrixCache) {
	const nodeCount = json.nodes?.length ?? 0;
	const nodeToMeshIndices = buildNodeToMeshIndices(json);
	const groups = [];
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
		const bindings = [];
		for (const mi of meshIndices) {
			const skeleton = meshes[mi]?.skeleton;
			if (!skeleton) continue;
			bindings.push({
				jointNodes,
				inverseBindMatrices,
				invMeshWorld,
				boneTexture: skeleton.boneTexture,
				boneCount: jointNodes.length,
				boneMatrices: skeleton.boneMatrices,
				runtimeSkeleton: skeleton
			});
		}
		if (bindings.length > 0) groups.push({
			jointNodes,
			bindings
		});
	}
	return groups;
}
/** Builder hook: construct a public `Skeleton` per glTF skin, each with an eager
*  bake closure that recomputes the node hierarchy from rest + overrides and
*  uploads that skin's bone textures (so overrides apply even with no animation). */
async function buildSkeletons(ctx, meshes, overrides) {
	const { _json: json, _binChunk: binChunk, _engine: engine, _parentMap: parentMap, _worldMatrixCache: worldMatrixCache } = ctx;
	const groups = extractSkinGroups(json, binChunk, meshes, parentMap, worldMatrixCache);
	if (groups.length === 0) return {};
	const nodes = buildRestNodes(json, parentMap);
	const numNodes = nodes.length;
	const topoOrder = computeTopoOrder(nodes);
	const currentTRS = new F32(numNodes * 12);
	const localMat = new F32(numNodes * 16);
	const worldMat = new F32(numNodes * 16);
	const worldOverrides = /* @__PURE__ */ new Map();
	const device = engine._device;
	const allBindings = groups.flatMap((g) => g.bindings);
	const bake = () => {
		resetTRS(nodes, numNodes, currentTRS);
		if (overrides.size > 0) {
			applyOverridesToTRS(overrides, currentTRS, numNodes);
			applyOverridesToTRS(overrides, currentTRS, numNodes, true);
		}
		computeNodeWorldMatrices(nodes, numNodes, topoOrder, currentTRS, localMat, worldMat, worldOverrides);
		writeBoneTextures(device, allBindings, worldMat);
	};
	return { skeletons: groups.map((g) => {
		const bones = [];
		const byName = /* @__PURE__ */ new Map();
		const byNode = /* @__PURE__ */ new Map();
		for (const ni of g.jointNodes) {
			const bone = {
				name: json.nodes?.[ni]?.name ?? `bone_${ni}`,
				parent: null,
				_nodeIndex: ni
			};
			bones.push(bone);
			byNode.set(ni, bone);
			if (!byName.has(bone.name)) byName.set(bone.name, bone);
		}
		for (const bone of bones) {
			let parent = parentMap.get(bone._nodeIndex);
			while (parent !== void 0 && !byNode.has(parent)) parent = parentMap.get(parent);
			bone.parent = parent === void 0 ? null : byNode.get(parent);
		}
		const skeleton = {
			bones,
			_byName: byName,
			_overrides: overrides,
			_worldOverrides: worldOverrides,
			_bake: bake
		};
		for (const binding of g.bindings) {
			binding.runtimeSkeleton._overrides = overrides;
			binding.runtimeSkeleton._skeleton = skeleton;
		}
		return skeleton;
	}) };
}
/**
* Enable bone control for skinned glTF models. Call once, before loading the
* assets you want to control. After loading, read `container.skeletons` and drive
* bones with {@link getBoneByName} + the `setBone*` functions.
*
* ```ts
* enableBoneControl(); // ← opt-in, before loadGltf
* const character = await loadGltf(engine, "character.glb");
* addToScene(scene, character);
* const skel = character.skeletons![0];
* const head = getBoneByName(skel, "Head");
* if (head) setBoneVisible(skel, head, false); // hide the head + everything under it
* ```
*
* Process-global and idempotent. Skinned scenes that never call this are
* unaffected (near byte-identical to a build without bone control).
*
* @public
*/
function enableBoneControl() {
	_installBoneControl(buildSkeletons, applyOverridesToTRS);
}
export { bakeSkeleton, clearBoneOverride, enableBoneControl, getBoneByName, getMeshSkeleton, setBonePoseDeferred, setBonePosition, setBoneRotationQuaternion, setBoneScaling, setBoneVisible, setBoneWorldPoseDeferred };

//# sourceMappingURL=bone-control.js.map