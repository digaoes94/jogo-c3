// src/engine/render-target-signature.ts
/** Stringified signature used to key pipelines against a render target's attachment set. */
function targetSignatureKey(desc) {
	return `${desc._colorFormat ?? "-"}|${desc._depthStencilFormat ?? "-"}|${desc._depthCompare ?? ""}|${desc._sampleCount}`;
}
export { targetSignatureKey };

//# sourceMappingURL=render-target-signature.js.map