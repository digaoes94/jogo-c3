// src/material/stencil-state.ts
/**
* @internal
* Bake a material's {@link StencilState} into a {@link ResolvedStencil}. Lives in its own module so the
* object-literal construction and default-filling never land in the always-fetched pipeline graph — it is
* reachable only after `enableMaterialStencil()` installs it into the per-pipeline resolver hooks.
*/
function _resolveStencil(stencil) {
	const op = {
		compare: stencil.compare ?? "always",
		passOp: stencil.passOp ?? "keep",
		failOp: stencil.failOp ?? "keep",
		depthFailOp: stencil.depthFailOp ?? "keep"
	};
	const readMask = stencil.readMask ?? 255;
	const writeMask = stencil.writeMask ?? 255;
	return {
		_desc: {
			stencilFront: op,
			stencilBack: op,
			stencilReadMask: readMask,
			stencilWriteMask: writeMask
		},
		_key: `st:${op.compare}:${op.passOp}:${op.failOp}:${op.depthFailOp}:${readMask}:${writeMask}`
	};
}
export { _resolveStencil };

//# sourceMappingURL=stencil-state.js.map