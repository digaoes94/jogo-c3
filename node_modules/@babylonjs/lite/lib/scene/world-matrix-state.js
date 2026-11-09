import { composeMat4IntoBuffer } from "../math/compose-mat4-into-buffer.js";
import { multiplyMat4IntoBuffer } from "../math/multiply-mat4-into-buffer.js";
import { allocateMat4 } from "../math/_matrix-allocator.js";
// src/scene/world-matrix-state.ts
var WM_STATE = Symbol("wmState");
/** Tag a host object (mesh, scene node, camera, light, …) with its world-matrix
*  state so children can register for push invalidation and call its accessor
*  closures directly, bypassing the host's property getters. */
function attachWorldMatrixState(host, state) {
	host[WM_STATE] = state;
}
function peekWorldMatrixState(p) {
	if (p === null) return null;
	return p[WM_STATE] ?? null;
}
/** @internal Invalidate subtree world matrices/versions without discarding local transforms. */
function _markWorldMatrixDirty(host) {
	peekWorldMatrixState(host)?._invalidate();
}
/** @internal Invalidate a changed local transform and its subtree's world matrices. */
function _markLocalMatrixDirty(host) {
	peekWorldMatrixState(host)?.markLocalDirty();
}
/** Compose a local TRS matrix, skipping the general composition path for the default transform. */
function composeTrsLocalMatrix(position, rotation, scaling) {
	const local = allocateMat4();
	composeTrsLocalMatrixIntoBuffer(local, position, rotation, scaling);
	return local;
}
/** Compose into reusable local storage, preserving the default-transform identity fast path. */
function composeTrsLocalMatrixIntoBuffer(local, position, rotation, scaling) {
	if (position.x === 0 && position.y === 0 && position.z === 0 && rotation.x === 0 && rotation.y === 0 && rotation.z === 0 && rotation.w === 1 && scaling.x === 1 && scaling.y === 1 && scaling.z === 1) {
		local.fill(0);
		local[0] = local[5] = local[10] = local[15] = 1;
	} else composeMat4IntoBuffer(local, 0, position.x, position.y, position.z, rotation.x, rotation.y, rotation.z, rotation.w, scaling.x, scaling.y, scaling.z);
}
/**
* Create world matrix state for any entity type.
*
* @param getLocalMatrix - Entity-specific function that returns the local (pre-parent)
*   transform matrix. Called on first use and after markLocalDirty(), not ancestor motion.
*/
function createWorldMatrixState(getLocalMatrix) {
	let _worldVersion = 0;
	let _lastSeenParentVersion = -1;
	let _cachedLocal = null;
	let _cachedWorld = null;
	const _ownedWorld = allocateMat4();
	let _parent = null;
	let _parentState = null;
	const _children = [];
	function invalidate() {
		_cachedWorld = null;
		_worldVersion++;
		for (const child of _children) child._invalidate();
	}
	function pollForeignParent() {
		const pv = _parent.worldMatrixVersion;
		if (pv !== _lastSeenParentVersion) {
			_lastSeenParentVersion = pv;
			invalidate();
		}
	}
	const state = {
		get parent() {
			return _parent;
		},
		set parent(p) {
			if (p === _parent) return;
			if (_parentState !== null) _parentState._removeChild(state);
			_parent = p;
			_parentState = peekWorldMatrixState(p);
			if (_parentState !== null) _parentState._addChild(state);
			_lastSeenParentVersion = -1;
			invalidate();
		},
		markLocalDirty() {
			_cachedLocal = null;
			invalidate();
		},
		getWorldMatrix() {
			if (_parentState === null && _parent !== null) pollForeignParent();
			if (_cachedWorld !== null) return _cachedWorld;
			const local = _cachedLocal ??= getLocalMatrix();
			if (_parent !== null) {
				const pw = _parent.worldMatrix;
				multiplyMat4IntoBuffer(_ownedWorld, 0, pw, 0, local, 0);
				_cachedWorld = _ownedWorld;
			} else _cachedWorld = local;
			return _cachedWorld;
		},
		getWorldMatrixVersion() {
			if (_parentState === null && _parent !== null) pollForeignParent();
			return _worldVersion;
		},
		_invalidate: invalidate,
		_addChild(child) {
			_children.push(child);
		},
		_removeChild(child) {
			const i = _children.indexOf(child);
			if (i >= 0) _children.splice(i, 1);
		}
	};
	return state;
}
export { _markLocalMatrixDirty, _markWorldMatrixDirty, attachWorldMatrixState, composeTrsLocalMatrix, composeTrsLocalMatrixIntoBuffer, createWorldMatrixState };

//# sourceMappingURL=world-matrix-state.js.map