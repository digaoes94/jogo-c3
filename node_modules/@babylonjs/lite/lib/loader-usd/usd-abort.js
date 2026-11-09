// src/loader-usd/usd-abort.ts
/** @internal Observe cancellation without waiting indefinitely for browser decoding or a Blob read.
* Late successes are explicitly released by the operation's owner. */
async function usdAbortable(promise, signal, releaseLate) {
	if (!signal) return promise;
	let aborted = signal.aborted;
	let onAbort;
	const observed = promise.then((value) => {
		if (aborted) {
			releaseLate?.(value);
			signal.throwIfAborted();
		}
		return value;
	});
	const cancellation = new Promise((_resolve, reject) => {
		onAbort = () => {
			aborted = true;
			reject(signal.reason instanceof Error ? signal.reason : /* @__PURE__ */ new Error("USD loading aborted"));
		};
		signal.addEventListener("abort", onAbort, { once: true });
		if (signal.aborted) onAbort();
	});
	try {
		return await Promise.race([observed, cancellation]);
	} finally {
		if (onAbort) signal.removeEventListener("abort", onAbort);
	}
}
export { usdAbortable };

//# sourceMappingURL=usd-abort.js.map