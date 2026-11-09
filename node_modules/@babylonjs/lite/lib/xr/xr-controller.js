// src/xr/xr-controller.ts
/** @internal Read one `GamepadButton` into a plain {@link XrButtonState}. */
function readButton(buttons, index) {
	const b = buttons[index];
	if (!b) return null;
	return {
		pressed: b.pressed,
		touched: b.touched,
		value: b.value
	};
}
/** @internal Read an `[x, y]` axis pair, or null when either axis is absent. */
function readAxes(axes, xIndex, yIndex) {
	const x = axes[xIndex];
	const y = axes[yIndex];
	if (x === void 0 || y === void 0) return null;
	return [x, y];
}
/**
* Decode an input source's `xr-standard` gamepad into structured button/axis
* state for the current frame. Returns `null` when the source exposes no gamepad
* (e.g. a gaze or hand-tracking source). The result is a fresh snapshot each call,
* so it is safe to diff against the previous frame's snapshot for edge detection.
*
* @param input - The tracked input source (from {@link XrInputManager}).
* @returns The decoded components, or `null` when there is no gamepad.
*/
function readXrController(input) {
	const gp = input.gamepad;
	if (!gp) return null;
	const buttons = gp.buttons;
	const axes = gp.axes;
	return {
		handedness: input.handedness,
		trigger: readButton(buttons, 0),
		squeeze: readButton(buttons, 1),
		touchpad: readButton(buttons, 2),
		thumbstick: readButton(buttons, 3),
		buttonA: readButton(buttons, 4),
		buttonB: readButton(buttons, 5),
		touchpadAxes: readAxes(axes, 0, 1),
		thumbstickAxes: readAxes(axes, 2, 3)
	};
}
export { readXrController };

//# sourceMappingURL=xr-controller.js.map