// src/picking/picking-info.ts
/** Create an empty (miss) picking result. */
function createEmptyPickingInfo() {
	return {
		hit: false,
		distance: 0,
		pickedPoint: null,
		pickedNormal: null,
		pickedNormalWorld: null,
		pickedFaceNormal: null,
		pickedFaceNormalWorld: null,
		pickedMesh: null,
		faceId: -1,
		bu: 0,
		bv: 0,
		subMeshId: 0,
		thinInstanceIndex: -1,
		ray: null,
		_normalsInvalid: false
	};
}
export { createEmptyPickingInfo };

//# sourceMappingURL=picking-info.js.map