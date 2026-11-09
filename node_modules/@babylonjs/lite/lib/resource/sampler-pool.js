import { clearSamplerCache, getOrCreateSampler as getOrCreateSampler$1 } from "./texture-sampler-pool.js";
// src/resource/sampler-pool.ts
/** Get or create a deduplicated sampler. Same pooled config returns the same sampler. */
function getOrCreateSampler(engine, descriptor = {}) {
	const compare = descriptor.compare;
	const minLod = descriptor.lodMinClamp ?? 0;
	const maxLod = descriptor.lodMaxClamp ?? 32;
	const extraKey = compare !== void 0 || minLod !== 0 || maxLod !== 32 ? `${compare ?? ""}:${minLod}:${maxLod}` : "";
	return getOrCreateSampler$1(engine, descriptor, extraKey);
}
export { clearSamplerCache, getOrCreateSampler };

//# sourceMappingURL=sampler-pool.js.map