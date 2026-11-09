import { addToScene } from "../scene/scene-core.js";
import { removeFromScene } from "../scene/scene-remove.js";
import { createCylinder } from "../mesh/mesh-factories.js";
import { GizmoObservable, attachFollowTarget, createGizmoMaterials, setMeshesMaterial } from "./gizmo-core.js";
import { lookAtQuat, transformDirectionByWorld, worldDeltaToLocal } from "./gizmo-math.js";
import { createPointerDrag, registerPointerDrag } from "./pointer-drag.js";
// src/gizmo/axis-drag-gizmo.ts
/** Build the rendered arrow (cone + line) parented to `root`.  When
*  `isCollider` is true, a thicker invisible version is built for picking. */
function buildArrow(engine, utilityScene, material, root, thickness, isCollider) {
	const cone = createCylinder(engine, {
		diameterTop: 0,
		height: .075,
		diameterBottom: .0375 * (1 + (thickness - 1) / 4),
		tessellation: 96
	});
	cone.material = material.material;
	cone.rotation.set(Math.PI / 2, 0, 0);
	cone.position.set(0, 0, .3);
	cone.parent = root;
	addToScene(utilityScene, cone);
	const line = createCylinder(engine, {
		diameterTop: .005 * thickness,
		height: .275,
		diameterBottom: .005 * thickness,
		tessellation: 96
	});
	line.material = material.material;
	line.rotation.set(Math.PI / 2, 0, 0);
	line.position.set(0, 0, .275 / 2);
	line.parent = root;
	addToScene(utilityScene, line);
	if (isCollider) {
		cone.visible = false;
		line.visible = false;
	}
	return [cone, line];
}
/** Build an axis-drag gizmo and attach it to the given utility layer.  Call
*  `attachAxisDragGizmoToNode` to bind it to a node so it follows + drives it. */
function createAxisDragGizmo(engine, layer, options) {
	const color = options.color ?? [
		.5,
		.5,
		.5
	];
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
	const q = lookAtQuat(options.dragAxis);
	root.rotationQuaternion.set(q[0], q[1], q[2], q[3]);
	root.scaling.set(1 / 3, 1 / 3, 1 / 3);
	const visibleMeshes = buildArrow(engine, utilityScene, { material: materials.colored }, root, thickness, false);
	const colliderMeshes = buildArrow(engine, utilityScene, { material: materials.colored }, root, thickness + 4, true);
	const drag = createPointerDrag({
		dragAxis: {
			x: options.dragAxis.x,
			y: options.dragAxis.y,
			z: options.dragAxis.z
		},
		moveAttached: false,
		updateDragPlane: false,
		getPlanePoint: () => ({
			x: root.position.x,
			y: root.position.y,
			z: root.position.z
		})
	});
	drag._colliders = [...visibleMeshes, ...colliderMeshes];
	const onPositionChanged = new GizmoObservable();
	const localAxis = {
		x: options.dragAxis.x,
		y: options.dragAxis.y,
		z: options.dragAxis.z
	};
	const gizmo = {
		root,
		drag,
		onPositionChanged,
		attachedNode: null,
		useLocalCoordinates: false,
		materials,
		_visibleMeshes: visibleMeshes,
		_meshes: [
			root,
			...visibleMeshes,
			...colliderMeshes
		],
		_disposePointer: () => void 0,
		_disposeFollow: () => void 0
	};
	drag.onDrag.add((event) => {
		const node = gizmo.attachedNode;
		if (!node) return;
		const local = worldDeltaToLocal(node, event.delta.x, event.delta.y, event.delta.z);
		node.position.set(node.position.x + local.x, node.position.y + local.y, node.position.z + local.z);
		onPositionChanged.notify({
			x: node.position.x,
			y: node.position.y,
			z: node.position.z
		});
	});
	drag.onDragStart.add(() => setMeshesMaterial(visibleMeshes, materials.hover));
	drag.onDragEnd.add(() => setMeshesMaterial(visibleMeshes, materials.colored));
	drag.onHoverStart.add(() => setMeshesMaterial(visibleMeshes, materials.hover));
	drag.onHoverEnd.add(() => {
		if (!drag.dragging) setMeshesMaterial(visibleMeshes, materials.colored);
	});
	const canvas = engine.canvas;
	if ("setAttribute" in canvas) gizmo._disposePointer = registerPointerDrag(layer, canvas, drag);
	gizmo._disposeFollow = attachFollowTarget(utilityScene, root, () => gizmo.attachedNode, 1 / 3, (_target, wm) => {
		if (gizmo.useLocalCoordinates) {
			const worldAxis = transformDirectionByWorld(wm, localAxis);
			const dragAxis = drag.options.dragAxis;
			if (dragAxis) {
				dragAxis.x = worldAxis.x;
				dragAxis.y = worldAxis.y;
				dragAxis.z = worldAxis.z;
			}
			const q = lookAtQuat(worldAxis);
			root.rotationQuaternion.set(q[0], q[1], q[2], q[3]);
		} else {
			const dragAxis = drag.options.dragAxis;
			if (dragAxis && (dragAxis.x !== localAxis.x || dragAxis.y !== localAxis.y || dragAxis.z !== localAxis.z)) {
				dragAxis.x = localAxis.x;
				dragAxis.y = localAxis.y;
				dragAxis.z = localAxis.z;
				const q = lookAtQuat(localAxis);
				root.rotationQuaternion.set(q[0], q[1], q[2], q[3]);
			}
		}
	});
	return gizmo;
}
/** Bind the gizmo to a node — the gizmo follows the node's world translation
*  and applies drag deltas to its `position`. */
function attachAxisDragGizmoToNode(gizmo, node) {
	gizmo.attachedNode = node;
	gizmo.drag.enabled = node !== null;
}
/** Dispose the gizmo: remove meshes, unregister pointer-drag, drop materials. */
function disposeAxisDragGizmo(gizmo, layer) {
	gizmo._disposePointer();
	gizmo._disposeFollow();
	gizmo.onPositionChanged.clear();
	gizmo.drag.onDrag.clear();
	gizmo.drag.onDragStart.clear();
	gizmo.drag.onDragEnd.clear();
	for (const m of gizmo._meshes) removeFromScene(layer.scene, m);
	gizmo._meshes.length = 0;
}
export { attachAxisDragGizmoToNode, createAxisDragGizmo, disposeAxisDragGizmo };

//# sourceMappingURL=axis-drag-gizmo.js.map