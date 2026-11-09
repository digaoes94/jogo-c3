// src/engine/gpu-resource-disposal.ts
/** @internal Attempt every feature-owned release, preserving destroy receivers and reporting failures. */
function runGpuResourceDisposers(disposers) {
	for (const dispose of disposers) try {
		if (typeof dispose === "function") dispose();
		else dispose.destroy();
	} catch (error) {
		console.error("GPU resource retirement failed.", error);
	}
}
export { runGpuResourceDisposers };

//# sourceMappingURL=gpu-resource-disposal.js.map