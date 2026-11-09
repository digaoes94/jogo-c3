// src/input/gamepad-input.ts
/**
* Copy one browser gamepad slot, with no listeners or per-frame registration.
* @param index - Nonnegative integer navigator slot; defaults to zero.
* @returns A fresh snapshot, or null for unavailable, denied or disconnected input.
*/
function readGamepad(index = 0) {
	if (!Number.isInteger(index) || index < 0) throw new RangeError("Gamepad index must be a nonnegative integer.");
	if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return null;
	let pads;
	try {
		pads = navigator.getGamepads();
	} catch {
		return null;
	}
	const pad = pads[index];
	if (!pad?.connected) return null;
	return {
		id: pad.id,
		index: pad.index,
		mapping: pad.mapping,
		timestamp: pad.timestamp,
		axes: Array.from(pad.axes),
		buttons: Array.from(pad.buttons, ({ value, pressed, touched }) => ({
			value,
			pressed,
			touched
		}))
	};
}
export { readGamepad };

//# sourceMappingURL=gamepad-input.js.map