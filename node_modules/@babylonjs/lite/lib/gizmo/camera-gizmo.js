import { addToScene } from "../scene/scene-core.js";
import { removeFromScene } from "../scene/scene-remove.js";
import { createBox, createCylinder } from "../mesh/mesh-factories.js";
import { createStandardMaterial } from "../material/standard/create-standard-material.js";
import { attachFollowTarget } from "./gizmo-core.js";
import { quatFromBjsEuler, rotationQuatFromMatrix } from "./gizmo-math.js";
import { createTransformNode } from "../scene/transform-node.js";
import { _rightHanded } from "#coordinate-system";
// src/gizmo/camera-gizmo.ts
/** BJS `CameraGizmo._Scale` — applied to the camera body so it keeps a
*  constant on-screen size (combined with per-frame distance scaling). */
var CAMERA_BODY_SCALE = .05;
/** Default camera-gizmo wireframe thickness in world units (independent of
*  camera distance because the frustum geometry is in literal world space).
*  Tuned (≈3× the original hairline) so the cylinder edges render at roughly
*  the same on-screen width as the BJS reference's antialiased frustum lines —
*  this minimises the scene-223 parity MAD (0.39 → 0.07 at this value). */
var FRUSTUM_EDGE_THICKNESS = .036;
/** Build the BJS `_CreateCameraMesh` body: a box (the camera housing) plus
*  three cylinders (two reels + a lens).  Parented to `bodyMesh`, which the
*  caller offsets / rotates / distance-scales.  Geometry numbers are copied
*  verbatim from BJS. */
function buildCameraBodyMesh(engine, scene, material, bodyMesh) {
	const meshes = [];
	const rotX = quatFromBjsEuler(Math.PI * .5, 0, 0);
	const rotZ = quatFromBjsEuler(0, 0, Math.PI * .5);
	const box = createBox(engine, 1);
	box.scaling.set(1, .8, .5);
	box.material = material;
	box.pickable = false;
	box.parent = bodyMesh;
	addToScene(scene, box);
	meshes.push(box);
	const cyl1 = createCylinder(engine, {
		height: .5,
		diameterTop: .8,
		diameterBottom: .8,
		tessellation: 24
	});
	cyl1.material = material;
	cyl1.pickable = false;
	cyl1.position.set(-.6, .3, 0);
	cyl1.rotationQuaternion.set(rotX[0], rotX[1], rotX[2], rotX[3]);
	cyl1.parent = bodyMesh;
	addToScene(scene, cyl1);
	meshes.push(cyl1);
	const cyl2 = createCylinder(engine, {
		height: .5,
		diameterTop: .6,
		diameterBottom: .6,
		tessellation: 24
	});
	cyl2.material = material;
	cyl2.pickable = false;
	cyl2.position.set(.4, .5, 0);
	cyl2.rotationQuaternion.set(rotX[0], rotX[1], rotX[2], rotX[3]);
	cyl2.parent = bodyMesh;
	addToScene(scene, cyl2);
	meshes.push(cyl2);
	const cyl3 = createCylinder(engine, {
		height: .5,
		diameterTop: .5,
		diameterBottom: .5,
		tessellation: 24
	});
	cyl3.material = material;
	cyl3.pickable = false;
	cyl3.position.set(.6, 0, 0);
	cyl3.rotationQuaternion.set(rotZ[0], rotZ[1], rotZ[2], rotZ[3]);
	cyl3.parent = bodyMesh;
	addToScene(scene, cyl3);
	meshes.push(cyl3);
	return meshes;
}
/** Build a single edge cylinder oriented from `a` to `b` in `root`'s local
*  space.  The cylinder is parented to `root` and positioned at the midpoint
*  with +Y axis rotated onto the edge direction. */
function buildFrustumEdge(engine, utilityScene, material, root, thickness, a, b) {
	const mesh = createCylinder(engine, {
		height: 1,
		diameterTop: thickness,
		diameterBottom: thickness,
		tessellation: 6
	});
	mesh.material = material;
	mesh.pickable = false;
	mesh.parent = root;
	addToScene(utilityScene, mesh);
	const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
	const len = Math.hypot(dx, dy, dz) || 1;
	mesh.position.set((a.x + b.x) * .5, (a.y + b.y) * .5, (a.z + b.z) * .5);
	mesh.scaling.set(1, len, 1);
	const nx = dx / len, ny = dy / len, nz = dz / len;
	const cx = 1 * nz - 0 * ny;
	const cy = 0 * nx - 0 * nz;
	const cz = 0 * ny - 1 * nx;
	const cLen = Math.hypot(cx, cy, cz);
	const dot = 0 * nx + 1 * ny + 0 * nz;
	if (cLen < 1e-7) {
		if (dot > 0) mesh.rotationQuaternion.set(0, 0, 0, 1);
		else mesh.rotationQuaternion.set(1, 0, 0, 0);
	} else {
		const angle = Math.atan2(cLen, dot);
		const s = Math.sin(angle * .5);
		mesh.rotationQuaternion.set(cx / cLen * s, cy / cLen * s, cz / cLen * s, Math.cos(angle * .5));
	}
	return mesh;
}
/** Build the 12 frustum-wireframe edges parented to `root`.  Geometry is
*  computed in camera-local space (+Y up, looking down +Z, or -Z in a right-handed build) to exactly
*  reproduce BJS `_CreateCameraFrustum` + `setPivotMatrix(inv(projection))`.
*
*  BJS builds an NDC cube with z ∈ [-1, 1] and transforms it by the inverse
*  projection.  Because the WebGPU/D3D projection uses z ∈ [0, 1], the cube's
*  z = -1 ("near") corners do NOT map to the camera's near plane — they map to
*  view-space z = far·near / (2·far − near).  Reproducing that here so the near
*  rectangle has the same (smaller) size as the reference; the far corners
*  (cube z = +1) map to the camera's actual far plane. */
function buildFrustumWireframe(engine, utilityScene, material, root, fov, aspect, nearPlane, farPlane) {
	const tanHalf = Math.tan(fov * .5);
	const nearP = Math.max(nearPlane, 1e-4);
	const far = Math.max(farPlane, nearP);
	const near = far * nearP / (2 * far - nearP);
	const nh = tanHalf * near;
	const nw = nh * aspect;
	const fh = tanHalf * far;
	const fw = fh * aspect;
	const corners = [
		{
			x: -nw,
			y: -nh,
			z: +near
		},
		{
			x: +nw,
			y: -nh,
			z: +near
		},
		{
			x: +nw,
			y: +nh,
			z: +near
		},
		{
			x: -nw,
			y: +nh,
			z: +near
		},
		{
			x: -fw,
			y: -fh,
			z: +far
		},
		{
			x: +fw,
			y: -fh,
			z: +far
		},
		{
			x: +fw,
			y: +fh,
			z: +far
		},
		{
			x: -fw,
			y: +fh,
			z: +far
		}
	];
	if (_rightHanded !== null) for (const corner of corners) corner.z = -corner.z;
	const edgePairs = [
		[0, 1],
		[1, 2],
		[2, 3],
		[3, 0],
		[4, 5],
		[5, 6],
		[6, 7],
		[7, 4],
		[0, 4],
		[1, 5],
		[2, 6],
		[3, 7]
	];
	const meshes = [];
	for (const [i, j] of edgePairs) meshes.push(buildFrustumEdge(engine, utilityScene, material, root, FRUSTUM_EDGE_THICKNESS, corners[i], corners[j]));
	return meshes;
}
/** Build a display-only camera gizmo and attach it to the given utility
*  layer.  Call `attachCameraGizmoToCamera` to bind a camera.
*
*  The gizmo has two independently-toggleable parts, both visible by default
*  and parented to a root that follows the attached camera's world translation
*  + orientation each frame:
*
*  - A camera **body** (`displayBody`, defaults to `true`) — a distance-scaled
*    box + 3 cylinders ported from BJS `_CreateCameraMesh`, lit grey, sized
*    so it stays a roughly constant size on screen.
*  - A camera **frustum** (`displayFrustum`, defaults to `true`) — 12 thin
*    cylinder edges forming a truncated-pyramid wireframe sized from the
*    camera's fov / near / far (far clamped to 60× near), unlit white.
*
*  Set the matching option to `false` to display only one of them. */
function createCameraGizmo(engine, layer, options = {}) {
	const bodyColor = options.color ?? [
		.5,
		.5,
		.5
	];
	const frustumColor = options.frustumColor ?? [
		1,
		1,
		1
	];
	const displayFrustum = options.displayFrustum ?? true;
	const displayBody = options.displayBody ?? true;
	const utilityScene = layer.scene;
	const material = createStandardMaterial();
	material.diffuseColor = bodyColor;
	material.specularColor = [
		.1,
		.1,
		.1
	];
	const frustumMaterial = createStandardMaterial();
	frustumMaterial.diffuseColor = frustumColor;
	frustumMaterial.emissiveColor = [
		1,
		1,
		1
	];
	frustumMaterial.disableLighting = true;
	const root = createTransformNode("cameraGizmoRoot", 0, 0, 0, 0, 0, 0, 1);
	addToScene(utilityScene, root);
	const gizmo = {
		root,
		material,
		frustumMaterial,
		attachedCamera: null,
		_meshes: [root],
		_frustumEdges: [],
		_bodyOuter: null,
		_disposeFollow: () => void 0
	};
	if (displayBody) {
		const outerRot = quatFromBjsEuler(0, _rightHanded ? Math.PI * .5 : -Math.PI * .5, 0);
		const bodyOuter = createTransformNode("cameraBodyOuter", 0, 0, 0, outerRot[0], outerRot[1], outerRot[2], outerRot[3]);
		bodyOuter.parent = root;
		const bodyMesh = createTransformNode("cameraBodyMesh", -.9, 0, 0, 0, 0, 0, 1);
		bodyMesh.parent = bodyOuter;
		const bodyMeshes = buildCameraBodyMesh(engine, utilityScene, material, bodyMesh);
		gizmo._bodyOuter = bodyOuter;
		gizmo._meshes.push(bodyOuter, bodyMesh, ...bodyMeshes);
	}
	const _ensureFrustum = (cam) => {
		if (!displayFrustum || gizmo._frustumEdges.length > 0) return;
		const canvas = engine.canvas;
		const aspect = canvas.width > 0 && canvas.height > 0 ? canvas.width / canvas.height : 16 / 9;
		const fov = cam.fov ?? .8;
		const nearPlane = cam.nearPlane ?? .1;
		const farPlane = cam.farPlane ?? 100;
		const edges = buildFrustumWireframe(engine, utilityScene, frustumMaterial, root, fov, aspect, nearPlane, farPlane);
		gizmo._frustumEdges = edges;
		gizmo._meshes.push(...edges);
	};
	gizmo._ensureFrustum = _ensureFrustum;
	gizmo._disposeFollow = attachFollowTarget(utilityScene, root, () => gizmo.attachedCamera ? cameraAsSceneNode(gizmo.attachedCamera) : null, null, (_target, wm) => {
		const [qx, qy, qz, qw] = rotationQuatFromMatrix(wm);
		root.rotationQuaternion.set(qx, qy, qz, qw);
		if (gizmo._bodyOuter) {
			const cam = utilityScene.camera;
			let dist = CAMERA_BODY_SCALE;
			if (cam) {
				const cw = cam.worldMatrix;
				dist = Math.hypot(cw[12] - wm[12], cw[13] - wm[13], cw[14] - wm[14]) * CAMERA_BODY_SCALE;
			}
			gizmo._bodyOuter.scaling.set(dist, dist, dist);
		}
	});
	return gizmo;
}
/** Attach the camera gizmo to a camera, or detach it with `null`.
* The frustum wireframe is built lazily the first time a camera is attached.
*/
function attachCameraGizmoToCamera(gizmo, camera) {
	gizmo.attachedCamera = camera;
	if (camera) {
		const ensure = gizmo._ensureFrustum;
		if (ensure) ensure(camera);
	}
}
/** Dispose all meshes and follow callbacks owned by the camera gizmo. */
function disposeCameraGizmo(gizmo, layer) {
	gizmo._disposeFollow();
	for (const m of gizmo._meshes) if ("_gpu" in m) removeFromScene(layer.scene, m);
	else m.parent = null;
	gizmo._meshes.length = 0;
}
/** Adapt a `Camera` to look like a `SceneNode` for `attachFollowTarget`.
*  Cameras don't expose `position`/`rotationQuaternion`/`scaling` as
*  observable vec3s, but `attachFollowTarget` only reads `.worldMatrix`. */
function cameraAsSceneNode(cam) {
	return cam;
}
export { attachCameraGizmoToCamera, createCameraGizmo, disposeCameraGizmo };

//# sourceMappingURL=camera-gizmo.js.map