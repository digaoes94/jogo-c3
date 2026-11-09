// src/material/node/blocks/shadow-map.ts
var emitter = {
	className: "ShadowMapBlock",
	stage: "fragment",
	emit(block, _outputName, _stage, _state, _ctx) {
		const idxRaw = block.serialized.lightId;
		return {
			expr: `_NME_SHADOW_${typeof idxRaw === "number" ? idxRaw : 0}_`,
			type: "f32"
		};
	}
};
export { emitter };

//# sourceMappingURL=shadow-map.js.map