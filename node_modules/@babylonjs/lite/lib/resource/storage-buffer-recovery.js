import { BU } from "../engine/gpu-flags.js";
import { createMappedBuffer } from "./mapped-buffer.js";
// src/resource/storage-buffer-recovery.ts
/** @internal Preserve the old device's limits only for the existing CPU-backed storage path. */
function getCpuStorageRecoveryLimits(engine) {
	for (const buffer of engine._storageBuffers ?? []) if (buffer._data) {
		const limits = engine._device.limits;
		return {
			maxBufferSize: limits.maxBufferSize,
			maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize,
			maxStorageBuffersPerShaderStage: limits.maxStorageBuffersPerShaderStage
		};
	}
}
/** @internal Existing CPU-backed storage restoration, kept behind the recovery runner.
*  GPU-role allocations have no shadow to rebuild from; dropping their old-device handle
*  makes every bind path reject them instead of submitting a handle from the lost device. */
function rebuildCpuStorageBuffers(engine) {
	for (const buffer of engine._storageBuffers ?? []) if (!buffer._destroyed) buffer._buffer = buffer._data ? createMappedBuffer(engine, buffer._data, BU.STORAGE, buffer._label) : null;
}
export { getCpuStorageRecoveryLimits, rebuildCpuStorageBuffers };

//# sourceMappingURL=storage-buffer-recovery.js.map