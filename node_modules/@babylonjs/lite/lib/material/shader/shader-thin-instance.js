import { syncThinInstanceBuffers, syncThinInstanceForDraw } from "../../mesh/thin-instance-gpu.js";
import { _rightHanded } from "#coordinate-system";
// src/material/shader/shader-thin-instance.ts
/** Append matching GPU layouts and WGSL inputs from the same matrix-row locations. */
function appendInstanceInputs(layouts, baseLocation, hasColor) {
	const attributes = [];
	let source = ``;
	for (let row = 0; row < 4; row++) {
		const shaderLocation = baseLocation + row;
		attributes.push({
			shaderLocation,
			offset: row * 16,
			format: "float32x4"
		});
		source = `${source}@location(${shaderLocation})world${row}:vec4<f32>,`;
	}
	layouts.push({
		arrayStride: 64,
		stepMode: "instance",
		attributes
	});
	if (hasColor) {
		layouts.push({
			arrayStride: 16,
			stepMode: "instance",
			attributes: [{
				shaderLocation: baseLocation + 4,
				offset: 0,
				format: "float32x4"
			}]
		});
		source = `${source}@location(${baseLocation + 4})instanceColor:vec4<f32>,`;
	}
	return source;
}
/** Group entry point used whenever a ShaderMaterial scene has at least one
*  thin-instanced mesh. Plain meshes flow through the passed-in `buildPlain`.
*  Builders capture the positional helpers directly, without an intermediate helper bag. */
function buildShaderRenderablesWithInstancing(scene, meshes, buildPlain, createPacket, updatePacket, updateCustomUbo, getAttrBuffer, getOrCreateShaderPipeline, getOrCreateShaderPipelineBindings, getUniformBatch, cull, getVertexLayout, registerPipeline) {
	/** Build ONE thin-instance renderable for a ShaderMaterial mesh (opaque or transparent). */
	function createShaderInstancedRenderable(scene, material, packet, bindings, isOverride, cull, vertexLayout) {
		const isTransparent = material.needAlphaBlending;
		const mesh = packet.mesh;
		const ti = mesh.thinInstances;
		const hasColor = !!ti.colors && material._tic != 0;
		const baseLocation = material.attributes.length;
		const variantKey = _rightHanded && (mesh._primitiveFeatures ?? 0) & 2048 ? `${+hasColor}${vertexLayout?._key ?? mesh._gpu._vbKey ?? ""}|ccw` : `${+hasColor}${vertexLayout?._key ?? mesh._gpu._vbKey ?? ""}`;
		const vertexBuffers = [...vertexLayout?._vbs ?? bindings.vertexBuffers];
		const instanceAttrs = appendInstanceInputs(vertexBuffers, baseLocation, hasColor);
		if (!vertexLayout && mesh._gpu._vbLayout) for (let index = 0; index < material.attributes.length; index++) {
			const packing = mesh._gpu._vbLayout[material.attributes[index]];
			if (packing) {
				const canonical = vertexBuffers[index];
				vertexBuffers[index] = {
					...canonical,
					arrayStride: packing._stride,
					attributes: [{
						...canonical.attributes[0],
						offset: packing._offset
					}]
				};
			}
		}
		const wm = mesh.worldMatrix;
		const sortCenter = [
			wm[12],
			wm[13],
			wm[14]
		];
		let drawArgs = null;
		const isInactive = () => !!packet._disposed || !isOverride && mesh.material !== material;
		const update = (context, uniformBatch) => {
			if (isInactive()) return;
			updateCustomUbo(scene.surface.engine, material, uniformBatch);
			updatePacket(scene, material, packet, context, uniformBatch);
			drawArgs = syncThinInstanceForDraw(scene.surface.engine, ti, hasColor, mesh._gpu);
			if (isTransparent) {
				const m = mesh.worldMatrix;
				sortCenter[0] = m[12];
				sortCenter[1] = m[13];
				sortCenter[2] = m[14];
			}
		};
		const draw = (pass, engine, cullBinding) => {
			if (isInactive()) return 0;
			const gpu = mesh._gpu;
			let slot = 0;
			for (let i = 0; i < material.attributes.length; i++) pass.setVertexBuffer(slot++, getAttrBuffer(engine, mesh, material.attributes[i], material));
			syncThinInstanceBuffers(engine, ti, pass, slot, hasColor, cullBinding?.cullDrawBufs);
			pass.setIndexBuffer(gpu.indexBuffer, gpu.indexFormat);
			pass.setBindGroup(1, packet._bindGroup);
			if (cullBinding) cullBinding.draw(pass, gpu, ti.count);
			else if (drawArgs) pass.drawIndexedIndirect(drawArgs, 0);
			else pass.drawIndexed(gpu.indexCount, ti.count, gpu._firstIndex ?? 0, gpu._baseVertex);
			return 1;
		};
		const r = {
			order: mesh.renderOrder ?? (isTransparent ? 200 : 100),
			isTransparent,
			_direct: !!material._externalTextureSlots?.size,
			mesh,
			_worldCenter: sortCenter,
			bind(eng, sig) {
				const pipeline = getOrCreateShaderPipeline(eng, sig, material, getOrCreateShaderPipelineBindings(eng, material), variantKey, vertexBuffers, instanceAttrs);
				const uniformBatch = getUniformBatch?.(sig);
				const baseUpdate = (context) => update(context, uniformBatch);
				const cb = cull?.tryBind(r, scene, mesh, eng, hasColor, isTransparent, baseUpdate, sig);
				return {
					renderable: r,
					pipeline,
					_updateBatches: uniformBatch ? cb ? [uniformBatch, cb._updateBatch] : [uniformBatch] : cb ? [cb._updateBatch] : void 0,
					update: cb ? cb.update : baseUpdate,
					draw: (pass) => draw(pass, eng, cb)
				};
			}
		};
		registerPipeline?.(isOverride ? r : mesh, material, hasColor, vertexLayout ?? (mesh._gpu._vbLayout ? {
			_key: mesh._gpu._vbKey ?? "",
			_vbs: vertexBuffers.slice(0, baseLocation)
		} : void 0));
		return r;
	}
	/** Build one instanced renderable for `mesh` (used by the combined `rebuildSingle`). */
	function buildInstancedSingle(scene, mesh, material, isOverride, cull, resources) {
		const bindings = getOrCreateShaderPipelineBindings(scene.surface.engine, material);
		const vertexLayout = getVertexLayout?.(material, bindings, mesh) ?? void 0;
		return createShaderInstancedRenderable(scene, material, createPacket(scene, material, bindings.systemSpec, mesh, resources), bindings, isOverride, cull, vertexLayout);
	}
	const instanced = [];
	const plain = [];
	for (const mesh of meshes) if (mesh.thinInstances) instanced.push(mesh);
	else plain.push(mesh);
	const renderables = [];
	let plainRebuild;
	if (plain.length) {
		const plainResult = buildPlain(scene, plain);
		renderables.push(...plainResult.renderables);
		plainRebuild = plainResult.rebuildSingle;
	}
	for (const mesh of instanced) renderables.push(buildInstancedSingle(scene, mesh, mesh.material, false, cull));
	const rebuildSingle = (s, mesh, materialOverride, resources) => {
		const material = materialOverride ?? mesh.material;
		if (mesh.thinInstances) return buildInstancedSingle(s, mesh, material, !!materialOverride, cull, resources);
		if (plainRebuild) return plainRebuild(s, mesh, materialOverride, resources);
		return buildPlain(s, []).rebuildSingle(s, mesh, materialOverride, resources);
	};
	return {
		renderables,
		rebuildSingle
	};
}
export { buildShaderRenderablesWithInstancing };

//# sourceMappingURL=shader-thin-instance.js.map