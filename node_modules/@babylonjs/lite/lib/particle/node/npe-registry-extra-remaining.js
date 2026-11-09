// src/particle/node/npe-registry-extra-remaining.ts
/** Route uncommon optional families only after the ordinary optional registry misses. */
async function loadRemainingBlockEvaluator(className) {
	if (className === "UpdateAttractorBlock") return (await import("./blocks/update-attractor-block.js")).updateAttractorBlock;
	return className.startsWith("Particle") ? (await import("./npe-registry-extra-values.js")).loadValueBlockEvaluator(className) : (await import("./npe-registry-extra-basic.js")).loadBasicBlockEvaluator(className);
}
export { loadRemainingBlockEvaluator };

//# sourceMappingURL=npe-registry-extra-remaining.js.map