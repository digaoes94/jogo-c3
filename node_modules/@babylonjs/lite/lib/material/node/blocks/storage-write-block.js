// src/material/node/blocks/storage-write-block.ts
var emitter = {
	className: "StorageWriteBlock",
	emit(block, _outputName, stage, state, ctx) {
		return ctx.resolve(block, "value", stage, state);
	}
};
export { emitter };

//# sourceMappingURL=storage-write-block.js.map