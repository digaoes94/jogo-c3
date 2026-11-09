// src/shader/fragments/shadow-algorithms.ts
/** @internal Prepare only algorithms requested by the supplied light slots. */
async function loadShadowAlgorithms(shadowLights) {
	let needsEsm = false;
	let needsPcf = false;
	for (const slot of shadowLights) {
		needsEsm ||= slot.shadowType === "esm";
		needsPcf ||= slot.shadowType === "pcf";
	}
	const [esm, pcf] = await Promise.all([needsEsm ? import("./shadow-fragment-esm.js") : null, needsPcf ? import("./shadow-fragment-pcf.js") : null]);
	return {
		esm: esm?.shadowAlgorithm,
		pcf: pcf?.shadowAlgorithm
	};
}
/** @internal Identical projection and frustum rejection used by fallback receivers. */
function shadowProjectionCode() {
	return `let clipSpace=posFromLight.xyz/posFromLight.w;let uv=vec2<f32>(0.5*clipSpace.x+0.5,0.5-0.5*clipSpace.y);if(depthMetric<0.0||depthMetric>1.0||uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){return 1.0;}`;
}
export { loadShadowAlgorithms, shadowProjectionCode };

//# sourceMappingURL=shadow-algorithms.js.map