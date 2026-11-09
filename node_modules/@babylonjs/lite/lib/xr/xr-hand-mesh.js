import { getContainerMeshes } from "../asset-container.js";
import { setSubtreeVisible } from "../scene/visibility.js";
import { addToScene } from "../scene/scene-core.js";
import { removeFromScene } from "../scene/scene-remove.js";
import { _preloadStdMeshExt } from "../material/standard/standard-group-builder.js";
import { createStandardMaterial } from "../material/standard/create-standard-material.js";
import { loadGltf } from "../loader-gltf/load-gltf.js";
import { bakeSkeleton, enableBoneControl, getBoneByName, setBoneWorldPoseDeferred } from "../skeleton/bone-control.js";
import { _rightHanded } from "#coordinate-system";
// src/xr/xr-hand-mesh.ts
/** WebXR `XRHandJoint` → default Babylon hand-rig bone base name (the handedness
*  suffix `_R` / `_L` is appended at load). Mirrors Babylon's
*  `_GenerateDefaultHandMeshRigMapping`. Note the WebXR "pinky" maps to `little_*`
*  and phalanges use the `proxPhalanx` / `intPhalanx` / `distPhalanx` abbreviations. */
var RIG_BASE = {
	wrist: "wrist",
	"thumb-metacarpal": "thumb_metacarpal",
	"thumb-phalanx-proximal": "thumb_proxPhalanx",
	"thumb-phalanx-distal": "thumb_distPhalanx",
	"thumb-tip": "thumb_tip",
	"index-finger-metacarpal": "index_metacarpal",
	"index-finger-phalanx-proximal": "index_proxPhalanx",
	"index-finger-phalanx-intermediate": "index_intPhalanx",
	"index-finger-phalanx-distal": "index_distPhalanx",
	"index-finger-tip": "index_tip",
	"middle-finger-metacarpal": "middle_metacarpal",
	"middle-finger-phalanx-proximal": "middle_proxPhalanx",
	"middle-finger-phalanx-intermediate": "middle_intPhalanx",
	"middle-finger-phalanx-distal": "middle_distPhalanx",
	"middle-finger-tip": "middle_tip",
	"ring-finger-metacarpal": "ring_metacarpal",
	"ring-finger-phalanx-proximal": "ring_proxPhalanx",
	"ring-finger-phalanx-intermediate": "ring_intPhalanx",
	"ring-finger-phalanx-distal": "ring_distPhalanx",
	"ring-finger-tip": "ring_tip",
	"pinky-finger-metacarpal": "little_metacarpal",
	"pinky-finger-phalanx-proximal": "little_proxPhalanx",
	"pinky-finger-phalanx-intermediate": "little_intPhalanx",
	"pinky-finger-phalanx-distal": "little_distPhalanx",
	"pinky-finger-tip": "little_tip"
};
/**
* Load the rigged hand glTF for one handedness and resolve its 25 rig bones. Returns
* `null` if the model has no skeleton (bone control unavailable) — the caller then
* keeps the joint spheres. The container is added to the scene here (hidden); the
* caller reveals it on the first posed frame.
*/
async function loadHandMesh(engine, scene, handedness, opts) {
	enableBoneControl();
	const skeletonReady = _preloadStdMeshExt(() => import("../material/standard/fragments/std-skeleton-fragment.js"), "stdSkeletonExt");
	const file = handedness === "right" ? opts.rightFilename : opts.leftFilename;
	const url = new URL(file, opts.baseUrl).href;
	const container = await loadGltf(engine, url);
	const skeleton = container.skeletons?.[0];
	const root = container.entities[0];
	if (!skeleton || !root) return null;
	const suffix = handedness === "right" ? "_R" : "_L";
	const bones = /* @__PURE__ */ new Map();
	for (const joint of Object.keys(RIG_BASE)) {
		const bone = getBoneByName(skeleton, RIG_BASE[joint] + suffix);
		if (bone) bones.set(joint, bone);
	}
	const mat = createStandardMaterial();
	mat.diffuseColor = [
		opts.color[0],
		opts.color[1],
		opts.color[2]
	];
	mat.alpha = opts.alpha;
	for (const mesh of getContainerMeshes(container)) {
		mesh.material = mat;
		mesh.pickable = false;
		mesh.receiveShadows = false;
	}
	const { enableMirroredMeshes } = await import("../mesh/enable-mirrored-meshes.js");
	await enableMirroredMeshes(scene);
	await skeletonReady;
	addToScene(scene, container);
	setSubtreeVisible(root, false);
	return {
		container,
		root,
		skeleton,
		bones,
		shown: false
	};
}
/**
* Pose a loaded hand mesh's skeleton from the current frame's joint poses. Each flat-rig
* bone receives its absolute Lite world pose, then the skin is baked once. Returns
* `true` if at least one joint was posed (so the caller can reveal the mesh).
*/
function poseHandMesh(loaded, hand, frame, referenceSpace) {
	const getJointPose = frame.getJointPose;
	if (!getJointPose) {
		if (loaded.shown) {
			setSubtreeVisible(loaded.root, false);
			loaded.shown = false;
		}
		return false;
	}
	let posedAny = false;
	for (const [joint, bone] of loaded.bones) {
		const space = hand.get(joint);
		if (!space) continue;
		const pose = getJointPose.call(frame, space, referenceSpace);
		if (!pose) continue;
		const p = pose.transform.position;
		const o = pose.transform.orientation;
		setBoneWorldPoseDeferred(loaded.skeleton, bone, p.x, p.y, _rightHanded ? p.z : -p.z, o.x, o.y, _rightHanded ? o.z : -o.z, _rightHanded ? o.w : -o.w);
		posedAny = true;
	}
	if (posedAny) {
		bakeSkeleton(loaded.skeleton);
		if (!loaded.shown) {
			setSubtreeVisible(loaded.root, true);
			loaded.shown = true;
		}
	} else if (loaded.shown) {
		setSubtreeVisible(loaded.root, false);
		loaded.shown = false;
	}
	return posedAny;
}
/** Detach + free a loaded hand mesh. */
function disposeHandMesh(scene, loaded) {
	removeFromScene(scene, loaded.container);
}
export { disposeHandMesh, loadHandMesh, poseHandMesh };

//# sourceMappingURL=xr-hand-mesh.js.map