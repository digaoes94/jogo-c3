// src/mesh/mesh-indexed-indirect.ts
/** @internal Populate the WebGPU indexed-indirect ABI, including the signed baseVertex word. */
function writeMeshIndexedIndirectArgs(args, gpu, instanceCount) {
	args[0] = gpu.indexCount;
	args[1] = instanceCount;
	args[2] = gpu._firstIndex ?? 0;
	args[3] = gpu._baseVertex ?? 0;
	args[4] = 0;
}
export { writeMeshIndexedIndirectArgs };

//# sourceMappingURL=mesh-indexed-indirect.js.map