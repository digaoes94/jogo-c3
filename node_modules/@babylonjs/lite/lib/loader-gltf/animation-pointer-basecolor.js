import { _writeBaseColorFactor } from "./animation-pointer.js";
// src/loader-gltf/animation-pointer-basecolor.ts
var _animBaseColorDefs = null;
/** Record each animated material definition before default and variant assembly start. */
function collectBaseColorDefs(json) {
	for (const anim of json.animations ?? []) for (const ch of anim.channels ?? []) {
		const ptr = ch.target?.extensions?.KHR_animation_pointer?.pointer;
		const m = ptr && /^\/materials\/(\d+)\/pbrMetallicRoughness\/baseColorFactor$/.exec(ptr);
		const def = m && json.materials?.[+m[1]];
		if (def && !_animBaseColorDefs?.has(def)) (_animBaseColorDefs ??= /* @__PURE__ */ new WeakMap()).set(def, []);
	}
}
/** Seed every animated slot and register its built copy. Untextured materials need a
*  white fallback so their RGB factor is applied only by the animated uniform. */
function prepareMaterial(mat) {
	const targets = _animBaseColorDefs?.get(mat._rawMatDef);
	if (!targets) return null;
	mat._onMaterialCreated = (material) => {
		targets.push(material);
	};
	const f = mat._baseColorFactor;
	if (!mat._baseColorImage) mat._baseColorFactor = [
		1,
		1,
		1,
		1
	];
	return {
		baseColorFactor: [
			f[0],
			f[1],
			f[2],
			1
		],
		...mat._alphaMode === "BLEND" || mat._alphaMode === "MASK" ? { alpha: f[3] } : void 0
	};
}
function resolveBaseColorPointer(ptr, json) {
	const match = /^\/materials\/(\d+)\/pbrMetallicRoughness\/baseColorFactor$/.exec(ptr);
	const def = match && json.materials?.[+match[1]];
	const targets = _animBaseColorDefs?.get(def);
	if (!targets) return null;
	return {
		arity: 4,
		writer: (out, off) => {
			for (const material of targets) _writeBaseColorFactor(material, out, off);
		}
	};
}
export { collectBaseColorDefs, prepareMaterial, resolveBaseColorPointer };

//# sourceMappingURL=animation-pointer-basecolor.js.map