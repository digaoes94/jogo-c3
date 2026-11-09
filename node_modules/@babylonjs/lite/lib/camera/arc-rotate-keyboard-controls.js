import { _installArcRotateKeyboardControls } from "./arc-rotate-controls.js";
// src/camera/arc-rotate-keyboard-controls.ts
function hasHeldKey(keys, mapping, fallback) {
	if (!mapping) return keys.has(fallback);
	for (let i = 0; i < mapping.length; i++) if (keys.has(mapping[i])) return true;
	return false;
}
function attachKeyboardControls(camera, canvas, keyboard) {
	if (!keyboard) return;
	const options = typeof keyboard === "object" ? keyboard : void 0;
	const mappings = options?.keys;
	const preventDefault = options?.preventDefault ?? true;
	const angularSensitivity = options?.angularSensitivity ?? 100;
	const panningSensitivity = options?.panningSensitivity ?? 50;
	const zoomingSensitivity = options?.zoomingSensitivity ?? 25;
	const heldKeys = /* @__PURE__ */ new Set();
	let ctrlKey = false;
	let altKey = false;
	let metaKey = false;
	function matchesMapping(code, mapping, fallback) {
		return mapping ? mapping.includes(code) : code === fallback;
	}
	function isDirection(code) {
		return matchesMapping(code, mappings?.left, "ArrowLeft") || matchesMapping(code, mappings?.right, "ArrowRight") || matchesMapping(code, mappings?.up, "ArrowUp") || matchesMapping(code, mappings?.down, "ArrowDown");
	}
	function updateModifiers(e) {
		ctrlKey = e.ctrlKey;
		altKey = e.altKey;
		metaKey = e.metaKey;
	}
	function onKeyDown(e) {
		updateModifiers(e);
		if (!e.metaKey && isDirection(e.code)) {
			heldKeys.add(e.code);
			if (preventDefault) e.preventDefault();
		}
	}
	function onKeyUp(e) {
		updateModifiers(e);
		heldKeys.delete(e.code);
		if (preventDefault && !e.metaKey && isDirection(e.code)) e.preventDefault();
	}
	function clearState() {
		heldKeys.clear();
		ctrlKey = false;
		altKey = false;
		metaKey = false;
	}
	function applyInput() {
		if (metaKey) return;
		const left = hasHeldKey(heldKeys, mappings?.left, "ArrowLeft");
		const right = hasHeldKey(heldKeys, mappings?.right, "ArrowRight");
		const up = hasHeldKey(heldKeys, mappings?.up, "ArrowUp");
		const down = hasHeldKey(heldKeys, mappings?.down, "ArrowDown");
		const horizontal = (right ? 1 : 0) - (left ? 1 : 0);
		if (ctrlKey) {
			const vertical = (up ? 1 : 0) - (down ? 1 : 0);
			const magnitude = Math.hypot(horizontal, vertical);
			if (magnitude !== 0) {
				camera.inertialPanningX += horizontal / magnitude / panningSensitivity;
				camera.inertialPanningY += vertical / magnitude / panningSensitivity;
			}
			return;
		}
		if (altKey) {
			camera.inertialAlphaOffset += horizontal / angularSensitivity;
			camera.inertialRadiusOffset += ((up ? 1 : 0) - (down ? 1 : 0)) / zoomingSensitivity;
			return;
		}
		const vertical = (down ? 1 : 0) - (up ? 1 : 0);
		const magnitude = Math.hypot(horizontal, vertical);
		if (magnitude !== 0) {
			camera.inertialAlphaOffset += horizontal / magnitude / angularSensitivity;
			camera.inertialBetaOffset += vertical / magnitude / angularSensitivity;
		}
	}
	canvas.addEventListener("keydown", onKeyDown);
	canvas.addEventListener("keyup", onKeyUp);
	canvas.addEventListener("blur", clearState);
	if (!canvas.hasAttribute("tabindex")) canvas.tabIndex = 0;
	return [applyInput, () => {
		canvas.removeEventListener("keydown", onKeyDown);
		canvas.removeEventListener("keyup", onKeyUp);
		canvas.removeEventListener("blur", clearState);
		clearState();
	}];
}
/**
* Install arc-rotate keyboard input support. Process-global and idempotent.
*
* Call once before passing `keyboard` to {@link attachControl}. Keeping this
* explicit lets pointer-only bundles remove all keyboard state and handlers.
*/
function enableArcRotateKeyboardControls() {
	_installArcRotateKeyboardControls(attachKeyboardControls);
}
export { enableArcRotateKeyboardControls };

//# sourceMappingURL=arc-rotate-keyboard-controls.js.map