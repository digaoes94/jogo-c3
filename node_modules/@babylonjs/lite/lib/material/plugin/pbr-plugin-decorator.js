// src/material/plugin/pbr-plugin-decorator.ts
/** @internal Optional pass/resource policy installed by a material feature. */
var pbrPluginDecorator = null;
/** @internal Ordinary material plugins retain their original bridge when unused. */
function installPbrPluginDecorator(decorator) {
	pbrPluginDecorator = decorator;
}
export { installPbrPluginDecorator, pbrPluginDecorator };

//# sourceMappingURL=pbr-plugin-decorator.js.map