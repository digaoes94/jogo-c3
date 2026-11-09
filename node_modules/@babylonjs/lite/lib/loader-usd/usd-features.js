import { mat4Determinant3 } from "../math/mat4-determinant3.js";
import { _registerAssetContainerSceneCleanup } from "../loader-gltf/gltf-scene-cleanup.js";
import { UsdOp } from "./usd-protocol.js";
// src/loader-usd/usd-features.ts
/** @internal Optional command families are resolved only for assets that contain them. */
async function applyUsdFeatures(context) {
	const has = (op) => context.records.some((record) => record.op === op);
	const features = [
		[has(UsdOp.Analytic), () => import("./usd-analytics.js")],
		[has(UsdOp.Skeleton), () => import("./usd-skeletons.js")],
		[has(UsdOp.MorphTarget), () => import("./usd-morphs.js")],
		[has(UsdOp.Instance), () => import("./usd-instances.js")],
		[has(UsdOp.ThinInstances), () => import("./usd-thin-instances.js")],
		[has(UsdOp.Animation), () => import("./usd-animation.js")]
	];
	for (const [needed, load] of features) if (needed) {
		const feature = await load();
		context.signal?.throwIfAborted();
		await Promise.resolve(feature.apply(context));
	}
	const installMirroredMeshSupport = has(UsdOp.Animation) || context.container._usdMeshes.some((mesh) => mat4Determinant3(mesh.worldMatrix) > 0) ? (await import("../material/standard/std-mirrored-support.js")).installMirroredMeshSupport : void 0;
	const publish = context.publishAnimation;
	if (installMirroredMeshSupport || publish) context.container._sceneSetup = (scene, container) => {
		installMirroredMeshSupport?.(scene);
		if (publish) {
			scene._beforeRender.push(publish);
			_registerAssetContainerSceneCleanup(container, scene, () => {
				const index = scene._beforeRender.indexOf(publish);
				if (index >= 0) scene._beforeRender.splice(index, 1);
			});
		}
	};
}
export { applyUsdFeatures };

//# sourceMappingURL=usd-features.js.map