import "../animation/types.js";
import { resolveAnimationPointer } from "./animation-pointer.js";
import { _installPointerHandlers } from "./gltf-animation.js";
import "./gltf-sampler-denorm.js";
// src/loader-gltf/gltf-feature-animation-pointer.ts
var NODE_TRS_PATH = {
	translation: 0,
	rotation: 1,
	scale: 2,
	weights: 3
};
var _matMapKey = null;
var _matMap = [];
var _LIGHT_POINTER_RE = /^\/extensions\/KHR_lights_punctual\/lights\/\d+\/(?:color|intensity|range|spot\/outerConeAngle)$/;
var _MAT_EXT_POINTER_RE = /^\/materials\/\d+\/(?:pbrMetallicRoughness\/metallicFactor|normalTexture\/scale|occlusionTexture\/strength|extensions\/KHR_materials_(?:transmission|ior|volume|iridescence)\/)/;
var _BASE_COLOR_POINTER_RE = /^\/materials\/\d+\/pbrMetallicRoughness\/baseColorFactor$/;
var _UV_TX_POINTER_RE = /^\/materials\/(\d+)\/.*\/KHR_texture_transform\/(?:offset|scale|rotation)$/;
var _seeders = null;
var _baseColorMod = null;
var _uvTransformMod = null;
function materialMap(json, meshes) {
	if (meshes === _matMapKey) return _matMap;
	_matMapKey = meshes;
	const map = [];
	const baseColorAnimated = /* @__PURE__ */ new Set();
	const uvTransformAnimated = /* @__PURE__ */ new Set();
	for (const anim of json.animations ?? []) for (const ch of anim.channels ?? []) {
		const ptr = ch.target?.extensions?.KHR_animation_pointer?.pointer;
		const m = ptr && /^\/materials\/(\d+)\/pbrMetallicRoughness\/baseColorFactor$/.exec(ptr);
		if (m) baseColorAnimated.add(+m[1]);
		const tx = ptr && _UV_TX_POINTER_RE.exec(ptr);
		if (tx) uvTransformAnimated.add(+tx[1]);
	}
	const nodes = json.nodes ?? [];
	let gpuIdx = 0;
	for (let ni = 0; ni < nodes.length; ni++) {
		const meshRef = nodes[ni]?.mesh;
		if (meshRef === void 0) continue;
		const prims = json.meshes?.[meshRef]?.primitives ?? [];
		for (let p = 0; p < prims.length; p++) {
			const matIdx = prims[p]?.material;
			const mesh = meshes[gpuIdx++];
			if (matIdx !== void 0 && mesh) {
				const pm = mesh.material;
				const def = json.materials?.[matIdx];
				if (def && pm._emissiveColor) {
					const ef = def.emissiveFactor ?? [
						0,
						0,
						0
					];
					pm._animEmissiveFactor = [
						ef[0] ?? 0,
						ef[1] ?? 0,
						ef[2] ?? 0
					];
					pm._animEmissiveStrength = def.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? 1;
				}
				if (baseColorAnimated.has(matIdx) && !pm.baseColorFactor) {
					const bcf = def?.pbrMetallicRoughness?.baseColorFactor ?? [
						1,
						1,
						1,
						1
					];
					pm.baseColorFactor = [
						bcf[0] ?? 1,
						bcf[1] ?? 1,
						bcf[2] ?? 1,
						1
					];
				}
				if (uvTransformAnimated.has(matIdx)) _uvTransformMod.enableMaterialUvTransform(pm);
				map[matIdx] = pm;
			}
		}
	}
	_seeders?.get(json)?.(map);
	_matMap = map;
	return map;
}
_installPointerHandlers((ptr, c, nodeMap, json, meshes) => {
	if (!nodeMap) return null;
	const trs = /^\/nodes\/(\d+)\/(translation|rotation|scale|weights)$/.exec(ptr);
	if (trs) return {
		samplerIdx: c.sampler,
		nodeIdx: +trs[1],
		path: NODE_TRS_PATH[trs[2]]
	};
	const resolved = _BASE_COLOR_POINTER_RE.test(ptr) ? _baseColorMod.resolveBaseColorPointer(ptr, json) : resolveAnimationPointer(ptr, {
		nodes: nodeMap,
		materials: materialMap(json, meshes),
		_json: json
	});
	if (!resolved) return null;
	return {
		samplerIdx: c.sampler,
		nodeIdx: -1,
		path: 4,
		pointerWriter: resolved.writer,
		pointerArity: resolved.arity
	};
});
var feature = {
	id: "KHR_animation_pointer",
	async preParse(json) {
		let hasLightPointer = false;
		let hasMatExtPointer = false;
		let hasBaseColorPointer = false;
		let hasUvTransformPointer = false;
		for (const anim of json.animations ?? []) for (const ch of anim.channels ?? []) {
			const ptr = ch.target?.extensions?.KHR_animation_pointer?.pointer;
			if (!ptr) continue;
			if (_BASE_COLOR_POINTER_RE.test(ptr)) hasBaseColorPointer = true;
			if (_LIGHT_POINTER_RE.test(ptr)) hasLightPointer = true;
			if (_MAT_EXT_POINTER_RE.test(ptr)) hasMatExtPointer = true;
			if (_UV_TX_POINTER_RE.test(ptr)) hasUvTransformPointer = true;
		}
		if (hasBaseColorPointer) {
			_baseColorMod = await import("./animation-pointer-basecolor.js");
			_baseColorMod.collectBaseColorDefs(json);
		}
		if (hasLightPointer) await import("./animation-pointer-lights.js");
		if (hasMatExtPointer) {
			const seeder = await (await import("./animation-pointer-ext.js")).prepareExtMaterials(json);
			(_seeders ??= /* @__PURE__ */ new WeakMap()).set(json, seeder);
		}
		if (hasUvTransformPointer) _uvTransformMod = await import("../material/pbr/enable-material-uv-transform.js");
	},
	async applyMaterial(mat) {
		return _baseColorMod?.prepareMaterial(mat) ?? null;
	}
};
export { feature as default };

//# sourceMappingURL=gltf-feature-animation-pointer.js.map