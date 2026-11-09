import { getMaterialSource } from "./material-view.js";
// src/material/material-uv-transform.ts
/** Return whether a material source has opted into per-texture UV transforms. */
function hasMaterialUvTransform(material) {
	return getMaterialSource(material)._hasUvTx === true;
}
export { hasMaterialUvTransform };

//# sourceMappingURL=material-uv-transform.js.map