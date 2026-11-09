import { invertMat4 } from "../math/invert-mat4.js";
import { setSubtreeVisible } from "../scene/visibility.js";
import { addToScene } from "../scene/scene-core.js";
import { removeFromScene } from "../scene/scene-remove.js";
import { createCylinder, createPlane, createTorus } from "../mesh/mesh-factories.js";
import { GizmoObservable, attachFollowTarget, createGizmoMaterials, setMeshesMaterial } from "./gizmo-core.js";
import { lookAtQuat, normalizeVec3Obj, quatFromAxisAngle, quatMul, quatNormalize, signedAngleAroundNormal, transformDirectionByWorld, worldRotationToLocal } from "./gizmo-math.js";
import { createPointerDrag, registerPointerDrag } from "./pointer-drag.js";
import { setShaderUniform } from "../material/shader/shader-material.js";
import { createRotationSectorMaterial } from "./rotation-sector-material.js";
import { _rightHanded } from "#coordinate-system";
// src/gizmo/plane-rotation-gizmo.ts
/** Create a plane rotation gizmo in the utility layer.
* @param engine - Engine that owns the created meshes and rotation display material.
* @param layer - Utility layer that renders and picks the gizmo.
* @param options - Plane normal, ring sizing, and material options.
* @returns A detached rotation gizmo ready to attach to a node.
*/
function createPlaneRotationGizmo(engine, layer, options) {
	const color = options.color ?? [
		.5,
		.5,
		.5
	];
	const tessellation = options.tessellation ?? 32;
	const thickness = options.thickness ?? 1;
	const utilityScene = layer.scene;
	const materials = createGizmoMaterials(color, options.hoverColor, options.disableColor);
	const root = createCylinder(engine, {
		diameterTop: 0,
		diameterBottom: 0,
		height: 0,
		tessellation: 3
	});
	root.material = materials.colored;
	root.visible = false;
	addToScene(utilityScene, root);
	const q = lookAtQuat(options.planeNormal);
	root.rotationQuaternion.set(q[0], q[1], q[2], q[3]);
	root.scaling.set(1 / 3, 1 / 3, 1 / 3);
	const ring = createTorus(engine, {
		diameter: .6,
		thickness: .005 * thickness,
		tessellation
	});
	ring.material = materials.colored;
	ring.rotation.set(Math.PI / 2, 0, 0);
	ring.parent = root;
	addToScene(utilityScene, ring);
	const collider = createTorus(engine, {
		diameter: .6,
		thickness: .03 * thickness,
		tessellation
	});
	collider.material = materials.colored;
	collider.rotation.set(Math.PI / 2, 0, 0);
	collider.visible = false;
	collider.parent = root;
	addToScene(utilityScene, collider);
	const rotationColor = options.rotationColor ?? options.hoverColor ?? [
		1,
		1,
		0
	];
	const rotationDisplayMaterial = createRotationSectorMaterial(rotationColor);
	const rotationDisplayPlane = createPlane(engine, { size: .6 });
	rotationDisplayPlane.material = rotationDisplayMaterial;
	rotationDisplayPlane.rotation.set(0, 0, Math.PI / 2);
	rotationDisplayPlane.visible = false;
	rotationDisplayPlane.pickable = false;
	rotationDisplayPlane.parent = root;
	addToScene(utilityScene, rotationDisplayPlane);
	const drag = createPointerDrag({
		dragPlaneNormal: {
			x: options.planeNormal.x,
			y: options.planeNormal.y,
			z: options.planeNormal.z
		},
		moveAttached: false,
		getPlanePoint: () => ({
			x: root.position.x,
			y: root.position.y,
			z: root.position.z
		})
	});
	drag._colliders = [ring, collider];
	const onRotationChanged = new GizmoObservable();
	const planeNormal = {
		x: 0,
		y: 0,
		z: 0
	};
	const initialNormal = normalizeVec3Obj(options.planeNormal);
	planeNormal.x = initialNormal.x;
	planeNormal.y = initialNormal.y;
	planeNormal.z = initialNormal.z;
	const localNormal = {
		x: initialNormal.x,
		y: initialNormal.y,
		z: initialNormal.z
	};
	let lastDragPoint = null;
	let cumulativeAngle = 0;
	const anglesUniform = [
		0,
		0,
		1
	];
	const gizmo = {
		root,
		drag,
		onRotationChanged,
		attachedNode: null,
		useLocalCoordinates: false,
		materials,
		rotationDisplayMaterial,
		_visibleMeshes: [ring],
		_meshes: [
			root,
			ring,
			collider,
			rotationDisplayPlane
		],
		_disposePointer: () => void 0,
		_disposeFollow: () => void 0
	};
	drag.onDragStart.add((event) => {
		lastDragPoint = {
			x: event.dragPlanePoint.x,
			y: event.dragPlanePoint.y,
			z: event.dragPlanePoint.z
		};
		cumulativeAngle = 0;
		setMeshesMaterial([ring], materials.hover);
		const planeWorld = rotationDisplayPlane.worldMatrix;
		const invPlane = invertMat4(planeWorld);
		if (invPlane) {
			const px = event.dragPlanePoint.x, py = event.dragPlanePoint.y, pz = event.dragPlanePoint.z;
			const lx = invPlane[0] * px + invPlane[4] * py + invPlane[8] * pz + invPlane[12];
			const ly = invPlane[1] * px + invPlane[5] * py + invPlane[9] * pz + invPlane[13];
			anglesUniform[0] = Math.atan2(ly, lx) + Math.PI;
		} else anglesUniform[0] = 0;
		anglesUniform[1] = 0;
		anglesUniform[2] = 1;
		setShaderUniform(rotationDisplayMaterial, "angles", anglesUniform);
		setSubtreeVisible(rotationDisplayPlane, true);
	});
	drag.onDragEnd.add(() => {
		lastDragPoint = null;
		setMeshesMaterial([ring], materials.colored);
		setSubtreeVisible(rotationDisplayPlane, false);
	});
	drag.onHoverStart.add(() => setMeshesMaterial([ring], materials.hover));
	drag.onHoverEnd.add(() => {
		if (!drag.dragging) setMeshesMaterial([ring], materials.colored);
	});
	drag.onDrag.add((event) => {
		const node = gizmo.attachedNode;
		if (!node || !lastDragPoint) return;
		const wm = node.worldMatrix;
		const nx = wm[12], ny = wm[13], nz = wm[14];
		const a = {
			x: lastDragPoint.x - nx,
			y: lastDragPoint.y - ny,
			z: lastDragPoint.z - nz
		};
		const b = {
			x: event.dragPlanePoint.x - nx,
			y: event.dragPlanePoint.y - ny,
			z: event.dragPlanePoint.z - nz
		};
		const angle = signedAngleAroundNormal(a, b, planeNormal);
		if (Math.abs(angle) < 1e-7) {
			lastDragPoint = {
				x: event.dragPlanePoint.x,
				y: event.dragPlanePoint.y,
				z: event.dragPlanePoint.z
			};
			return;
		}
		const dq = quatFromAxisAngle(planeNormal.x, planeNormal.y, planeNormal.z, angle);
		const localDq = worldRotationToLocal(node, dq[0], dq[1], dq[2], dq[3]);
		const rq = node.rotationQuaternion;
		const out = quatNormalize(quatMul(localDq[0], localDq[1], localDq[2], localDq[3], rq.x, rq.y, rq.z, rq.w));
		rq.set(out[0], out[1], out[2], out[3]);
		onRotationChanged.notify(out);
		lastDragPoint = {
			x: event.dragPlanePoint.x,
			y: event.dragPlanePoint.y,
			z: event.dragPlanePoint.z
		};
		cumulativeAngle += _rightHanded ? -angle : angle;
		anglesUniform[1] = cumulativeAngle;
		setShaderUniform(rotationDisplayMaterial, "angles", anglesUniform);
	});
	const canvas = engine.canvas;
	if ("setAttribute" in canvas) gizmo._disposePointer = registerPointerDrag(layer, canvas, drag);
	gizmo._disposeFollow = attachFollowTarget(utilityScene, root, () => gizmo.attachedNode, 1 / 3, (_target, wm) => {
		if (gizmo.useLocalCoordinates) {
			const worldNormal = transformDirectionByWorld(wm, localNormal);
			planeNormal.x = worldNormal.x;
			planeNormal.y = worldNormal.y;
			planeNormal.z = worldNormal.z;
			const n = drag.options.dragPlaneNormal;
			if (n) {
				n.x = worldNormal.x;
				n.y = worldNormal.y;
				n.z = worldNormal.z;
			}
			const q = lookAtQuat(worldNormal);
			root.rotationQuaternion.set(q[0], q[1], q[2], q[3]);
		} else if (planeNormal.x !== localNormal.x || planeNormal.y !== localNormal.y || planeNormal.z !== localNormal.z) {
			planeNormal.x = localNormal.x;
			planeNormal.y = localNormal.y;
			planeNormal.z = localNormal.z;
			const n = drag.options.dragPlaneNormal;
			if (n) {
				n.x = localNormal.x;
				n.y = localNormal.y;
				n.z = localNormal.z;
			}
			const q = lookAtQuat(localNormal);
			root.rotationQuaternion.set(q[0], q[1], q[2], q[3]);
		}
	});
	return gizmo;
}
/** Attach the rotation gizmo to a scene node, or detach it with `null`. */
function attachPlaneRotationGizmoToNode(gizmo, node) {
	gizmo.attachedNode = node;
	gizmo.drag.enabled = node !== null;
}
/** Dispose the rotation gizmo meshes, observers, and pointer-drag registration. */
function disposePlaneRotationGizmo(gizmo, layer) {
	gizmo._disposePointer();
	gizmo._disposeFollow();
	gizmo.onRotationChanged.clear();
	gizmo.drag.onDrag.clear();
	gizmo.drag.onDragStart.clear();
	gizmo.drag.onDragEnd.clear();
	for (const m of gizmo._meshes) removeFromScene(layer.scene, m);
	gizmo._meshes.length = 0;
}
export { attachPlaneRotationGizmoToNode, createPlaneRotationGizmo, disposePlaneRotationGizmo };

//# sourceMappingURL=plane-rotation-gizmo.js.map