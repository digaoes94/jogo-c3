// src/material/pbr/pbr-group-builder.ts
var _pbrGroupBuilder = null;
/** Lazily create the shared PBR group builder without retaining the user-material factory. */
function getPbrGroupBuilder() {
	if (_pbrGroupBuilder) return _pbrGroupBuilder;
	const builder = async (scene, meshes) => {
		const envTex = scene._envTextures;
		const result = await (await import("./pbr-renderable.js")).buildPbrRenderables(scene, meshes, envTex);
		builder._rebuildSingle = result.rebuildSingle;
		return result;
	};
	builder._materialFamily = "pbr";
	return _pbrGroupBuilder = builder;
}
export { getPbrGroupBuilder };

//# sourceMappingURL=pbr-group-builder.js.map