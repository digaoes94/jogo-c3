import "../pbr/pbr-flag-bits.js";
import { bindPluginTextures, collectPluginTextures } from "./plugin-bridge-shared.js";
import { installPbrPluginDecorator } from "./pbr-plugin-decorator.js";
import { _allocatePbrPluginIndex, _getActivePbrPluginExt, _getPbrPluginFragment, _registerPbrPluginFragment, _setActivePbrPluginExt } from "./pbr-plugin-registry.js";
import { pbrPluginExt } from "./pbr-plugin-bridge.js";
// src/material/plugin/pbr-plugin-passes.ts
var passes = null;
/** @internal Immutable shader identity metadata, never material instances. */
function pbrPluginSignatureContains(index, name) {
	return passes?.get(index)?.names.includes(name) ?? false;
}
/** @internal Match fragment selection and resource binding for diffuse-environment plugins. */
function isPbrIblColorPass(features, features2, hasIbl) {
	return hasIbl && (features & 64) === 0 && (features2 & 2195728) === 0;
}
/** @internal Construction-only selection; ordinary plugin users do not retain this policy. */
function selectPbrPlugins(plugins, iblPass) {
	return iblPass ? plugins : plugins.filter((plugin) => !plugin._pbrIblOnly);
}
/** @internal Decorate either plugin bridge only after a pass-specific feature opts in. */
function enablePbrPluginPasses() {
	if (passes) return;
	const metadata = passes = /* @__PURE__ */ new Map();
	const wrappers = /* @__PURE__ */ new WeakMap();
	const variants = /* @__PURE__ */ new Map();
	installPbrPluginDecorator((extension) => {
		const existing = wrappers.get(extension);
		if (existing) return existing;
		const decorated = {
			...extension,
			detect(material) {
				const result = extension.detect(material);
				const pbr = material;
				const plugins = pbr._preparedPlugins;
				if (!plugins?.some((plugin) => plugin._pbrIblOnly)) return result;
				const full = pbr._pi;
				const signature = `${full}:${plugins.map((plugin) => Number(!!plugin._pbrIblOnly)).join("")}`;
				let index = variants.get(signature);
				if (index === void 0) {
					const filtered = Object.create(pbr);
					filtered.plugins = [...selectPbrPlugins(plugins, false)];
					extension.detect(filtered);
					index = _allocatePbrPluginIndex();
					_registerPbrPluginFragment(index, _getPbrPluginFragment(full));
					metadata.set(index, {
						other: filtered._pi,
						names: plugins.map((plugin) => plugin.name)
					});
					variants.set(signature, index);
				}
				pbr._pi = index;
				return result;
			},
			frag(context) {
				const pass = metadata.get(context._pi ?? 0);
				return pass && !isPbrIblColorPass(context._features, context._features2, context._hasIbl) ? pass.other ? extension.frag({
					...context,
					_pi: pass.other
				}) : null : extension.frag(context);
			},
			bind(context, entries, binding) {
				const plugins = context._material._preparedPlugins;
				return plugins?.length ? bindPluginTextures(selectPbrPlugins(plugins, isPbrIblColorPass(context._features, context._features2, !!context._env)), entries, binding) : binding;
			},
			textures(material, out) {
				const plugins = material._preparedPlugins;
				if (plugins?.length) collectPluginTextures(plugins.filter((plugin) => !plugin._bindingVersion), out);
			}
		};
		wrappers.set(extension, decorated);
		return decorated;
	});
	_setActivePbrPluginExt(_getActivePbrPluginExt(pbrPluginExt));
}
export { enablePbrPluginPasses, isPbrIblColorPass, pbrPluginSignatureContains, selectPbrPlugins };

//# sourceMappingURL=pbr-plugin-passes.js.map