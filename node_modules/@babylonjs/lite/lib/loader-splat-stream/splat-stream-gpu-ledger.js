// src/loader-splat-stream/splat-stream-gpu-ledger.ts
/** @internal Creates the single GPU allocation ledger owned by one stream. */
function createSplatStreamGpuLedger(maxBytes, retire) {
	if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new RangeError("[GaussianSplatStream] GPU ledger budget must be a positive safe integer");
	const ledger = {
		maxBytes,
		residentBytes: 0,
		allocatedBytes: 0,
		heldBytes: 0,
		tryReserve(bytes) {
			if (!Number.isSafeInteger(bytes) || bytes < 0 || ledger.allocatedBytes + ledger.heldBytes + bytes > maxBytes) return false;
			ledger.residentBytes += bytes;
			ledger.allocatedBytes += bytes;
			return true;
		},
		tryHold(bytes) {
			if (!Number.isSafeInteger(bytes) || bytes < 0 || ledger.allocatedBytes + ledger.heldBytes + bytes > maxBytes) return false;
			ledger.heldBytes += bytes;
			return true;
		},
		commitHold(bytes) {
			ledger.heldBytes -= bytes;
			ledger.residentBytes += bytes;
			ledger.allocatedBytes += bytes;
		},
		restoreHold(bytes) {
			ledger.residentBytes -= bytes;
			ledger.allocatedBytes -= bytes;
			ledger.heldBytes += bytes;
		},
		releaseHold(bytes) {
			ledger.heldBytes -= bytes;
		},
		release(bytes) {
			ledger.residentBytes -= bytes;
			ledger.allocatedBytes -= bytes;
		},
		retire(bytes, dispose) {
			ledger.residentBytes -= bytes;
			retire(() => {
				try {
					dispose();
				} finally {
					ledger.allocatedBytes -= bytes;
				}
			});
		},
		retireToHold(bytes, dispose) {
			ledger.residentBytes -= bytes;
			retire(() => {
				ledger.allocatedBytes -= bytes;
				ledger.heldBytes += bytes;
				dispose();
			});
		}
	};
	return ledger;
}
export { createSplatStreamGpuLedger };

//# sourceMappingURL=splat-stream-gpu-ledger.js.map