import { setMeshesMaterial } from "./gizmo-core.js";
import { attachAxisDragGizmoToNode, createAxisDragGizmo, disposeAxisDragGizmo } from "./axis-drag-gizmo.js";
import { attachAxisScaleGizmoToNode, createAxisScaleGizmo, disposeAxisScaleGizmo } from "./axis-scale-gizmo.js";
import { attachPlaneDragGizmoToNode, createPlaneDragGizmo, disposePlaneDragGizmo } from "./plane-drag-gizmo.js";
import { attachPlaneRotationGizmoToNode, createPlaneRotationGizmo, disposePlaneRotationGizmo } from "./plane-rotation-gizmo.js";
// src/gizmo/composite-gizmos.ts
/** Wire BJS-style cross-axis disabling: while ANY sub-gizmo is being dragged,
*  every OTHER sub-gizmo of the same composite switches to its (grey,
*  semi-transparent) disabled material; on drag end they all restore.  Mirrors
*  BJS `Gizmo.GizmoAxisPointerObserver`, which greys non-active axes on
*  pointer-down and resets them on pointer-up.  The dispatcher suppresses hover
*  picking while a drag is active, so the greyed state survives the whole drag
*  without a stray hover event un-greying a sibling. */
function wireCrossAxisDisable(gizmos) {
	for (const g of gizmos) {
		g.drag.onDragStart.add(() => {
			for (const other of gizmos) if (other !== g) setMeshesMaterial(other._visibleMeshes, other.materials.disabled);
		});
		g.drag.onDragEnd.add(() => {
			for (const other of gizmos) if (other !== g) setMeshesMaterial(other._visibleMeshes, other.drag.enabled ? other.materials.colored : other.materials.disabled);
		});
	}
}
/** Build a composite position gizmo.  Colors match BJS PositionGizmo
*  defaults: half-saturation red / green / blue along X / Y / Z
*  (`Color3.Red().scale(0.5)` etc.). */
function createPositionGizmo(engine, layer, options = {}) {
	const thickness = options.thickness ?? 1;
	const planarEnabled = options.planarEnabled ?? false;
	const xGizmo = createAxisDragGizmo(engine, layer, {
		dragAxis: {
			x: 1,
			y: 0,
			z: 0
		},
		color: [
			.5,
			0,
			0
		],
		thickness
	});
	const yGizmo = createAxisDragGizmo(engine, layer, {
		dragAxis: {
			x: 0,
			y: 1,
			z: 0
		},
		color: [
			0,
			.5,
			0
		],
		thickness
	});
	const zGizmo = createAxisDragGizmo(engine, layer, {
		dragAxis: {
			x: 0,
			y: 0,
			z: 1
		},
		color: [
			0,
			0,
			.5
		],
		thickness
	});
	const xPlaneGizmo = planarEnabled ? createPlaneDragGizmo(engine, layer, {
		dragPlaneNormal: {
			x: 1,
			y: 0,
			z: 0
		},
		color: [
			.5,
			0,
			0
		]
	}) : null;
	const yPlaneGizmo = planarEnabled ? createPlaneDragGizmo(engine, layer, {
		dragPlaneNormal: {
			x: 0,
			y: 1,
			z: 0
		},
		color: [
			0,
			.5,
			0
		]
	}) : null;
	const zPlaneGizmo = planarEnabled ? createPlaneDragGizmo(engine, layer, {
		dragPlaneNormal: {
			x: 0,
			y: 0,
			z: 1
		},
		color: [
			0,
			0,
			.5
		]
	}) : null;
	wireCrossAxisDisable([
		xGizmo,
		yGizmo,
		zGizmo,
		...xPlaneGizmo ? [xPlaneGizmo] : [],
		...yPlaneGizmo ? [yPlaneGizmo] : [],
		...zPlaneGizmo ? [zPlaneGizmo] : []
	]);
	return {
		xGizmo,
		yGizmo,
		zGizmo,
		xPlaneGizmo,
		yPlaneGizmo,
		zPlaneGizmo,
		attachedNode: null
	};
}
/** Attach all position sub-gizmos to a node, or detach them with `null`. */
function attachPositionGizmoToNode(gizmo, node) {
	gizmo.attachedNode = node;
	attachAxisDragGizmoToNode(gizmo.xGizmo, node);
	attachAxisDragGizmoToNode(gizmo.yGizmo, node);
	attachAxisDragGizmoToNode(gizmo.zGizmo, node);
	if (gizmo.xPlaneGizmo) attachPlaneDragGizmoToNode(gizmo.xPlaneGizmo, node);
	if (gizmo.yPlaneGizmo) attachPlaneDragGizmoToNode(gizmo.yPlaneGizmo, node);
	if (gizmo.zPlaneGizmo) attachPlaneDragGizmoToNode(gizmo.zPlaneGizmo, node);
}
/** Toggle whether the position gizmo axes follow the attached node's rotation. */
function setPositionGizmoLocalCoordinates(gizmo, useLocal) {
	gizmo.xGizmo.useLocalCoordinates = useLocal;
	gizmo.yGizmo.useLocalCoordinates = useLocal;
	gizmo.zGizmo.useLocalCoordinates = useLocal;
	if (gizmo.xPlaneGizmo) gizmo.xPlaneGizmo.useLocalCoordinates = useLocal;
	if (gizmo.yPlaneGizmo) gizmo.yPlaneGizmo.useLocalCoordinates = useLocal;
	if (gizmo.zPlaneGizmo) gizmo.zPlaneGizmo.useLocalCoordinates = useLocal;
}
/** Dispose all sub-gizmos owned by the composite position gizmo. */
function disposePositionGizmo(gizmo, layer) {
	disposeAxisDragGizmo(gizmo.xGizmo, layer);
	disposeAxisDragGizmo(gizmo.yGizmo, layer);
	disposeAxisDragGizmo(gizmo.zGizmo, layer);
	if (gizmo.xPlaneGizmo) disposePlaneDragGizmo(gizmo.xPlaneGizmo, layer);
	if (gizmo.yPlaneGizmo) disposePlaneDragGizmo(gizmo.yPlaneGizmo, layer);
	if (gizmo.zPlaneGizmo) disposePlaneDragGizmo(gizmo.zPlaneGizmo, layer);
}
/** Create a composite rotation gizmo with one ring for each principal axis.
* @param engine - Engine that owns the created meshes.
* @param layer - Utility layer that renders and picks the rings.
* @param options - Ring tessellation and thickness options.
* @returns A detached rotation gizmo ready to attach to a node.
*/
function createRotationGizmo(engine, layer, options = {}) {
	const tessellation = options.tessellation ?? 32;
	const thickness = options.thickness ?? 1;
	const xGizmo = createPlaneRotationGizmo(engine, layer, {
		planeNormal: {
			x: 1,
			y: 0,
			z: 0
		},
		color: [
			.5,
			0,
			0
		],
		tessellation,
		thickness
	});
	const yGizmo = createPlaneRotationGizmo(engine, layer, {
		planeNormal: {
			x: 0,
			y: 1,
			z: 0
		},
		color: [
			0,
			.5,
			0
		],
		tessellation,
		thickness
	});
	const zGizmo = createPlaneRotationGizmo(engine, layer, {
		planeNormal: {
			x: 0,
			y: 0,
			z: 1
		},
		color: [
			0,
			0,
			.5
		],
		tessellation,
		thickness
	});
	wireCrossAxisDisable([
		xGizmo,
		yGizmo,
		zGizmo
	]);
	return {
		xGizmo,
		yGizmo,
		zGizmo,
		attachedNode: null
	};
}
/** Attach all rotation sub-gizmos to a node, or detach them with `null`. */
function attachRotationGizmoToNode(gizmo, node) {
	gizmo.attachedNode = node;
	attachPlaneRotationGizmoToNode(gizmo.xGizmo, node);
	attachPlaneRotationGizmoToNode(gizmo.yGizmo, node);
	attachPlaneRotationGizmoToNode(gizmo.zGizmo, node);
}
/** Toggle whether the rotation rings follow the attached node's rotation. */
function setRotationGizmoLocalCoordinates(gizmo, useLocal) {
	gizmo.xGizmo.useLocalCoordinates = useLocal;
	gizmo.yGizmo.useLocalCoordinates = useLocal;
	gizmo.zGizmo.useLocalCoordinates = useLocal;
}
/** Dispose all sub-gizmos owned by the composite rotation gizmo. */
function disposeRotationGizmo(gizmo, layer) {
	disposePlaneRotationGizmo(gizmo.xGizmo, layer);
	disposePlaneRotationGizmo(gizmo.yGizmo, layer);
	disposePlaneRotationGizmo(gizmo.zGizmo, layer);
}
/** Create a composite scale gizmo with per-axis handles and a uniform centre handle.
* @param engine - Engine that owns the created meshes.
* @param layer - Utility layer that renders and picks the handles.
* @param options - Shared scale-handle thickness options.
* @returns A detached scale gizmo ready to attach to a node.
*/
function createScaleGizmo(engine, layer, options = {}) {
	const thickness = options.thickness ?? 1;
	const xGizmo = createAxisScaleGizmo(engine, layer, {
		dragAxis: {
			x: 1,
			y: 0,
			z: 0
		},
		color: [
			.5,
			0,
			0
		],
		thickness
	});
	const yGizmo = createAxisScaleGizmo(engine, layer, {
		dragAxis: {
			x: 0,
			y: 1,
			z: 0
		},
		color: [
			0,
			.5,
			0
		],
		thickness
	});
	const zGizmo = createAxisScaleGizmo(engine, layer, {
		dragAxis: {
			x: 0,
			y: 0,
			z: 1
		},
		color: [
			0,
			0,
			.5
		],
		thickness
	});
	const uniformScaleGizmo = createAxisScaleGizmo(engine, layer, {
		dragAxis: {
			x: 0,
			y: 1,
			z: 0
		},
		color: [
			.25,
			.25,
			.25
		],
		uniformScaling: true
	});
	xGizmo.useLocalCoordinates = true;
	yGizmo.useLocalCoordinates = true;
	zGizmo.useLocalCoordinates = true;
	wireCrossAxisDisable([
		xGizmo,
		yGizmo,
		zGizmo,
		uniformScaleGizmo
	]);
	return {
		xGizmo,
		yGizmo,
		zGizmo,
		uniformScaleGizmo,
		attachedNode: null
	};
}
/** Attach all scale sub-gizmos to a node, or detach them with `null`. */
function attachScaleGizmoToNode(gizmo, node) {
	gizmo.attachedNode = node;
	attachAxisScaleGizmoToNode(gizmo.xGizmo, node);
	attachAxisScaleGizmoToNode(gizmo.yGizmo, node);
	attachAxisScaleGizmoToNode(gizmo.zGizmo, node);
	attachAxisScaleGizmoToNode(gizmo.uniformScaleGizmo, node);
}
/** Toggle local-coord mode on the per-axis scale arrows.  The uniform-scale
*  gizmo (centre) is always uniform so it ignores the flag. */
function setScaleGizmoLocalCoordinates(gizmo, useLocal) {
	gizmo.xGizmo.useLocalCoordinates = useLocal;
	gizmo.yGizmo.useLocalCoordinates = useLocal;
	gizmo.zGizmo.useLocalCoordinates = useLocal;
}
/** Dispose all sub-gizmos owned by the composite scale gizmo. */
function disposeScaleGizmo(gizmo, layer) {
	disposeAxisScaleGizmo(gizmo.xGizmo, layer);
	disposeAxisScaleGizmo(gizmo.yGizmo, layer);
	disposeAxisScaleGizmo(gizmo.zGizmo, layer);
	disposeAxisScaleGizmo(gizmo.uniformScaleGizmo, layer);
}
export { attachPositionGizmoToNode, attachRotationGizmoToNode, attachScaleGizmoToNode, createPositionGizmo, createRotationGizmo, createScaleGizmo, disposePositionGizmo, disposeRotationGizmo, disposeScaleGizmo, setPositionGizmoLocalCoordinates, setRotationGizmoLocalCoordinates, setScaleGizmoLocalCoordinates };

//# sourceMappingURL=composite-gizmos.js.map