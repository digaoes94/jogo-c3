import { F32, I32, U32, U8 } from "../../engine/typed-arrays.js";
import { multiplyMat4IntoBuffer } from "../../math/multiply-mat4-into-buffer.js";
import { getEffectiveAspectRatio, getProjectionMatrix, getViewMatrix, getViewProjectionMatrix } from "../../camera/camera.js";
import { shaderSystemDependencies } from "./shader-system-dependencies.js";
import { _isShaderSystemUniform } from "./shader-material.js";
import { _installShaderUniformWriters, _shaderWorldMatrix } from "./shader-renderable.js";
// src/material/shader/enable-shader-material-uniform-caching.ts
var customPlans = /* @__PURE__ */ new WeakMap();
var systemPlans = /* @__PURE__ */ new WeakMap();
var SYSTEM_OPERATIONS = {
	world: 0,
	view: 1,
	projection: 2,
	viewProjection: 3,
	worldView: 4,
	worldViewProjection: 5,
	cameraPosition: 6,
	screenSize: 7,
	alphaCutoff: 8
};
function getCustomWritePlan(material, spec, data) {
	const cached = customPlans.get(material);
	if (cached && cached.data === data && cached.size === material._uniformValues.size) return cached;
	const slots = [];
	const indices = [];
	const kinds = [];
	const lengths = [];
	for (const [name, slot] of material._uniformValues) {
		if (_isShaderSystemUniform(name)) continue;
		const offset = spec._offsets.get(name);
		if (offset === void 0) continue;
		slot._v ??= 0;
		slots.push(slot);
		indices.push(offset / 4);
		kinds.push(slot.decl.type === "u32" ? 1 : slot.decl.type === "i32" ? 2 : 0);
		lengths.push(slot.value.length);
	}
	const plan = {
		data,
		size: material._uniformValues.size,
		f32: new F32(data),
		u32: new U32(data),
		i32: new I32(data),
		slots,
		indices: new I32(indices),
		kinds: new U8(kinds),
		lengths: new I32(lengths),
		versions: new I32(slots.length).fill(-1)
	};
	customPlans.set(material, plan);
	return plan;
}
function getSystemWritePlan(material, spec) {
	const cached = systemPlans.get(material);
	if (cached?.spec === spec) return cached;
	const operations = [];
	const indices = [];
	for (const uniform of material.uniformDecls) {
		if (!_isShaderSystemUniform(uniform.name)) continue;
		const offset = spec._offsets.get(uniform.name);
		if (offset !== void 0) {
			operations.push(SYSTEM_OPERATIONS[uniform.name]);
			indices.push(offset / 4);
		}
	}
	const plan = {
		spec,
		operations: new U8(operations),
		indices: new I32(indices),
		alphaCutoff: spec._offsets.has("alphaCutoff") ? material._uniformValues.get("alphaCutoff") : void 0,
		dependencies: shaderSystemDependencies(spec)
	};
	systemPlans.set(material, plan);
	return plan;
}
var writeCachedCustomUniforms = (engine, material, spec, data, ubo, bytes, uniformBatch) => {
	const plan = getCustomWritePlan(material, spec, data);
	let changed = false;
	for (let i = 0; i < plan.slots.length; i++) {
		const slot = plan.slots[i];
		const version = slot._v;
		if (version === plan.versions[i]) continue;
		changed = true;
		plan.versions[i] = version;
		const index = plan.indices[i];
		const value = slot.value;
		const kind = plan.kinds[i];
		if (kind === 1) plan.u32[index] = value[0];
		else if (kind === 2) plan.i32[index] = value[0];
		else if (plan.lengths[i] === 1) plan.f32[index] = value[0];
		else plan.f32.set(value, index);
	}
	if (!changed) return;
	if (uniformBatch) uniformBatch.queue(ubo, bytes);
	else engine._device.queue.writeBuffer(ubo, 0, bytes);
};
var writeCachedSystemUniforms = (data, spec, material, mesh, camera, targetWidth, targetHeight) => {
	const plan = getSystemWritePlan(material, spec);
	const dependencies = plan.dependencies;
	const world = dependencies & 1 ? _shaderWorldMatrix(mesh, camera) : null;
	const aspect = dependencies & 12 && camera ? getEffectiveAspectRatio(camera, targetWidth, targetHeight) : 1;
	const view = dependencies & 2 && camera ? getViewMatrix(camera) : null;
	const projection = dependencies & 4 && camera ? getProjectionMatrix(camera, aspect) : null;
	const viewProjection = dependencies & 8 && camera ? getViewProjectionMatrix(camera, aspect) : null;
	for (let i = 0; i < plan.operations.length; i++) {
		const index = plan.indices[i];
		switch (plan.operations[i]) {
			case 0:
				data.set(world, index);
				break;
			case 1:
				view ? data.set(view, index) : data.fill(0, index, index + 16);
				break;
			case 2:
				projection ? data.set(projection, index) : data.fill(0, index, index + 16);
				break;
			case 3:
				viewProjection ? data.set(viewProjection, index) : data.fill(0, index, index + 16);
				break;
			case 4:
				view ? multiplyMat4IntoBuffer(data, index, view, 0, world, 0) : data.fill(0, index, index + 16);
				break;
			case 5:
				viewProjection ? multiplyMat4IntoBuffer(data, index, viewProjection, 0, world, 0) : data.fill(0, index, index + 16);
				break;
			case 6:
				if (camera && !camera._useFloatingOrigin) {
					const cameraWorld = camera.worldMatrix;
					data[index] = cameraWorld[12];
					data[index + 1] = cameraWorld[13];
					data[index + 2] = cameraWorld[14];
				} else data[index] = data[index + 1] = data[index + 2] = 0;
				break;
			case 7:
				data[index] = targetWidth;
				data[index + 1] = targetHeight;
				break;
			case 8: data[index] = plan.alphaCutoff?.value[0] ?? .4;
		}
	}
};
/**
* Enable cached serialization plans for ShaderMaterial system and custom uniform blocks.
*
* Call once before registering scenes that contain many ShaderMaterials or large custom uniform blocks.
* The default path stays compact; enabled scenes avoid repeated layout lookups and rewrite only custom
* uniform slots whose value changed. Both paths invalidate system blocks only for declared dependencies.
*/
function enableShaderMaterialUniformCaching() {
	_installShaderUniformWriters(writeCachedSystemUniforms, writeCachedCustomUniforms);
}
export { enableShaderMaterialUniformCaching };

//# sourceMappingURL=enable-shader-material-uniform-caching.js.map