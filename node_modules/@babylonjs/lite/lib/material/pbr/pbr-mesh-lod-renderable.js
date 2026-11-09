import { getCameraPosition, getViewProjectionMatrix } from "../../camera/camera.js";
import { BU } from "../../engine/gpu-flags.js";
import "../../engine/render-target.js";
import { acquireGPUTexture } from "../../resource/gpu-texture-acquire.js";
import { releaseTextureAllocation } from "../../resource/texture-allocation-release.js";
import { createEmptyUniformBuffer } from "../../resource/empty-uniform-buffer.js";
import { targetSignatureKey } from "../../engine/render-target-signature.js";
import { retireGpuResources } from "../../engine/gpu-resource-retirement.js";
import { getSceneBindGroupLayout } from "../../render/scene-helpers.js";
import { StandardToneMapping } from "./tone-mapping.js";
import { invalidateRenderBundles } from "../../mesh/mesh-factories.js";
import { createSolidTexture2D } from "../../texture/solid-texture.js";
import { createMeshLoDError } from "../../mesh-lod/mesh-lod-errors.js";
import { composeMeshLoDWgsl, meshLoDShaderKey } from "./pbr-mesh-lod-compose.js";
import { meshLoDClusterDebugAttr, meshLoDConeDebugAttr, meshLoDDebugModeCode, meshLoDPageRequestCode, meshLoDPageResidencyCode } from "./pbr-mesh-lod-debug.js";
import { validateMeshLoDMaterial } from "./pbr-mesh-lod-material.js";
import { _ as queueMeshLoDFrame, a as selectMeshLoDBatch, n as driveMeshLoDStreaming, o as validateMeshLoDEngine, r as getMeshLoDSelectionCamera } from "../../_chunks/mesh-lod-scene-BSlMu8U3.js";
import { meshLoDConeCullMargin } from "../../mesh-lod/mesh-lod-selection-math.js";
import { C as createMeshLoDGpuBatchState, D as disposeMeshLoDGpuBatchState, H as queueMeshLoDGpuSelection, I as meshLoDTriangleIndex, M as getMeshLoDUpdateBatch, O as disposeMeshLoDGpuInstanceState, V as packInstanceRecord, w as createMeshLoDGpuInstanceState } from "../../_chunks/mesh-lod-selection-gpu-gfLqNUNL.js";
import { _rightHanded } from "#coordinate-system";
// src/material/pbr/pbr-mesh-lod-renderable.ts
/** PBR-owned MeshLoD renderable — coarse CPU-selected indirect rendering.
*
*  Owns every MeshLoD rendering decision for the guaranteed opaque metallic-roughness
*  subset: material validation + feature detection, the storage-fetch vertex + PBR/
*  unlit fragment pipeline (WGSL in `pbr-mesh-lod-compose.ts`), the fixed v1 group-1
*  bind group, fallback textures for absent guaranteed channels, per-frame CPU
*  selection + expansion of pinned clusters into a draw-vertex stream, and one
*  `drawIndirect` per material/hierarchy batch. The generic renderer only ever sees
*  an ordinary opaque `Renderable`; no WGSL, pipeline, or bind-group code leaks out
*  of `material/pbr`. Imported only through the MeshLoD scene path — no module-level
*  side effects, so non-MeshLoD scenes fetch none of it. */
var DRAW_VERTEX_STRIDE = 16;
var INSTANCE_STRIDE = 128;
var VERTEX_WORDS = 6;
var MATERIAL_UBO_BYTES = 80;
var MATERIAL_MISC_Y_BYTE = 68;
var _fallbacks = null;
var _fallbackDevice = null;
function getFallbacks(engine) {
	if (!_fallbacks || _fallbackDevice !== engine._device) {
		_fallbacks = {
			white: createSolidTexture2D(engine, 1, 1, 1, 1),
			normal: createSolidTexture2D(engine, .5, .5, 1, 1),
			black: createSolidTexture2D(engine, 0, 0, 0, 1)
		};
		_fallbackDevice = engine._device;
	}
	return _fallbacks;
}
function detectFeatures(material, hasEnvironment) {
	validateMeshLoDMaterial(material);
	return {
		hasNormalMap: !!material.normalTexture,
		hasEmissiveTexture: !!material.emissiveTexture,
		hasIbl: hasEnvironment && material._unlit !== true,
		hasSpecularAA: material.enableSpecularAA === true && material._unlit !== true,
		doubleSided: material.doubleSided === true,
		unlit: material._unlit === true
	};
}
function packMaterialUbo(material, features, data) {
	const bcf = material.baseColorFactor ?? [
		1,
		1,
		1,
		1
	];
	const unlitColor = features.unlit ? material._unlitColor ?? [
		1,
		1,
		1
	] : [
		1,
		1,
		1
	];
	data[0] = bcf[0] * unlitColor[0];
	data[1] = bcf[1] * unlitColor[1];
	data[2] = bcf[2] * unlitColor[2];
	data[3] = bcf[3];
	const emissive = material._emissiveColor ?? (features.hasEmissiveTexture ? [
		1,
		1,
		1
	] : [
		0,
		0,
		0
	]);
	data[4] = emissive[0];
	data[5] = emissive[1];
	data[6] = emissive[2];
	data[7] = 0;
	data[8] = material.metallicFactor ?? 1;
	data[9] = material.roughnessFactor ?? 1;
	data[10] = material.normalTextureScale ?? 1;
	data[11] = material.occlusionStrength ?? 1;
	data[12] = material.environmentIntensity ?? 1;
	data[13] = material.directIntensity ?? 1;
	data[14] = material.reflectance ?? .04;
	data[15] = material.alpha ?? 1;
	data[16] = material.usePhysicalLightFalloff === false ? 0 : 1;
}
function buildBindGroup(engine, layout, textures, drawVertexBuffer, instanceBuffer, arena, materialUbo, environment) {
	const { base, normal, orm, emissive } = textures;
	const entries = [
		{
			binding: 0,
			resource: { buffer: materialUbo }
		},
		{
			binding: 1,
			resource: base.view
		},
		{
			binding: 2,
			resource: base.sampler
		},
		{
			binding: 3,
			resource: normal.view
		},
		{
			binding: 4,
			resource: normal.sampler
		},
		{
			binding: 5,
			resource: orm.view
		},
		{
			binding: 6,
			resource: orm.sampler
		},
		{
			binding: 7,
			resource: emissive.view
		},
		{
			binding: 8,
			resource: emissive.sampler
		},
		{
			binding: 9,
			resource: { buffer: arena }
		},
		{
			binding: 10,
			resource: { buffer: drawVertexBuffer }
		},
		{
			binding: 11,
			resource: { buffer: instanceBuffer }
		}
	];
	if (environment) entries.push({
		binding: 12,
		resource: environment.brdfLutView
	}, {
		binding: 13,
		resource: environment.brdfSampler
	}, {
		binding: 14,
		resource: environment.specularCubeView
	}, {
		binding: 15,
		resource: environment.cubeSampler
	});
	return engine._device.createBindGroup({
		layout,
		entries
	});
}
function meshLoDBindGroupLayout(engine, hasIbl) {
	const V = 1;
	const F = 2;
	const tex = (binding) => [{
		binding,
		visibility: F,
		texture: { sampleType: "float" }
	}, {
		binding: binding + 1,
		visibility: F,
		sampler: { type: "filtering" }
	}];
	return engine._device.createBindGroupLayout({
		label: "mesh-lod-material",
		entries: [
			{
				binding: 0,
				visibility: 3,
				buffer: { type: "uniform" }
			},
			...tex(1),
			...tex(3),
			...tex(5),
			...tex(7),
			{
				binding: 9,
				visibility: V,
				buffer: { type: "read-only-storage" }
			},
			{
				binding: 10,
				visibility: V,
				buffer: { type: "read-only-storage" }
			},
			{
				binding: 11,
				visibility: V,
				buffer: { type: "read-only-storage" }
			},
			...hasIbl ? [
				...tex(12),
				{
					binding: 14,
					visibility: F,
					texture: {
						sampleType: "float",
						viewDimension: "cube"
					}
				},
				{
					binding: 15,
					visibility: F,
					sampler: { type: "filtering" }
				}
			] : []
		]
	});
}
function getPipeline(engine, packet, sig, scene, material) {
	if (scene.fog && !packet.fog) throw createMeshLoDError("MLOD_INVALID_OPTION", "configure MeshLoD fog before registering the scene");
	const fog = scene.fog ? packet.fog : void 0;
	const hasSpecularAA = material.enableSpecularAA === true && !packet.features.unlit;
	if (packet.features.hasSpecularAA !== hasSpecularAA || packet.features.fog !== fog) packet.features = {
		...packet.features,
		hasSpecularAA,
		fog
	};
	const toneMapping = scene.imageProcessing?.toneMappingEnabled ? scene.imageProcessing.toneMapping ?? StandardToneMapping : void 0;
	const shaderKey = meshLoDShaderKey(packet.features, toneMapping);
	if (packet.shaderKey !== shaderKey) {
		packet.shaderModule = engine._device.createShaderModule({
			label: `mesh-lod-${shaderKey}`,
			code: composeMeshLoDWgsl(packet.features, toneMapping)
		});
		packet.shaderKey = shaderKey;
	}
	const key = `${targetSignatureKey(sig)}:${shaderKey}`;
	const cached = packet.pipelines.get(key);
	if (cached) return cached;
	const device = engine._device;
	const layout = device.createPipelineLayout({ bindGroupLayouts: [getSceneBindGroupLayout(engine), packet.bindGroupLayout] });
	const pipeline = device.createRenderPipeline({
		label: "mesh-lod",
		layout,
		vertex: {
			module: packet.shaderModule,
			entryPoint: "vs",
			buffers: []
		},
		fragment: sig._colorFormat ? {
			module: packet.shaderModule,
			entryPoint: "fs",
			targets: [{ format: sig._colorFormat }]
		} : void 0,
		depthStencil: sig._depthStencilFormat ? {
			format: sig._depthStencilFormat,
			depthCompare: sig._depthCompare ?? "greater-equal",
			depthWriteEnabled: true
		} : void 0,
		multisample: { count: sig._sampleCount },
		primitive: {
			topology: "triangle-list",
			cullMode: packet.features.doubleSided ? "none" : "back",
			frontFace: _rightHanded ? "cw" : "ccw"
		}
	});
	packet.pipelines.set(key, pipeline);
	return pipeline;
}
function cpuStorageCapacity(engine, current, required, stride, label) {
	const limits = engine._device.limits;
	const maximum = Math.floor(Math.min(limits.maxStorageBufferBindingSize, limits.maxBufferSize) / stride);
	if (required > maximum) throw createMeshLoDError("MLOD_DEVICE_LIMIT", `MeshLoD ${label} exceeds the device storage-buffer limit`, {
		expected: maximum * stride,
		actual: required * stride
	});
	let capacity = Math.max(current, 1);
	while (capacity < required) capacity = Math.min(capacity * 2, maximum);
	return capacity;
}
/** Grow the CPU draw-vertex buffer + scratch (make-before-break) so the streamed
*  refinement's expanded vertices fit. Rebuilds the group-1 bind group against the new
*  buffer and retires the old one after the next submitted frame drains. No-op while the
*  selection fits the current capacity (the coarse-only case never grows). */
function ensureCpuDrawCapacity(engine, batch, packet, capacity) {
	if (capacity <= packet.maxDrawVertices) return;
	const runtime = batch.asset._runtime;
	const oldBuffer = packet.drawVertexBuffer;
	const drawScratch = new Uint32Array(capacity * 4);
	const drawVertexBuffer = engine._device.createBuffer({
		label: "mesh-lod-draw-vertices",
		size: capacity * DRAW_VERTEX_STRIDE,
		usage: BU.STORAGE | BU.COPY_DST
	});
	const bindGroup = buildBindGroup(engine, packet.bindGroupLayout, packet.textures, drawVertexBuffer, packet.instanceBuffer, runtime.gpu.arena.buffer, packet.materialUbo, packet.environment);
	packet.drawVertexBuffer = drawVertexBuffer;
	packet.drawScratch = drawScratch;
	packet.maxDrawVertices = capacity;
	packet.bindGroup = bindGroup;
	retireGpuResources(engine, () => oldBuffer.destroy());
}
/** Grow CPU instance storage without invalidating the in-flight render bundle. */
function ensureCpuInstanceCapacity(engine, batch, packet, capacity) {
	if (capacity <= packet.maxInstances) return;
	const oldBuffer = packet.instanceBuffer;
	const instanceScratch = new Float32Array(capacity * (INSTANCE_STRIDE / 4));
	const instanceBuffer = engine._device.createBuffer({
		label: "mesh-lod-instances",
		size: capacity * INSTANCE_STRIDE,
		usage: BU.STORAGE | BU.COPY_DST
	});
	const bindGroup = buildBindGroup(engine, packet.bindGroupLayout, packet.textures, packet.drawVertexBuffer, instanceBuffer, batch.asset._runtime.gpu.arena.buffer, packet.materialUbo, packet.environment);
	packet.instanceBuffer = instanceBuffer;
	packet.instanceScratch = instanceScratch;
	packet.maxInstances = capacity;
	packet.bindGroup = bindGroup;
	retireGpuResources(engine, () => oldBuffer.destroy());
}
/** The opaque render bundle bakes both resources, so a mode switch or buffer
*  replacement must re-record it before the next draw. */
function setActiveDraw(engine, packet, bindGroup, indirectBuffer) {
	if (packet.activeBindGroup !== bindGroup || packet.activeIndirectBuffer !== indirectBuffer) {
		packet.activeBindGroup = bindGroup;
		packet.activeIndirectBuffer = indirectBuffer;
		invalidateRenderBundles(engine);
	}
}
function syncMaterialUbo(engine, packet, material, mode) {
	const state = packet.materialState;
	if (state.version !== material._uboVersion) {
		validateMeshLoDMaterial(material);
		packMaterialUbo(material, packet.features, state.scratch);
		state.scratch[17] = mode;
		engine._device.queue.writeBuffer(packet.materialUbo, 0, state.scratch);
		state.version = material._uboVersion;
		state.debugMode = mode;
	} else if (state.debugMode !== mode) {
		state.scratch[17] = mode;
		engine._device.queue.writeBuffer(packet.materialUbo, MATERIAL_MISC_Y_BYTE, state.scratch.buffer, MATERIAL_MISC_Y_BYTE, 4);
		state.debugMode = mode;
	}
}
/** Per-frame CPU selection + expansion (reference/diagnostic mode): run the oracle for
*  each visible instance, write its world/normal matrices, and flatten selected pinned
*  clusters into the draw-vertex stream, then publish the single indirect vertex count. */
function updatePacketCpu(engine, batch, packet, context) {
	const runtime = batch.asset._runtime;
	const debugMode = meshLoDDebugModeCode(runtime.debugView);
	const selections = selectMeshLoDBatch(batch, context, packet.cpuHistory);
	driveMeshLoDStreaming(batch, selections, packet);
	let neededVertices = 0;
	for (const selection of selections) for (const clusterId of selection.result.selectedClusterIds) neededVertices += runtime.clusters[clusterId].triangleCount * 3;
	const drawCapacity = cpuStorageCapacity(engine, packet.maxDrawVertices, neededVertices, DRAW_VERTEX_STRIDE, "draw vertices");
	ensureCpuInstanceCapacity(engine, batch, packet, cpuStorageCapacity(engine, packet.maxInstances, selections.length, INSTANCE_STRIDE, "instances"));
	ensureCpuDrawCapacity(engine, batch, packet, drawCapacity);
	const draw = packet.drawScratch;
	const inst = packet.instanceScratch;
	let vertexCount = 0;
	let instanceIndex = 0;
	let selectedMeshlets = 0;
	for (const selection of selections) {
		const localInstance = instanceIndex;
		packInstanceRecord(inst, new Uint32Array(inst.buffer), localInstance * (INSTANCE_STRIDE / 4), selection.instance.worldMatrix, selection.instance.visible, selection.instance._instanceId, selection.instance.screenSpaceError);
		instanceIndex++;
		const handedness = inst[localInstance * 32 + 23];
		for (const clusterId of selection.result.selectedClusterIds) {
			const cluster = runtime.clusters[clusterId];
			const page = runtime.gpu.pages[cluster.pageId];
			if (!page || page.state !== "gpu-resident" || !page.indices || page.arenaOffset < 0) continue;
			let debugAttr = 0;
			if (debugMode === 6) {
				const camera = context._camera;
				const position = camera ? getCameraPosition(camera) : null;
				const margin = position && batch.material.doubleSided !== true ? meshLoDConeCullMargin(selection.instance.worldMatrix, [
					position.x,
					position.y,
					position.z
				], cluster.center, cluster.radius, cluster.normalCone) : Number.POSITIVE_INFINITY;
				debugAttr = meshLoDConeDebugAttr(margin);
			} else if (debugMode !== 0) {
				const record = runtime.pageRecords[cluster.pageId];
				const depth = runtime.groups[cluster.groupId]?.depth ?? 0;
				const residency = meshLoDPageResidencyCode(record.pinned, page.state);
				const request = meshLoDPageRequestCode(record.pinned, page.state);
				debugAttr = meshLoDClusterDebugAttr(debugMode, cluster.groupId, depth, residency, request);
			}
			const arenaWordBase = (page.arenaOffset + page.vertexByteOffset) / 4;
			const indices = page.indices;
			const start = cluster.indexOffset;
			const count = cluster.triangleCount * 3;
			selectedMeshlets++;
			for (let k = 0; k < count; k++) {
				const localVertex = indices[start + meshLoDTriangleIndex(k, handedness)];
				const o = vertexCount * 4;
				draw[o] = arenaWordBase + localVertex * VERTEX_WORDS;
				draw[o + 1] = clusterId;
				draw[o + 2] = localInstance;
				draw[o + 3] = debugAttr;
				vertexCount++;
			}
		}
	}
	if (instanceIndex > 0) engine._device.queue.writeBuffer(packet.instanceBuffer, 0, inst.buffer, inst.byteOffset, instanceIndex * INSTANCE_STRIDE);
	if (vertexCount > 0) engine._device.queue.writeBuffer(packet.drawVertexBuffer, 0, draw.buffer, draw.byteOffset, vertexCount * DRAW_VERTEX_STRIDE);
	packet.indirectScratch[0] = vertexCount;
	packet.indirectScratch[1] = 1;
	packet.indirectScratch[2] = 0;
	packet.indirectScratch[3] = 0;
	engine._device.queue.writeBuffer(packet.indirectBuffer, 0, packet.indirectScratch.buffer, packet.indirectScratch.byteOffset, 16);
	packet.lastVertexCount = vertexCount;
	setActiveDraw(engine, packet, vertexCount > 0 ? packet.bindGroup : null, vertexCount > 0 ? packet.indirectBuffer : null);
	const diag = runtime.diagnostics;
	diag.renderedTriangleCount = vertexCount / 3;
	diag.selectedMeshletCount = selectedMeshlets;
}
function buildGpuFrame(batch, camera, context) {
	const runtime = batch.asset._runtime;
	const selectionCamera = getMeshLoDSelectionCamera(camera, context);
	const v = camera.viewport;
	const aspect = context.targetWidth / context.targetHeight * (v ? v.width / v.height : 1);
	return {
		cameraPos: selectionCamera.position,
		verticalFov: selectionCamera.verticalFov,
		perspectivePixelScale: selectionCamera.perspectivePixelScale,
		near: selectionCamera.near,
		targetWidth: selectionCamera.targetWidth,
		targetHeight: selectionCamera.targetHeight,
		orthographicHeight: selectionCamera.orthographicHeight,
		viewProjection: getViewProjectionMatrix(camera, aspect),
		frustumCull: true,
		coneCull: batch.material.doubleSided !== true,
		screenSpaceError: runtime.settings.screenSpaceError,
		lodHysteresis: runtime.settings.lodHysteresis,
		levelCount: runtime.header.levelCount,
		debugMode: meshLoDDebugModeCode(runtime.debugView)
	};
}
/** Per-frame GPU selection + expansion (production mode): queue the compute work into
*  the shared MeshLoD update batch (flushed before the render pass) and resolve the
*  binding + indirect buffer the GPU-filled draw stream consumes. */
function updatePacketGpu(engine, batch, packet, context, updateBatch) {
	const camera = context._camera;
	if (!camera || batch.instances.length === 0) {
		if (packet.gpuBatchState) queueMeshLoDFrame(batch.asset._runtime, packet.gpuBatchState, "gpu", [], {
			visibleGroupCount: 0,
			fallbackGroupCount: 0,
			maximumSelectedErrorPixels: 0,
			maximumUnmetErrorPixels: 0
		});
		setActiveDraw(engine, packet, null, null);
		return;
	}
	const runtime = batch.asset._runtime;
	packet.gpuInstanceState ??= createMeshLoDGpuInstanceState(runtime.groups.length);
	packet.gpuBatchState ??= createMeshLoDGpuBatchState();
	const handles = queueMeshLoDGpuSelection(engine, updateBatch, runtime, packet.gpuInstanceState, packet.gpuBatchState, batch.instances, buildGpuFrame(batch, camera, context));
	if (!handles) {
		setActiveDraw(engine, packet, null, null);
		return;
	}
	if (!packet.gpuBindGroup || packet.gpuBoundDrawVertices !== handles.drawVertexBuffer || packet.gpuBoundInstances !== handles.instanceBuffer) {
		packet.gpuBindGroup = buildBindGroup(engine, packet.bindGroupLayout, packet.textures, handles.drawVertexBuffer, handles.instanceBuffer, packet.arena, packet.materialUbo, packet.environment);
		packet.gpuBoundDrawVertices = handles.drawVertexBuffer;
		packet.gpuBoundInstances = handles.instanceBuffer;
	}
	setActiveDraw(engine, packet, packet.gpuBindGroup, handles.drawArgsBuffer);
}
/** Dispatch the per-frame update to the CPU reference or GPU production path. A disposed
*  asset is non-drawable immediately; the cached render bundle must not replay retired
*  arena/draw buffers (§14.2). */
function updatePacket(engine, batch, packet, context, updateBatch) {
	validateMeshLoDEngine(engine);
	const runtime = batch.asset._runtime;
	if (runtime.disposed) {
		setActiveDraw(engine, packet, null, null);
		if (!packet.disposedHandled) {
			packet.disposedHandled = true;
			invalidateRenderBundles(engine);
		}
		return;
	}
	syncMaterialUbo(engine, packet, batch.material, meshLoDDebugModeCode(runtime.debugView));
	if (runtime.selectionMode === "gpu") updatePacketGpu(engine, batch, packet, context, updateBatch);
	else updatePacketCpu(engine, batch, packet, context);
}
/** Build the single indirect-draw `Renderable` for one MeshLoD batch, or `null`
*  when the batch has no instances. */
async function buildMeshLoDBatchRenderable(engine, _scene, batch) {
	validateMeshLoDEngine(engine);
	if (batch.instances.length === 0) return null;
	const runtime = batch.asset._runtime;
	const fog = _scene.fog ? await import("./pbr-fog-wgsl.js") : void 0;
	if (runtime.disposed) return null;
	const environment = batch.material._unlit === true ? null : _scene._envTextures ?? null;
	const features = detectFeatures(batch.material, environment !== null);
	const textureLeases = [
		batch.material.baseColorTexture,
		batch.material.normalTexture,
		batch.material.ormTexture,
		batch.material.emissiveTexture
	].filter((texture) => texture !== void 0).map((texture) => ({
		texture,
		allocation: texture.texture
	}));
	const maxInstances = Math.max(batch.instances.length, 1);
	let maxDrawVertices = 3;
	if (runtime.selectionMode === "cpu") {
		let coarseVertices = 0;
		for (const cluster of runtime.clusters) if (runtime.pageRecords[cluster.pageId]?.pinned) coarseVertices += cluster.triangleCount * 3;
		maxDrawVertices = Math.max(coarseVertices * maxInstances, 3);
	}
	cpuStorageCapacity(engine, maxDrawVertices, maxDrawVertices, DRAW_VERTEX_STRIDE, "draw vertices");
	cpuStorageCapacity(engine, maxInstances, maxInstances, INSTANCE_STRIDE, "instances");
	const shaderFeatures = {
		...features,
		fog
	};
	const device = engine._device;
	const fb = getFallbacks(engine);
	const textures = {
		base: batch.material.baseColorTexture ?? fb.white,
		normal: batch.material.normalTexture ?? fb.normal,
		orm: batch.material.ormTexture ?? fb.white,
		emissive: batch.material.emissiveTexture ?? fb.black
	};
	const allocated = [];
	try {
		const materialUbo = createEmptyUniformBuffer(engine, MATERIAL_UBO_BYTES, "mesh-lod-material");
		allocated.push(materialUbo);
		const materialState = {
			scratch: new Float32Array(MATERIAL_UBO_BYTES / 4),
			version: batch.material._uboVersion,
			debugMode: 0
		};
		packMaterialUbo(batch.material, features, materialState.scratch);
		device.queue.writeBuffer(materialUbo, 0, materialState.scratch);
		const drawVertexBuffer = device.createBuffer({
			label: "mesh-lod-draw-vertices",
			size: maxDrawVertices * DRAW_VERTEX_STRIDE,
			usage: BU.STORAGE | BU.COPY_DST
		});
		allocated.push(drawVertexBuffer);
		const instanceBuffer = device.createBuffer({
			label: "mesh-lod-instances",
			size: maxInstances * INSTANCE_STRIDE,
			usage: BU.STORAGE | BU.COPY_DST
		});
		allocated.push(instanceBuffer);
		const indirectBuffer = device.createBuffer({
			label: "mesh-lod-indirect",
			size: 16,
			usage: BU.INDIRECT | BU.COPY_DST
		});
		allocated.push(indirectBuffer);
		const bindGroupLayout = meshLoDBindGroupLayout(engine, features.hasIbl);
		const toneMapping = _scene.imageProcessing?.toneMappingEnabled ? _scene.imageProcessing.toneMapping ?? StandardToneMapping : void 0;
		const shaderKey = meshLoDShaderKey(shaderFeatures, toneMapping);
		const packet = {
			features: shaderFeatures,
			fog,
			textures,
			environment,
			shaderModule: device.createShaderModule({
				label: `mesh-lod-${shaderKey}`,
				code: composeMeshLoDWgsl(shaderFeatures, toneMapping)
			}),
			shaderKey,
			bindGroupLayout,
			bindGroup: buildBindGroup(engine, bindGroupLayout, textures, drawVertexBuffer, instanceBuffer, runtime.gpu.arena.buffer, materialUbo, environment),
			pipelines: /* @__PURE__ */ new Map(),
			drawVertexBuffer,
			instanceBuffer,
			indirectBuffer,
			materialUbo,
			materialState,
			arena: runtime.gpu.arena.buffer,
			drawScratch: new Uint32Array(maxDrawVertices * 4),
			instanceScratch: new Float32Array(maxInstances * (INSTANCE_STRIDE / 4)),
			indirectScratch: /* @__PURE__ */ new Uint32Array(4),
			maxDrawVertices,
			maxInstances,
			lastVertexCount: 0,
			disposed: false,
			disposedHandled: false,
			cpuHistory: /* @__PURE__ */ new Map(),
			gpuInstanceState: null,
			gpuBatchState: null,
			gpuBindGroup: null,
			gpuBoundDrawVertices: null,
			gpuBoundInstances: null,
			activeBindGroup: null,
			activeIndirectBuffer: null,
			dispose: () => {
				if (sceneDisposed) return;
				sceneDisposed = true;
				for (const release of bindingPackets.values()) release();
				disposeDrawPacket(batch, packet);
				retireGpuResources(engine, () => {
					materialUbo.destroy();
					for (const { texture, allocation } of textureLeases) releaseTextureAllocation(allocation, texture.texture === allocation ? texture : void 0);
				});
			}
		};
		const bindingPackets = /* @__PURE__ */ new Map();
		const packetByTarget = /* @__PURE__ */ new WeakMap();
		let sceneDisposed = false;
		let firstBinding = true;
		for (const { allocation } of textureLeases) acquireGPUTexture(allocation);
		batch._packet = packet;
		const renderable = {
			order: 100,
			isTransparent: false,
			bind(eng, sig) {
				if (sceneDisposed) throw createMeshLoDError("MLOD_DISPOSED", "MeshLoD renderable has been disposed");
				validateMeshLoDEngine(eng);
				const updateBatch = getMeshLoDUpdateBatch(sig);
				const cached = packetByTarget.get(sig);
				let drawPacket = cached?.updateBatch === updateBatch ? cached.packet : void 0;
				if (!drawPacket) {
					drawPacket = firstBinding ? packet : createBindingPacket(eng, batch, packet);
					firstBinding = false;
					const ownedPacket = drawPacket;
					packetByTarget.set(sig, {
						packet: ownedPacket,
						updateBatch
					});
					const release = () => {
						unregister();
						bindingPackets.delete(ownedPacket);
						if (packetByTarget.get(sig)?.packet === ownedPacket) packetByTarget.delete(sig);
						disposeDrawPacket(batch, ownedPacket);
					};
					const unregister = updateBatch.addDisposer(release);
					bindingPackets.set(ownedPacket, release);
				}
				const passPacket = drawPacket;
				let pipeline = getPipeline(eng, passPacket, sig, _scene, batch.material);
				return {
					renderable,
					get pipeline() {
						return pipeline;
					},
					update: (context) => {
						if (passPacket.disposed || updateBatch._retired) return;
						const nextPipeline = getPipeline(eng, passPacket, sig, _scene, batch.material);
						if (pipeline !== nextPipeline) {
							pipeline = nextPipeline;
							invalidateRenderBundles(eng);
						}
						updatePacket(eng, batch, passPacket, context, updateBatch);
					},
					draw: (pass) => {
						if (passPacket.disposed || batch.asset._runtime.disposed || !passPacket.activeBindGroup || !passPacket.activeIndirectBuffer) return 0;
						pass.setBindGroup(1, passPacket.activeBindGroup);
						pass.drawIndirect(passPacket.activeIndirectBuffer, 0);
						return 1;
					},
					_updateBatches: [updateBatch]
				};
			}
		};
		return renderable;
	} catch (error) {
		for (const buffer of allocated) buffer.destroy();
		throw error;
	}
}
function createBindingPacket(engine, batch, shared) {
	const device = engine._device;
	const drawVertexBuffer = device.createBuffer({
		label: "mesh-lod-draw-vertices",
		size: shared.maxDrawVertices * DRAW_VERTEX_STRIDE,
		usage: BU.STORAGE | BU.COPY_DST
	});
	const instanceBuffer = device.createBuffer({
		label: "mesh-lod-instances",
		size: shared.maxInstances * INSTANCE_STRIDE,
		usage: BU.STORAGE | BU.COPY_DST
	});
	const indirectBuffer = device.createBuffer({
		label: "mesh-lod-indirect",
		size: 16,
		usage: BU.INDIRECT | BU.COPY_DST
	});
	const packet = {
		...shared,
		drawVertexBuffer,
		instanceBuffer,
		indirectBuffer,
		bindGroup: buildBindGroup(engine, shared.bindGroupLayout, shared.textures, drawVertexBuffer, instanceBuffer, shared.arena, shared.materialUbo, shared.environment),
		drawScratch: new Uint32Array(shared.maxDrawVertices * 4),
		instanceScratch: new Float32Array(shared.maxInstances * 32),
		indirectScratch: /* @__PURE__ */ new Uint32Array(4),
		cpuHistory: /* @__PURE__ */ new Map(),
		disposed: false,
		gpuInstanceState: null,
		gpuBatchState: null,
		gpuBindGroup: null,
		gpuBoundDrawVertices: null,
		gpuBoundInstances: null,
		activeBindGroup: null,
		activeIndirectBuffer: null,
		dispose: () => disposeDrawPacket(batch, packet)
	};
	return packet;
}
function disposeDrawPacket(batch, packet) {
	if (packet.disposed) return;
	packet.disposed = true;
	packet.cpuHistory.clear();
	batch.asset._runtime._frameSnapshots.delete(packet);
	if (packet.gpuBatchState) {
		batch.asset._runtime._frameSnapshots.delete(packet.gpuBatchState);
		disposeMeshLoDGpuBatchState(packet.gpuBatchState);
		packet.gpuBatchState = null;
	}
	if (packet.gpuInstanceState) {
		disposeMeshLoDGpuInstanceState(packet.gpuInstanceState);
		packet.gpuInstanceState = null;
	}
	packet.drawVertexBuffer.destroy();
	packet.instanceBuffer.destroy();
	packet.indirectBuffer.destroy();
	packet.drawScratch = /* @__PURE__ */ new Uint32Array(0);
	packet.instanceScratch = /* @__PURE__ */ new Float32Array(0);
	packet.activeBindGroup = null;
	packet.activeIndirectBuffer = null;
}
export { buildMeshLoDBatchRenderable };

//# sourceMappingURL=pbr-mesh-lod-renderable.js.map