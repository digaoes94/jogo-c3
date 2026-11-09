import { _registerEnabledGltfFeature } from "./gltf-feature-hooks.js";
// src/loader-gltf/gltf-feature-cpu-tangents.ts
var feature = {
	id: "_cpu_tangents",
	applyMesh(meshData, mesh) {
		mesh._cpuTangents = meshData._tangents;
		return Promise.resolve();
	}
};
var enabled = false;
/** Retain authored glTF tangents on the CPU for subsequent `getMeshGeometry` calls. */
function enableGltfCpuTangents() {
	if (!enabled) {
		enabled = true;
		_registerEnabledGltfFeature((json) => json.meshes?.some((mesh) => mesh.primitives?.some((primitive) => primitive.attributes?.TANGENT !== void 0)), feature);
	}
}
export { feature as default, enableGltfCpuTangents };

//# sourceMappingURL=gltf-feature-cpu-tangents.js.map