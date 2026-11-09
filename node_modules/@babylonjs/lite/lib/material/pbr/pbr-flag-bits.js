// src/material/pbr/pbr-flag-bits.ts
var PBR_HAS_NORMAL_MAP = 1;
var PBR_HAS_EMISSIVE = 2;
var PBR_HAS_ENV = 4;
var PBR_HAS_ALPHA_TEST = 8;
var PBR_HAS_TONEMAP = 16;
/** Scene has fog enabled (scene.fog != null). A scene-feature bit (threaded via
*  sceneFeatures), gating the PBR fog blend + calcFogFactor helper into the shader.
*  Compile-time gated so non-fog PBR scenes stay byte-identical.
*  Material features bit 5 is separately reserved by parallax-occlusion-fragment.ts. */
var PBR_HAS_FOG = 32;
var PBR_HAS_ALPHA_BLEND = 64;
var PBR_HAS_SPEC_GLOSS = 128;
var PBR_HAS_DOUBLE_SIDED = 256;
var PBR_HAS_COTANGENT_NORMAL = 512;
var PBR_HAS_METALLIC_REFLECTANCE_MAP = 1024;
var PBR_HAS_REFLECTANCE_MAP = 2048;
var PBR_HAS_USE_ALPHA_ONLY_MR = 4096;
var PBR_HAS_OCCLUSION = 32768;
var PBR_HAS_SPECULAR_AA = 1 << 17;
var PBR_HAS_EMISSIVE_COLOR = 1 << 21;
var PBR_HAS_SHEEN = 1 << 22;
var PBR_HAS_GAMMA_ALBEDO = 1 << 25;
var PBR_HAS_ANISOTROPY = 1 << 26;
var PBR_HAS_SUBSURFACE = 1 << 27;
var PBR_HAS_THICKNESS_MAP = 1 << 28;
var PBR_HAS_SKYBOX = 1 << 29;
/** Material has KHR_materials_transmission (refraction through surface). */
var PBR2_HAS_REFRACTION = 16;
/** Any bound texture on this material carries a non-identity UV transform
*  (`uScale/vScale/uOffset/vOffset/uAng` on its Texture2D). Enables per-
*  texture UV-transform UBO fields + `txfUV` wrapping in the shader. */
var PBR2_HAS_UV_TRANSFORM = 512;
/** Material has non-default metallicF0Factor or metallicReflectanceColor
*  without reflectance textures (factor-only KHR_materials_specular). */
var PBR2_HAS_REFLECTANCE_FACTORS = 1024;
/** Material samples occlusion from TEXCOORD_1 when the mesh provides UV2. */
var PBR2_HAS_UV2 = 2048;
/** Material multiplies textured albedo by a non-default glTF baseColorFactor. */
var PBR2_HAS_BASE_COLOR_FACTOR = 4096;
/** Material view runs the fragment shader but declares no color output. */
var PBR2_NO_COLOR_OUTPUT = 32768;
/** Material view runs discard/clip logic and writes exponential shadow-map color. */
var PBR2_ESM_SHADOW_OUTPUT = 65536;
export { PBR2_ESM_SHADOW_OUTPUT, PBR2_HAS_BASE_COLOR_FACTOR, PBR2_HAS_REFLECTANCE_FACTORS, PBR2_HAS_REFRACTION, PBR2_HAS_UV2, PBR2_HAS_UV_TRANSFORM, PBR2_NO_COLOR_OUTPUT, PBR_HAS_ALPHA_BLEND, PBR_HAS_ALPHA_TEST, PBR_HAS_ANISOTROPY, PBR_HAS_COTANGENT_NORMAL, PBR_HAS_DOUBLE_SIDED, PBR_HAS_EMISSIVE, PBR_HAS_EMISSIVE_COLOR, PBR_HAS_ENV, PBR_HAS_FOG, PBR_HAS_GAMMA_ALBEDO, PBR_HAS_METALLIC_REFLECTANCE_MAP, PBR_HAS_NORMAL_MAP, PBR_HAS_OCCLUSION, PBR_HAS_REFLECTANCE_MAP, PBR_HAS_SHEEN, PBR_HAS_SKYBOX, PBR_HAS_SPECULAR_AA, PBR_HAS_SPEC_GLOSS, PBR_HAS_SUBSURFACE, PBR_HAS_THICKNESS_MAP, PBR_HAS_TONEMAP, PBR_HAS_USE_ALPHA_ONLY_MR };

//# sourceMappingURL=pbr-flag-bits.js.map