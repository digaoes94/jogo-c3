import { _rightHanded } from "#coordinate-system";
// src/material/mesh-features.ts
var MSH_HAS_TANGENTS = 1;
var MSH_HAS_SKELETON = 2;
var MSH_HAS_SKELETON_8 = 4;
var MSH_HAS_MORPH_TARGETS = 8;
var MSH_HAS_THIN_INSTANCES = 16;
var MSH_HAS_INSTANCE_COLOR = 32;
var MSH_HAS_VERTEX_COLOR = 64;
var MSH_HAS_UV2 = 128;
var MSH_RECEIVE_SHADOWS = 256;
var MSH_VAT = 512;
/** Mesh has no NORMAL attribute → must be flat-shaded (glTF spec). */
var MSH_FLAT_NORMAL = 1024;
/** Extra mesh-feature encoder installed only by runtime opt-ins such as mirrored procedural meshes. */
var _meshFeatureExtra = null;
/** @internal Install an extra mesh-feature encoder. */
function _installMeshFeatureExtra(encode) {
	const previous = _meshFeatureExtra;
	_meshFeatureExtra = previous ? (mesh) => previous(mesh) | encode(mesh) : encode;
}
/** @internal The tangent bit alone — side-effect free, unlike `_computeMeshFeatures` (see `_meshFeatureExtra`). */
function _meshTangentFeature(mesh) {
	return mesh._gpu.tangentBuffer ? 1 : 0;
}
/** @internal Compute mesh/pass feature bits shared by material renderers. */
function _computeMeshFeatures(mesh, receiveShadows = false) {
	const gpu = mesh._gpu;
	let features = _meshTangentFeature(mesh);
	if (mesh.vat) {
		features |= 512;
		if (mesh.vat.joints1Buffer) features |= 4;
	} else if (mesh.skeleton) {
		features |= 2;
		if (mesh.skeleton.joints1Buffer) features |= 4;
	}
	if (mesh.morphTargets) features |= 8;
	if (mesh.thinInstances) {
		features |= 16;
		if (mesh.thinInstances.colors) features |= 32;
	}
	if (gpu.colorBuffer) features |= 64;
	if (gpu.uv2Buffer) features |= 128;
	if (mesh._flatNormal) features |= MSH_FLAT_NORMAL;
	if (receiveShadows) features |= 256;
	if (_meshFeatureExtra) features |= _meshFeatureExtra(mesh);
	if (_rightHanded) features |= (mesh._primitiveFeatures ?? 0) & 2048;
	return features;
}
export { MSH_FLAT_NORMAL, MSH_HAS_INSTANCE_COLOR, MSH_HAS_MORPH_TARGETS, MSH_HAS_SKELETON, MSH_HAS_SKELETON_8, MSH_HAS_TANGENTS, MSH_HAS_THIN_INSTANCES, MSH_HAS_UV2, MSH_HAS_VERTEX_COLOR, MSH_RECEIVE_SHADOWS, MSH_VAT, _computeMeshFeatures, _installMeshFeatureExtra, _meshTangentFeature };

//# sourceMappingURL=mesh-features.js.map