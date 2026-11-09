// src/animation/frame-interpolation.ts
/** Coerce an unknown rejection reason (e.g. `AbortSignal.reason`, which is typed `any`) to an Error. */
function toError(reason) {
	return reason instanceof Error ? reason : new Error(String(reason));
}
/**
* Shared sentinel used to retire a finished driver in place. `scene._beforeRender` is walked with a
* live `for...of` loop each frame, so a finished driver must not change the array length mid-frame
* (that would skip the next callback). It swaps itself for this noop instead; trailing noops are then
* trimmed so the array cannot grow without bound.
*/
var RetiredDriver = () => {};
/**
* Drive a per-frame interpolation from a scene's render loop until it completes,
* is canceled via the abort signal, or the step throws. This owns the
* `scene._beforeRender` registration and guarantees the callback is detached on
* every exit path (completion, cancellation, or error). It is entity-agnostic —
* it knows nothing about cameras or transforms.
* @param scene - The scene whose render loop advances the interpolation.
* @param step - The per-frame update. Return `false` to finish; throw to cancel.
* @param signal - Optional abort signal. When it aborts, the loop is detached and
*   the returned promise rejects with the signal's reason. If it is already
*   aborted, `step` never runs.
* @returns A promise that resolves when `step` returns `false` (completed) and
*   rejects if `step` throws or the signal aborts.
*/
function runFrameInterpolation(scene, step, signal) {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(toError(signal.reason));
			return;
		}
		let settled = false;
		let onAbort;
		const finish = () => {
			if (settled) return;
			settled = true;
			const list = scene._beforeRender;
			const index = list.indexOf(driver);
			if (index >= 0) {
				list[index] = RetiredDriver;
				while (list.length > 0 && list[list.length - 1] === RetiredDriver) list.pop();
			}
			if (onAbort && signal) signal.removeEventListener("abort", onAbort);
		};
		const driver = (deltaMs) => {
			if (settled) return;
			const deltaSeconds = (deltaMs > 0 ? deltaMs : 1e3 / 60) / 1e3;
			let shouldContinue;
			try {
				shouldContinue = step(deltaSeconds);
			} catch (error) {
				finish();
				reject(toError(error));
				return;
			}
			if (!shouldContinue) {
				finish();
				resolve();
			}
		};
		if (signal) {
			onAbort = () => {
				finish();
				reject(toError(signal.reason));
			};
			signal.addEventListener("abort", onAbort);
		}
		scene._beforeRender.push(driver);
	});
}
export { runFrameInterpolation };

//# sourceMappingURL=frame-interpolation.js.map