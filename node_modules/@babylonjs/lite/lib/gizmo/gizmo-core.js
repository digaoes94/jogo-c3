import { onBeforeRender } from "../scene/scene-core.js";
import { createStandardMaterial } from "../material/standard/create-standard-material.js";
import { _rightHanded } from "#coordinate-system";
// src/gizmo/gizmo-core.ts
/** Build the three materials used by every gizmo: solid colored, yellow hover,
*  grey/translucent disabled.  Materials are LIT (no `disableLighting`) so the
*  utility layer's hemispheric light (intensity 2, gray ground — matching BJS
*  `UtilityLayerRenderer._getSharedGizmoLight`) shades the arrow / ring / box
*  surfaces, exactly like the BJS reference gizmos.  BJS sets specular only on
*  the colored material (`color − 0.1`, allowed to go negative for parity) and
*  leaves the hover / disabled specular at the StandardMaterial default
*  `(1, 1, 1)` — we mirror that here. */
function createGizmoMaterials(color, hoverColor = [
	1,
	1,
	0
], disableColor = [
	.5,
	.5,
	.5
]) {
	const colored = createStandardMaterial();
	colored.diffuseColor = color;
	colored.specularColor = [
		color[0] - .1,
		color[1] - .1,
		color[2] - .1
	];
	const hover = createStandardMaterial();
	hover.diffuseColor = hoverColor;
	const disabled = createStandardMaterial();
	disabled.diffuseColor = disableColor;
	disabled.alpha = .4;
	return {
		colored,
		hover,
		disabled
	};
}
/** Replace the material on each of `meshes`. */
function setMeshesMaterial(meshes, material) {
	for (const m of meshes) m.material = material;
}
/** Per-frame: copy targetNode's world translation into gizmoRoot.position. The
*  gizmo is a top-level node (no parent), so this keeps it co-located with the
*  attached node every frame.  Optionally also scales the gizmo root by
*  `distance(camera, gizmo) * scaleRatio` so it keeps a constant on-screen
*  size regardless of camera distance (mirrors BJS `Gizmo._update`).
*
*  When `onAfterFollow` is supplied, it runs after position/scale have been
*  applied and receives the target node + its world matrix — used by sub-gizmos
*  to refresh their drag axis / root rotation when in local-coordinate mode. */
function attachFollowTarget(scene, gizmoRoot, getTarget, scaleRatio = null, onAfterFollow) {
	let stopped = false;
	onBeforeRender(scene, () => {
		if (stopped) return;
		const t = getTarget();
		if (!t) return;
		const wm = t.worldMatrix;
		const tx = wm[12], ty = wm[13], tz = wm[14];
		gizmoRoot.position.set(tx, ty, tz);
		if (scaleRatio !== null && scene.camera) {
			const cw = scene.camera.worldMatrix;
			const ox = tx - cw[12];
			const oy = ty - cw[13];
			const oz = tz - cw[14];
			const fx = _rightHanded ? -cw[8] : cw[8], fy = _rightHanded ? -cw[9] : cw[9], fz = _rightHanded ? -cw[10] : cw[10];
			const dist = (ox * fx + oy * fy + oz * fz) * scaleRatio;
			gizmoRoot.scaling.set(dist, dist, dist);
		}
		if (onAfterFollow) onAfterFollow(t, wm);
	});
	return () => {
		stopped = true;
	};
}
/** Tiny single-event observable used by gizmos/pointer-drag (no dependency on
*  BJS's Observable, no module-level allocations). */
var GizmoObservable = class {
	_subs = [];
	add(cb) {
		this._subs.push(cb);
		return () => {
			const i = this._subs.indexOf(cb);
			if (i >= 0) this._subs.splice(i, 1);
		};
	}
	notify(arg) {
		for (const s of this._subs) s(arg);
	}
	clear() {
		this._subs.length = 0;
	}
};
export { GizmoObservable, attachFollowTarget, createGizmoMaterials, setMeshesMaterial };

//# sourceMappingURL=gizmo-core.js.map