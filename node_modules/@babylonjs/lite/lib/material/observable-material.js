import { getMaterialSource } from "./material-view.js";
// src/material/observable-material.ts
/** Enable automatic dirty tracking on a PBR or Standard material.
*  After calling this, any UBO-backed property mutation marks the source material UBO dirty. */
async function enableMaterialTracking(material) {
	const source = getMaterialSource(material);
	if ("specularPower" in source) {
		const { installStdTracking } = await import("./tracking/std-tracking.js");
		installStdTracking(source);
	} else {
		const { installPbrTracking } = await import("./tracking/pbr-tracking.js");
		installPbrTracking(source);
	}
}
export { enableMaterialTracking };

//# sourceMappingURL=observable-material.js.map