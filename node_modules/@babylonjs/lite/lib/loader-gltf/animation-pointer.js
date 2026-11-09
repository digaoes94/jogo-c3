import { setSubtreeVisible } from "../scene/visibility.js";
// src/loader-gltf/animation-pointer.ts
/** Apply one base-color sample without sharing or modifying the raw glTF factor. */
function _writeBaseColorFactor(mat, out, off) {
	mat.baseColorFactor[0] = out[off];
	mat.baseColorFactor[1] = out[off + 1];
	mat.baseColorFactor[2] = out[off + 2];
	mat.baseColorFactor[3] = 1;
	if (mat.alpha !== void 0) mat.alpha = out[off + 3];
	mat._uboVersion++;
}
/** Recompute the emissive color = factor × strength after either input animates, then
*  flag the material UBO for re-upload. */
function applyEmissive(mat) {
	if (!mat._emissiveColor) return;
	const f = mat._animEmissiveFactor ?? [
		0,
		0,
		0
	];
	const s = mat._animEmissiveStrength ?? 1;
	mat._emissiveColor[0] = f[0] * s;
	mat._emissiveColor[1] = f[1] * s;
	mat._emissiveColor[2] = f[2] * s;
	mat._uboVersion++;
}
var TX_SLOT = {
	"pbrMetallicRoughness/baseColorTexture": "baseColorTexture",
	emissiveTexture: "emissiveTexture",
	normalTexture: "normalTexture",
	occlusionTexture: "ormTexture"
};
/** Resolve a glTF material-extension texture slot to the runtime PBR material's
*  mutable texture object, so a KHR_texture_transform pointer on an extension
*  texture can drive its UV transform. Only slots whose fragment actually applies
*  the per-texture UV transform are listed (others would animate a value the
*  shader ignores). */
function resolveExtTexture(mat, ext, field) {
	const m = mat;
	switch (`${ext}/${field}`) {
		case "KHR_materials_iridescence/iridescenceTexture": return privateTexture(m._iridescence, "texture");
		case "KHR_materials_iridescence/iridescenceThicknessTexture": return privateTexture(m._iridescence, "thicknessTexture");
		case "KHR_materials_anisotropy/anisotropyTexture": return privateTexture(m._anisotropy, "texture");
		case "KHR_materials_sheen/sheenColorTexture": return privateTexture(m._sheen, "texture");
		case "KHR_materials_sheen/sheenRoughnessTexture": return privateTexture(m._sheen, m._sheen?.roughnessTexture ? "roughnessTexture" : "texture");
		case "KHR_materials_clearcoat/clearcoatTexture": return privateTexture(m._clearCoat, "texture");
		case "KHR_materials_clearcoat/clearcoatRoughnessTexture": return privateTexture(m._clearCoat, "roughnessTexture");
		case "KHR_materials_clearcoat/clearcoatNormalTexture": return privateTexture(m._clearCoat, "bumpTexture");
		case "KHR_materials_specular/specularTexture": return privateTexture(m, "_metallicReflectanceTexture");
		case "KHR_materials_specular/specularColorTexture": return privateTexture(m, "_reflectanceTexture");
		case "KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture": return privateTexture(m._subsurface?.translucency, "colorTexture");
		case "KHR_materials_diffuse_transmission/diffuseTransmissionTexture": return privateTexture(m._subsurface?.translucency, "intensityTexture");
		case "KHR_materials_transmission/transmissionTexture": return privateTexture(m._subsurface?.refraction, "texture");
		case "KHR_materials_volume/thicknessTexture": return privateTexture(m._subsurface?.thickness, "texture");
		default: return;
	}
}
/** Make a material's animated texture wrapper a private copy so that mutating its
*  per-texture UV-transform fields (uOffset/uScale/uAng…) never leaks into other
*  materials that share the same cached GPU texture wrapper. This happens when one
*  image (e.g. a packed ORM/occlusion texture, or a sheen texture) is reused across
*  several materials and only some of them animate its KHR_texture_transform — the
*  shared wrapper would otherwise be mutated for all of them. The clone shares GPU
*  resources (texture/view/sampler) via object spread; only the transform fields
*  become independent. Idempotent via `_animPriv` so multiple channels
*  (offset/scale/rotation) on the same slot reuse one private wrapper.
*  @param parent - The object holding the texture slot (the material, or an extension
*  sub-object such as `material._sheen`).
*  @param key - The slot field name on `parent`. */
function privateTexture(parent, key) {
	const cur = parent?.[key];
	if (!cur) return;
	if (cur._animPriv) return cur;
	const clone = {
		...cur,
		_animPriv: true
	};
	parent[key] = clone;
	return clone;
}
/** Build an offset/scale/rotation UV-transform writer for a resolved texture. */
function uvTransformWriter(mat, tex, kind) {
	if (kind === "rotation") return {
		arity: 1,
		writer: (out, off) => {
			tex.uAng = out[off];
			mat._uboVersion++;
		}
	};
	const isScale = kind === "scale";
	return {
		arity: 2,
		writer: (out, off) => {
			if (isScale) {
				tex.uScale = out[off];
				tex.vScale = out[off + 1];
			} else {
				tex.uOffset = out[off];
				tex.vOffset = out[off + 1];
			}
			mat._uboVersion++;
		}
	};
}
var _registry = [
	[/^\/nodes\/(\d+)\/extensions\/KHR_node_visibility\/visible$/, (m, ctx) => {
		const n = ctx.nodes[+m[1]];
		if (!n) return null;
		return {
			arity: 1,
			writer: (out, off) => {
				setSubtreeVisible(n, out[off] !== 0);
			}
		};
	}],
	[/^\/materials\/(\d+)\/(pbrMetallicRoughness\/baseColorTexture|emissiveTexture|normalTexture|occlusionTexture)\/extensions\/KHR_texture_transform\/(offset|scale|rotation)$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		if (!mat) return null;
		const slot = m[2];
		const tex = privateTexture(mat, slot === "occlusionTexture" && mat.occlusionTexture ? "occlusionTexture" : TX_SLOT[slot]);
		if (!tex) return null;
		return uvTransformWriter(mat, tex, m[3]);
	}],
	[/^\/materials\/(\d+)\/extensions\/(KHR_materials_\w+)\/(\w+Texture)\/extensions\/KHR_texture_transform\/(offset|scale|rotation)$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		const tex = mat && resolveExtTexture(mat, m[2], m[3]);
		if (!mat || !tex) return null;
		return uvTransformWriter(mat, tex, m[4]);
	}],
	[/^\/materials\/(\d+)\/emissiveFactor$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		if (!mat?._emissiveColor) return null;
		return {
			arity: 3,
			writer: (out, off) => {
				mat._animEmissiveFactor = [
					out[off],
					out[off + 1],
					out[off + 2]
				];
				applyEmissive(mat);
			}
		};
	}],
	[/^\/materials\/(\d+)\/extensions\/KHR_materials_emissive_strength\/emissiveStrength$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		if (!mat?._emissiveColor) return null;
		return {
			arity: 1,
			writer: (out, off) => {
				mat._animEmissiveStrength = out[off];
				applyEmissive(mat);
			}
		};
	}],
	[/^\/materials\/(\d+)\/pbrMetallicRoughness\/baseColorFactor$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		if (!mat?.baseColorFactor) return null;
		return {
			arity: 4,
			writer: (out, off) => _writeBaseColorFactor(mat, out, off)
		};
	}]
];
/** Append extended (lazily-loaded) pointer handlers to the resolver registry.
*  Called once by animation-pointer-ext.ts on import. ES-module caching makes the
*  import idempotent, so the handlers are appended exactly once per process. */
function _appendPointerHandlers(handlers) {
	_registry.push(...handlers);
}
var _warned = /* @__PURE__ */ new Set();
function resolveAnimationPointer(pointer, ctx) {
	for (const [rx, make] of _registry) {
		const m = rx.exec(pointer);
		if (m) return make(m, ctx);
	}
	if (!_warned.has(pointer)) {
		_warned.add(pointer);
		console.warn(`[babylon-lite] KHR_animation_pointer: no handler for "${pointer}"`);
	}
	return null;
}
export { _appendPointerHandlers, _writeBaseColorFactor, resolveAnimationPointer };

//# sourceMappingURL=animation-pointer.js.map