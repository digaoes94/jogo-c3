import { _appendPointerHandlers } from "./animation-pointer.js";
// src/loader-gltf/animation-pointer-ext.ts
/** KHR_animation_pointer — material factor / extension pointer writers + seeding.
*
*  Holds the metallic / normalScale / occlusion / transmission / IOR / volume /
*  iridescence pointer writers and the load-time material seeding they need. This
*  module is dynamic-imported by the animation-pointer feature ONLY when a channel
*  targets one of these material pointers, so scenes that animate just node TRS /
*  visibility / base-color / UV transforms / lights never pay for it. On import it
*  appends its handlers to the shared resolver registry. */
/** Scan the asset's pointer channels for the material-extension families this module seeds. */
function animatedTargets(json) {
	const occlusionStrength = /* @__PURE__ */ new Set();
	const transmission = /* @__PURE__ */ new Set();
	const ior = /* @__PURE__ */ new Set();
	const volumeThickness = /* @__PURE__ */ new Set();
	const volumeTint = /* @__PURE__ */ new Set();
	for (const anim of json.animations ?? []) for (const ch of anim.channels ?? []) {
		const ptr = ch.target?.extensions?.KHR_animation_pointer?.pointer;
		if (!ptr) continue;
		const os = /^\/materials\/(\d+)\/occlusionTexture\/strength$/.exec(ptr);
		if (os) occlusionStrength.add(+os[1]);
		const tr = /^\/materials\/(\d+)\/extensions\/KHR_materials_transmission\/transmissionFactor$/.exec(ptr);
		if (tr) transmission.add(+tr[1]);
		const io = /^\/materials\/(\d+)\/extensions\/KHR_materials_ior\/ior$/.exec(ptr);
		if (io) ior.add(+io[1]);
		const vt = /^\/materials\/(\d+)\/extensions\/KHR_materials_volume\/thicknessFactor$/.exec(ptr);
		if (vt) volumeThickness.add(+vt[1]);
		const vc = /^\/materials\/(\d+)\/extensions\/KHR_materials_volume\/(attenuationColor|attenuationDistance)$/.exec(ptr);
		if (vc) volumeTint.add(+vc[1]);
	}
	return {
		occlusionStrength,
		transmission,
		ior,
		volumeThickness,
		volumeTint
	};
}
/** Scan one asset's material-extension pointers, fetch the opt-in setters its seeding needs,
*  and return the seeder bound to both. Awaited by the feature's `preParse`; the returned
*  function is then called synchronously from `materialMap`.
*
*  `setPbrMetallicReflectance` statically imports the reflectance fragment, so it is fetched
*  only for assets that animate occlusion strength or IOR — the two seeding paths that must
*  force-activate the reflectance ext even at its default values. An asset animating only
*  transmission or volume pays nothing for it. */
async function prepareExtMaterials(json) {
	const animated = animatedTargets(json);
	const setReflectance = animated.occlusionStrength.size > 0 || animated.ior.size > 0 ? (await import("../material/pbr/set-metallic-reflectance.js")).setPbrMetallicReflectance : null;
	return (map) => seedExtMaterials(json, map, animated, setReflectance);
}
/** `PointerMaterial` is the loader's structural view of the same PBR material object; its
*  texture fields are the loader's wrapped handles, so bridge to the setter's props type. */
function asPbrProps(m) {
	return m;
}
function iorToF0Factor(ior) {
	return ((ior - 1) / (ior + 1)) ** 2 / .04;
}
function bump(mat) {
	mat._uboVersion++;
}
_appendPointerHandlers([
	[/^\/materials\/(\d+)\/pbrMetallicRoughness\/metallicFactor$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		if (!mat) return null;
		return {
			arity: 1,
			writer: (out, off) => {
				mat.roughnessFactor = out[off];
				mat._uboVersion++;
			}
		};
	}],
	[/^\/materials\/(\d+)\/normalTexture\/scale$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		if (!mat) return null;
		return {
			arity: 1,
			writer: (out, off) => {
				mat.normalTextureScale = out[off];
				mat._uboVersion++;
			}
		};
	}],
	[/^\/materials\/(\d+)\/extensions\/KHR_materials_transmission\/transmissionFactor$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		const refr = mat?._subsurface?.refraction;
		if (!mat || !refr) return null;
		return {
			arity: 1,
			writer: (out, off) => {
				mat._transmissive = true;
				refr.intensity = out[off];
				bump(mat);
			}
		};
	}],
	[/^\/materials\/(\d+)\/extensions\/KHR_materials_ior\/ior$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		if (!mat) return null;
		return {
			arity: 1,
			writer: (out, off) => {
				const ior = out[off];
				if (mat._subsurface?.refraction) mat._subsurface.refraction.indexOfRefraction = ior;
				mat._metallicF0Factor = iorToF0Factor(ior);
				mat._specularWeight = 1;
				bump(mat);
			}
		};
	}],
	[/^\/materials\/(\d+)\/extensions\/KHR_materials_volume\/(thicknessFactor|attenuationDistance|attenuationColor)$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		if (!mat?._subsurface) return null;
		return {
			arity: m[2] === "attenuationColor" ? 3 : 1,
			writer: (out, off) => {
				const ss = mat._subsurface;
				if (m[2] === "thicknessFactor") {
					ss.thickness ??= {
						min: 0,
						max: 0,
						useGlTFChannel: true
					};
					ss.thickness.max = out[off];
					if (ss.refraction) ss.refraction.useThicknessAsDepth = true;
				} else {
					ss.tint ??= {
						color: [
							1,
							1,
							1
						],
						atDistance: 1
					};
					if (m[2] === "attenuationDistance") ss.tint.atDistance = out[off];
					else ss.tint.color = [
						out[off],
						out[off + 1],
						out[off + 2]
					];
				}
				bump(mat);
			}
		};
	}],
	[/^\/materials\/(\d+)\/extensions\/KHR_materials_iridescence\/(iridescenceFactor|iridescenceIor|iridescenceThicknessMaximum)$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		const iri = mat?._iridescence;
		if (!mat || !iri) return null;
		return {
			arity: 1,
			writer: (out, off) => {
				const v = out[off];
				if (m[2] === "iridescenceFactor") iri.intensity = v;
				else if (m[2] === "iridescenceIor") iri.indexOfRefraction = v;
				else iri.maximumThickness = v;
				bump(mat);
			}
		};
	}],
	[/^\/materials\/(\d+)\/occlusionTexture\/strength$/, (m, ctx) => {
		const mat = ctx.materials?.[+m[1]];
		if (!mat) return null;
		return {
			arity: 1,
			writer: (out, off) => {
				mat.occlusionStrength = out[off];
				mat._uboVersion++;
			}
		};
	}]
]);
/** Seed load-time material state so the material-extension pointer writers above have
*  something to drive. A material whose transmission / IOR / volume / occlusion-strength
*  is animated from its default (e.g. transmissionFactor 0, occlusionStrength 1) would
*  otherwise compile without the relevant shader path, so the animation would write a
*  value nothing samples. Reached only through the seeder {@link prepareExtMaterials}
*  returns, so `animated` and `setReflectance` always match the asset being seeded. */
function seedExtMaterials(json, map, animated, setReflectance) {
	for (let matIdx = 0; matIdx < map.length; matIdx++) {
		const pm = map[matIdx];
		if (!pm) continue;
		const def = json.materials?.[matIdx];
		if (animated.occlusionStrength.has(matIdx)) {
			pm.occlusionStrength = def?.occlusionTexture?.strength ?? 1;
			setReflectance?.(asPbrProps(pm), {});
			pm._occlStrengthAnimated = true;
		}
		if (animated.transmission.has(matIdx)) {
			pm._transmissive = true;
			pm._subsurface ??= {};
			pm._subsurface.refraction ??= {
				intensity: def?.extensions?.KHR_materials_transmission?.transmissionFactor ?? 0,
				indexOfRefraction: def?.extensions?.KHR_materials_ior?.ior ?? 1.5
			};
		}
		if (animated.ior.has(matIdx)) {
			pm._subsurface ??= {};
			pm._subsurface.refraction ??= {
				intensity: 0,
				indexOfRefraction: def?.extensions?.KHR_materials_ior?.ior ?? 1.5
			};
			const ior = def?.extensions?.KHR_materials_ior?.ior ?? 1.5;
			setReflectance?.(asPbrProps(pm), {
				f0Factor: iorToF0Factor(ior),
				specularWeight: 1
			});
		}
		if (animated.volumeThickness.has(matIdx) || animated.volumeTint.has(matIdx)) {
			pm._subsurface ??= {};
			const eVol = def?.extensions?.KHR_materials_volume;
			if (animated.volumeThickness.has(matIdx)) {
				pm._subsurface.thickness ??= {
					min: 0,
					max: eVol?.thicknessFactor ?? 0,
					useGlTFChannel: true
				};
				if (pm._subsurface.refraction) pm._subsurface.refraction.useThicknessAsDepth = true;
			}
			if (animated.volumeTint.has(matIdx)) pm._subsurface.tint ??= {
				color: eVol?.attenuationColor ?? [
					1,
					1,
					1
				],
				atDistance: eVol?.attenuationDistance ?? 1
			};
		}
	}
}
export { prepareExtMaterials };

//# sourceMappingURL=animation-pointer-ext.js.map