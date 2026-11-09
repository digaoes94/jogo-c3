// src/material/node/blocks/image-source.ts
var emitter = {
	className: "ImageSourceBlock",
	emit(block, _outputName, _stage, state, ctx) {
		const bindingName = ctx.sanitize(block.name || `img${block.id}`);
		if (!state.textures.find((t) => t.name === bindingName)) state.textures.push({
			name: bindingName,
			kind: "texture2d",
			texture: null
		});
		return {
			expr: bindingName,
			type: "texture2d"
		};
	}
};
export { emitter };

//# sourceMappingURL=image-source.js.map