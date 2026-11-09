// src/material/pbr/tone-mapping.ts
/**
* Default tone mapping: Babylon.js `TONEMAPPING_STANDARD` (exponential). The call
* is inline (no helpers), so it is the cheapest option and matches the result
* produced when `imageProcessing.toneMapping` is left undefined.
*/
var StandardToneMapping = {
	id: "standard",
	helpersWGSL: "",
	callWGSL: `color*=scene.vImageInfos.x;color=1.0-exp2(-1.590579*color);`
};
export { StandardToneMapping };

//# sourceMappingURL=tone-mapping.js.map