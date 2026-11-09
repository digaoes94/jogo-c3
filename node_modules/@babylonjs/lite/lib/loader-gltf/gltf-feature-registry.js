import { mat4Determinant3 } from "../math/mat4-determinant3.js";
import { anyPrimitive, needsOrmComposite } from "./gltf-parser.js";
import { _rightHanded } from "#coordinate-system";
// src/loader-gltf/gltf-feature-registry.ts
var M = "KHR_materials_";
/** Shared with the primitive-topology trigger below, which must exclude these primitives. */
var GS = "KHR_gaussian_splatting";
var _features = [
	["EXT_meshopt_compression", () => import("./gltf-feature-meshopt.js")],
	[(j) => !!j.accessors?.some((a) => a.sparse), () => import("./gltf-feature-sparse.js")],
	["KHR_mesh_quantization", () => import("./gltf-ext-quantization.js")],
	["KHR_draco_mesh_compression", () => import("./gltf-feature-draco.js")],
	[M + "clearcoat", () => import("./gltf-ext-clearcoat.js")],
	[M + "iridescence", () => import("./gltf-ext-iridescence.js")],
	[M + "emissive_strength", () => import("./gltf-ext-emissive-strength.js")],
	[M + "sheen", () => import("./gltf-ext-sheen.js")],
	[M + "anisotropy", () => import("./gltf-ext-anisotropy.js")],
	[M + "diffuse_transmission", () => import("./gltf-ext-diffuse-transmission.js")],
	[M + "unlit", () => import("./gltf-ext-unlit.js")],
	[M + "pbrSpecularGlossiness", () => import("./gltf-ext-spec-gloss.js")],
	[(j) => [
		"transmission",
		"volume",
		"ior",
		"specular",
		"dispersion"
	].some((e) => j.extensionsUsed?.includes(M + e)), () => import("./gltf-ext-dielectric.js")],
	["KHR_texture_transform", () => import("./gltf-ext-uv-transform.js")],
	["KHR_texture_basisu", () => import("./gltf-ext-basisu.js")],
	[needsOrmComposite, () => import("./gltf-ext-orm.js")],
	[(j) => !!j.skins?.length && anyPrimitive(j, (p) => p.attributes?.JOINTS_0 !== void 0), () => import("./gltf-feature-skeleton.js")],
	[(j) => anyPrimitive(j, (p) => !!p.targets?.length), () => import("./gltf-feature-morph.js")],
	[(j) => _rightHanded || hasNegDetNode(j) || anyPrimitive(j, (p) => p.mode !== void 0 && p.mode !== 4 && !p.extensions?.[GS]), () => import("./gltf-feature-primitive.js")],
	[hasGltfExtras, () => import("./gltf-feature-extras.js")],
	["KHR_lights_punctual", () => import("./gltf-feature-lights-punctual.js")],
	[GS, () => import("./gltf-feature-gaussian-splatting.js")],
	["EXT_lights_image_based", () => import("./gltf-ext-lights-image-based.js")],
	[(j) => !!j.animations?.length, () => import("./gltf-feature-animations.js")],
	[hasNonFloatAnimSampler, () => import("./gltf-sampler-denorm.js")],
	[M + "variants", () => import("./gltf-feature-variants.js")],
	["KHR_node_visibility", () => import("./gltf-ext-node-visibility.js")],
	["KHR_animation_pointer", () => import("./gltf-feature-animation-pointer.js")],
	["EXT_mesh_gpu_instancing", () => import("./gltf-feature-gpu-instancing.js")],
	["KHR_xmp_json_ld", () => import("./gltf-feature-xmp.js")],
	[(j) => !!(j.extensions?.KHR_interactivity || j.extensions?.BABYLON_flow_graph), () => import("./gltf-feature-interactivity.js")]
];
/** Dynamic-import every feature the asset triggers. */
async function loadGltfFeatures(json) {
	const used = json.extensionsUsed ?? [];
	return (await Promise.all(_features.flatMap(([t, load]) => (typeof t === "string" ? used.includes(t) : t(json)) ? [load()] : []))).map((m) => m.default);
}
/** Run every active material feature and merge its PBR fragment. */
async function runGltfMaterialFeatures(mat, features, ctx) {
	const fragments = await Promise.all(features.map((feature) => feature.applyMaterial(mat, ctx)));
	let layers;
	for (const fragment of fragments) if (fragment) Object.assign(layers ??= {}, fragment);
	return layers;
}
function hasGltfExtras(json) {
	const hasExtras = (item) => item?.extras !== void 0;
	return [
		json.asset,
		json.nodes,
		json.materials,
		json.animations,
		json.meshes
	].flat().some(hasExtras) || anyPrimitive(json, hasExtras);
}
/** True if any animation sampler reads a non-Float32 input/output accessor (normalized BYTE/SHORT
*  rotation output, normalized UNSIGNED_BYTE flags, …) — the only case that needs the lazy sampler
*  denorm converter. Plain Float32 samplers (the overwhelming majority) skip it. */
function hasNonFloatAnimSampler(json) {
	const accessors = json.accessors;
	return !!json.animations?.some((a) => a.samplers?.some((s) => accessors[s.input]?.componentType !== 5126 || accessors[s.output]?.componentType !== 5126));
}
/** True if any node introduces a negative-determinant local transform — a
*  negative scale (odd number of negative components) or a `matrix` with a
*  negative 3x3 determinant. Such a node (or a child of one) can flip a mesh's
*  net world determinant positive, reversing its triangle winding. Gates the
*  lazy negative-winding feature so positive-scale / pure-TRS assets never load
*  it. A negative-determinant node whose meshes' net world determinant stays
*  negative over-triggers harmlessly (the feature then finds a non-positive
*  determinant per mesh and flags nothing). */
function hasNegDetNode(json) {
	return !!json.nodes?.some((n) => {
		if (n.scale) return n.scale[0] * n.scale[1] * n.scale[2] < 0;
		if (n.matrix) return mat4Determinant3(n.matrix) < 0;
		return false;
	});
}
export { loadGltfFeatures, runGltfMaterialFeatures };

//# sourceMappingURL=gltf-feature-registry.js.map