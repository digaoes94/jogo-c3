import { computeUboLayout } from "../../shader/ubo-layout.js";
// src/material/plugin/plugin-bridge-shared.ts
var STAGE_FRAGMENT = 2;
/** WGSL variable name of the Standard self-managed plugin uniform buffer. Plugin
*  custom code reads its uniforms as `pluginUbo.<field>` (Standard); PBR plugin
*  uniforms ride the material UBO and are read as `material.<field>`. */
var STD_PLUGIN_UBO = "pluginUbo";
var FRAG_POINT_TO_SLOTS = {
	CUSTOM_FRAGMENT_MAIN_BEGIN: ["SV"],
	CUSTOM_FRAGMENT_UPDATE_ALPHA: ["AT"],
	CUSTOM_FRAGMENT_UPDATE_DIFFUSE: ["AC"],
	CUSTOM_FRAGMENT_BEFORE_LIGHTS: ["MF"],
	CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION: ["AI", "NI"],
	CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: ["BC"]
};
var VERT_POINT_TO_SLOT = {
	CUSTOM_VERTEX_MAIN_BEGIN: "VR",
	CUSTOM_VERTEX_UPDATE_WORLDPOS: "VW",
	CUSTOM_VERTEX_MAIN_END: "VB"
};
/** Enabled plugins, lowest-priority-first (priority default 500). */
function enabledPlugins(plugins) {
	return plugins.filter((p) => p.isEnabled !== false).sort((a, b) => (a.priority ?? 500) - (b.priority ?? 500));
}
/** Stable signature of a plugin list. Includes disabled plugins (so a toggle
*  still changes the key) plus every cache-affecting input of the enabled ones. */
function pluginSignature(plugins) {
	const parts = [];
	for (const p of plugins) {
		const on = p.isEnabled !== false;
		parts.push(`${p.name}${on ? "+" : "-"}${p.priority ?? 500}:${JSON.stringify(p.defines ?? null)}`);
		if (on) {
			parts.push(JSON.stringify(p.getCustomCode?.("fragment") ?? null));
			parts.push(JSON.stringify(p.getCustomCode?.("vertex") ?? null));
			parts.push(JSON.stringify(p.getUniforms?.() ?? null));
			parts.push(JSON.stringify(p.getSamplers?.() ?? null));
		}
	}
	return parts.join("|");
}
/** Build a single composed ShaderFragment from the enabled plugins of a material.
*
*  @param plugins - The material's attached plugins.
*  @param index - Per-signature index folded into the fragment id / cache key.
*  @param forStandard - When true, plugin uniforms are delivered through a dedicated
*      self-managed uniform buffer (`pluginUbo`) declared as a fragment binding —
*      this keeps ALL shared standard code untouched (the engine routes it through
*      the pre-existing `_bind` loop). When false (PBR), uniforms are appended to
*      the host material UBO via `_uboFields` and written by the pre-existing PBR
*      `writeUbo` loop. */
function buildPluginFragment(plugins, index, forStandard) {
	const enabled = enabledPlugins(plugins);
	if (enabled.length === 0) return {
		_fragment: { _id: `plugin-${index}` },
		_stdUboSpec: null
	};
	let helpers = ``;
	const fragmentSlots = {};
	const vertexSlots = {};
	const uboFields = [];
	const bindings = [];
	const append = (bucket, key, code) => {
		bucket[key] = `${bucket[key] ?? ""} ${code}`;
	};
	for (const p of enabled) {
		const frag = p.getCustomCode?.("fragment");
		if (frag) for (const point of Object.keys(frag)) {
			const code = frag[point];
			if (!code) continue;
			if (point === "CUSTOM_FRAGMENT_DEFINITIONS") {
				helpers = `${helpers} ${code}`;
				continue;
			}
			const slots = FRAG_POINT_TO_SLOTS[point];
			if (slots) for (const s of slots) append(fragmentSlots, s, code);
		}
		const vert = p.getCustomCode?.("vertex");
		if (vert) for (const point of Object.keys(vert)) {
			const code = vert[point];
			const slot = VERT_POINT_TO_SLOT[point];
			if (code && slot) append(vertexSlots, slot, code);
		}
		const ubo = p.getUniforms?.()?.ubo;
		if (ubo) for (const f of ubo) uboFields.push({
			_name: f.name,
			_type: f.type
		});
		const samplers = p.getSamplers?.();
		if (samplers) for (const s of samplers) bindings.push({
			_name: s.texture,
			_type: {
				_kind: "texture",
				_textureType: s.textureType ?? "texture_2d<f32>"
			},
			_visibility: STAGE_FRAGMENT
		}, {
			_name: s.sampler,
			_type: {
				_kind: "sampler",
				_samplerType: s.samplerType ?? "sampler"
			},
			_visibility: STAGE_FRAGMENT
		});
	}
	let stdUboSpec = null;
	let stdUboFields = uboFields.length ? uboFields : void 0;
	if (forStandard && uboFields.length) {
		stdUboSpec = computeUboLayout(uboFields);
		helpers = `struct ${STD_PLUGIN_UBO}Uniforms{${stdUboSpec._structBody}}${helpers}`;
		bindings.unshift({
			_name: STD_PLUGIN_UBO,
			_type: { _kind: "uniform-buffer" },
			_group: "mesh",
			_visibility: STAGE_FRAGMENT
		});
		stdUboFields = void 0;
	}
	return {
		_fragment: {
			_id: `plugin-${index}`,
			_helperFunctions: helpers || void 0,
			_fragmentSlots: Object.keys(fragmentSlots).length ? fragmentSlots : void 0,
			_vertexSlots: Object.keys(vertexSlots).length ? vertexSlots : void 0,
			_uboFields: stdUboFields,
			_bindings: bindings.length ? bindings : void 0
		},
		_stdUboSpec: stdUboSpec
	};
}
/** Write a prepared enabled plugin list's UBO slices into `data` using `offsets`. */
function writePluginUbo(plugins, data, offsets) {
	for (const p of plugins) p.writeUbo?.(data, offsets);
}
/** Collect textures owned by a prepared enabled plugin list. */
function collectPluginTextures(plugins, out) {
	for (const p of plugins) p.getActiveTextures?.(out);
}
/** Push a prepared enabled plugin list's texture+sampler bind entries starting at `b`. */
function bindPluginTextures(plugins, entries, b) {
	for (const p of plugins) {
		if (!p.bindTextures) continue;
		const out = [];
		p.bindTextures(out);
		for (const binding of out) {
			entries.push({
				binding: b++,
				resource: binding.texture.view
			});
			entries.push({
				binding: b++,
				resource: binding.texture.sampler
			});
		}
	}
	return b;
}
export { bindPluginTextures, buildPluginFragment, collectPluginTextures, enabledPlugins, pluginSignature, writePluginUbo };

//# sourceMappingURL=plugin-bridge-shared.js.map