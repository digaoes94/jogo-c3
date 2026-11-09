// src/material/standard/standard-flags.ts
var HAS_DIFFUSE_TEXTURE = 1;
var HAS_EMISSIVE_TEXTURE = 2;
var HAS_BUMP_TEXTURE = 4;
var HAS_SPECULAR_TEXTURE = 8;
var HAS_AMBIENT_TEXTURE = 16;
var HAS_LIGHTMAP_TEXTURE = 32;
var HAS_OPACITY_TEXTURE = 64;
var LIGHTMAP_USES_UV2 = 128;
var AMBIENT_USES_UV2 = 256;
var DOUBLE_SIDED = 512;
var DIFFUSE_USES_UV2 = 1024;
var SPECULAR_USES_UV2 = 2048;
var OPACITY_FROM_RGB = 4096;
var HAS_REFLECTION_TEXTURE = 8192;
var DISABLE_LIGHTING = 16384;
var MATERIAL_ALPHA_BLEND = 65536;
var HAS_CUBE_REFLECTION = 1 << 17;
var NO_COLOR_OUTPUT = 1 << 18;
var HAS_DEPTH_EMISSIVE_TEXTURE = 1 << 19;
var ESM_SHADOW_OUTPUT = 1 << 20;
var GEOMETRY_OUTPUT = 1 << 21;
/** Lightmap is used as a baked shadowmap: multiplies the final color instead of adding. */
var LIGHTMAP_SHADOWMAP = 32768;
/** Lightmap UVs are V-flipped (BJS Texture.uAng === π → uv'=(u, 1-v)). */
var LIGHTMAP_FLIP_V = 1 << 22;
/** RGBA mesh vertex color drives alpha (Babylon `VERTEXALPHA`). Set only when a
*  vertex-colour buffer exists and the mesh explicitly opts in via
*  `mesh.hasVertexAlpha`. Gates the vertex-colour fragment's `alpha *= vColor.a` +
*  vertex-alpha alpha-test; without it mesh vertex colour is RGB-only. Kept distinct
*  from `MATERIAL_ALPHA_BLEND`, which is also used by material and thin-instance
*  alpha, so those sources never create a redundant vertex-colour shader variant. */
var VERTEX_ALPHA = 1 << 24;
/** Mesh uses skeletal skinning. Enabled through the Standard mesh-feature subpath. */
var HAS_SKELETON = 1 << 26;
/** Skinned mesh has a second JOINTS/WEIGHTS set. */
var HAS_SKELETON_8 = 1 << 27;
/** Scene contributes Standard fog WGSL. Kept separate from material/mesh bits. */
var STD_SCENE_FOG = 1;
/** @internal Nullable scalar shader-source transport, installed by scene-lighting enablers only. */
var _stdSceneLightingSource = null;
/** @internal No scene or branch-gating shader context crosses this seam. */
function _installStandardLightingSource() {
	_stdSceneLightingSource = (source) => source;
}
/** @internal Optional material-specific shader identity, installed by opt-in extensions. */
var _stdMaterialVariantKey = null;
/** @internal Install material-variant cache keying without adding an extension scan to the core. */
function _installStdMaterialVariantKey(resolve) {
	_stdMaterialVariantKey = resolve;
}
var _stdExts = null;
var _stdExtsSorted = null;
function _registerStdExt(ext) {
	(_stdExts ??= /* @__PURE__ */ new Map()).set(ext._id, ext);
	_stdExtsSorted = null;
}
function _getStdExts() {
	return _stdExts ??= /* @__PURE__ */ new Map();
}
function _getStdExtsSorted() {
	if (!_stdExtsSorted) {
		const map = _stdExts;
		_stdExtsSorted = map ? Array.from(map.values()).sort((a, b) => a._id.localeCompare(b._id)) : [];
	}
	return _stdExtsSorted;
}
/** Derived: mesh needs UV attribute (any texture present). */
var NEEDS_UV = 127;
/** Derived: mesh needs UV2 attribute. */
var NEEDS_UV2 = 3456;
export { AMBIENT_USES_UV2, DIFFUSE_USES_UV2, DISABLE_LIGHTING, DOUBLE_SIDED, ESM_SHADOW_OUTPUT, GEOMETRY_OUTPUT, HAS_AMBIENT_TEXTURE, HAS_BUMP_TEXTURE, HAS_CUBE_REFLECTION, HAS_DEPTH_EMISSIVE_TEXTURE, HAS_DIFFUSE_TEXTURE, HAS_EMISSIVE_TEXTURE, HAS_LIGHTMAP_TEXTURE, HAS_OPACITY_TEXTURE, HAS_REFLECTION_TEXTURE, HAS_SKELETON, HAS_SKELETON_8, HAS_SPECULAR_TEXTURE, LIGHTMAP_FLIP_V, LIGHTMAP_SHADOWMAP, LIGHTMAP_USES_UV2, MATERIAL_ALPHA_BLEND, NEEDS_UV, NEEDS_UV2, NO_COLOR_OUTPUT, OPACITY_FROM_RGB, SPECULAR_USES_UV2, STD_SCENE_FOG, VERTEX_ALPHA, _getStdExts, _getStdExtsSorted, _installStandardLightingSource, _installStdMaterialVariantKey, _registerStdExt, _stdMaterialVariantKey, _stdSceneLightingSource };

//# sourceMappingURL=standard-flags.js.map