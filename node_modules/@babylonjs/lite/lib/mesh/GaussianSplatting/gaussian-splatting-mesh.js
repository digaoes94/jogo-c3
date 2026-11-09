import { F32, U16, U32 } from "../../engine/typed-arrays.js";
import { attachWorldMatrixState, composeTrsLocalMatrix, createWorldMatrixState } from "../../scene/world-matrix-state.js";
import { ObservableVec3 } from "../../math/observable-vec3.js";
import { BU, TU } from "../../engine/gpu-flags.js";
import { ObservableQuat } from "../../math/observable-quat.js";
import { eulerXYZToQuatTuple } from "../../math/quat-euler.js";
import { createEulerProxy } from "../../scene/scene-node.js";
import { buildSplatGeometry } from "../../loader-splat/splat-data.js";
// src/mesh/GaussianSplatting/gaussian-splatting-mesh.ts
/** GaussianSplattingMesh — pure data describing a renderable Gaussian splat cloud.
*
*  Plain state with TRS + parent + children (`SceneNode`-shaped, no methods),
*  plus splat-specific GPU resources and a worker handle for back-to-front sort.
*  All behaviour lives in standalone functions in this file or in
*  `gaussian-splatting-pipeline.ts`.
*
*  Renderable + dispose hook registration is performed by `loadSplat()` via
*  `attachGaussianSplattingMesh()` — scene-core stays GS-agnostic so non-GS
*  scenes never pull in this pipeline. */
/** Create a GaussianSplattingMesh from a parsed splat asset. Uploads textures +
*  initial identity splat-index buffer, spawns the sort worker, and (when the
*  asset includes SH coefficients) packs SH into rgba32uint textures.
*
*  `parsed.data` is retained on the mesh as `splatsData` so callers can mutate
*  the row data and round-trip it via `mesh.updateData(buffer)` — matches
*  `keepInRam:true` semantics on BJS `GaussianSplattingMesh`. */
function createGaussianSplattingMesh(engine, name, geom, worker, parsed) {
	const device = engine._device;
	const queue = device.queue;
	const { textureWidth, textureHeight, vertexCount } = geom;
	const makeRgba32f = (data) => {
		const tex = device.createTexture({
			size: [textureWidth, textureHeight],
			format: "rgba32float",
			usage: TU.TEXTURE_BINDING | TU.COPY_DST
		});
		queue.writeTexture({ texture: tex }, data.buffer, { bytesPerRow: textureWidth * 16 }, {
			width: textureWidth,
			height: textureHeight
		});
		return {
			tex,
			view: tex.createView()
		};
	};
	const centers = makeRgba32f(geom.centersRGBA);
	const covA = makeRgba32f(geom.covARGBA);
	const covB = makeRgba32f(geom.covBRGBA);
	const colors = makeRgba32f(geom.colorsRGBA);
	const sampler = device.createSampler({
		magFilter: "nearest",
		minFilter: "nearest",
		addressModeU: "clamp-to-edge",
		addressModeV: "clamp-to-edge"
	});
	const quadBuffer = device.createBuffer({
		size: 32,
		usage: BU.VERTEX,
		mappedAtCreation: true
	});
	new F32(quadBuffer.getMappedRange()).set([
		-2,
		-2,
		2,
		-2,
		2,
		2,
		-2,
		2
	]);
	quadBuffer.unmap();
	const indexBuffer = device.createBuffer({
		size: 12,
		usage: BU.INDEX,
		mappedAtCreation: true
	});
	new U16(indexBuffer.getMappedRange()).set([
		0,
		1,
		2,
		0,
		2,
		3
	]);
	indexBuffer.unmap();
	const splatIndexCpu = new F32(vertexCount);
	for (let i = 0; i < vertexCount; i++) splatIndexCpu[i] = i;
	const splatIndexBuffer = device.createBuffer({
		size: splatIndexCpu.byteLength,
		usage: BU.VERTEX | BU.COPY_DST
	});
	queue.writeBuffer(splatIndexBuffer, 0, splatIndexCpu.buffer, 0, splatIndexCpu.byteLength);
	let firstResolve = null;
	const firstSortReady = new Promise((res) => {
		firstResolve = res;
	});
	let retainedSplatsData = parsed.data;
	const mesh = {
		_kind: "gs-mesh",
		name,
		vertexCount,
		textureWidth,
		textureHeight,
		boundMin: geom.boundMin.slice(),
		boundMax: geom.boundMax.slice(),
		shDegree: parsed.shDegree ?? 0,
		_worker: worker,
		_orderPool: [new U32(vertexCount), new U32(vertexCount)],
		_pendingOrder: null,
		_sortDepthTransform: new F32(4),
		_nextSortDepthTransform: new F32(4),
		firstSortReady,
		_firstSortResolve: firstResolve,
		_gs: {
			_centersTex: centers.tex,
			_centersView: centers.view,
			_covATex: covA.tex,
			_covAView: covA.view,
			_covBTex: covB.tex,
			_covBView: covB.view,
			_colorsTex: colors.tex,
			_colorsView: colors.view,
			_sampler: sampler,
			_quadBuffer: quadBuffer,
			_indexBuffer: indexBuffer,
			_splatIndexBuffer: splatIndexBuffer,
			_splatIndexCpu: splatIndexCpu,
			_shTextures: null,
			_shViews: null
		}
	};
	Object.defineProperty(mesh, "splatsData", { get: () => retainedSplatsData });
	mesh.updateData = (newBuffer) => {
		const newGeom = buildSplatGeometry(newBuffer);
		if (newGeom.vertexCount !== mesh.vertexCount) throw Error("GS vertex count mismatch");
		const gs = mesh._gs;
		const writeTex = (tex, data) => {
			queue.writeTexture({ texture: tex }, data.buffer, { bytesPerRow: newGeom.textureWidth * 16 }, {
				width: newGeom.textureWidth,
				height: newGeom.textureHeight
			});
		};
		writeTex(gs._centersTex, newGeom.centersRGBA);
		writeTex(gs._covATex, newGeom.covARGBA);
		writeTex(gs._covBTex, newGeom.covBRGBA);
		writeTex(gs._colorsTex, newGeom.colorsRGBA);
		mesh.boundMin = newGeom.boundMin.slice();
		mesh.boundMax = newGeom.boundMax.slice();
		mesh._worker.postMessage({ p: newGeom.positions }, [newGeom.positions.buffer]);
		mesh._sortDepthTransform.fill(0);
		retainedSplatsData = newBuffer;
	};
	initSplatTransform(mesh);
	worker.postMessage({ p: geom.positions }, [geom.positions.buffer]);
	worker.onmessage = (e) => {
		const data = e.data;
		if (mesh._pendingOrder) mesh._orderPool.push(mesh._pendingOrder);
		mesh._pendingOrder = data.o;
		if (mesh._firstSortResolve) {
			mesh._firstSortResolve();
			mesh._firstSortResolve = null;
		}
	};
	return mesh;
}
/** Per-element threshold on the world matrix / camera forward / camera
*  position drift below which a re-sort is skipped. Mirrors BJS
*  `viewUpdateThreshold` default (`_DefaultViewUpdateThreshold = 1e-4`). */
var SORT_EPS = 1e-4;
/** Upload the latest sorted splat order (if one arrived since the last frame)
*  into the instance buffer, then recycle its transferable back into the pool.
*  Called once per frame from the renderable's `update` hook — results the
*  worker produced faster than the frame rate never cost an upload. */
function uploadPendingSplatOrder(queue, mesh) {
	const order = mesh._pendingOrder;
	if (!order) return;
	mesh._pendingOrder = null;
	const cpu = mesh._gs._splatIndexCpu;
	cpu.set(order);
	queue.writeBuffer(mesh._gs._splatIndexBuffer, 0, cpu.buffer, 0, cpu.byteLength);
	mesh._orderPool.push(order);
}
/** Post a sort job when a buffer is free and the affine view-depth transform
*  drifted past `SORT_EPS` since the last posted sort. The four coefficients
*  are row 2 of `view * world`, computed directly from the two matrices. */
function postSplatSortIfDirty(mesh, world, view) {
	if (mesh._orderPool.length === 0) return;
	const v0 = view[2];
	const v1 = view[6];
	const v2 = view[10];
	const last = mesh._sortDepthTransform;
	const next = mesh._nextSortDepthTransform;
	let dirty = false;
	for (let i = 0; i < 4; i++) {
		next[i] = v0 * world[4 * i] + v1 * world[4 * i + 1] + v2 * world[4 * i + 2] + (i === 3 ? view[14] : 0);
		if (Math.abs(last[i] - next[i]) > SORT_EPS) dirty = true;
	}
	if (!dirty) return;
	last.set(next);
	const order = mesh._orderPool.pop();
	mesh._worker.postMessage({
		t: last,
		o: order
	}, [order.buffer]);
}
/** Free all GPU + worker resources owned by a GS mesh. */
function disposeGaussianSplattingMesh(mesh) {
	const gs = mesh._gs;
	[
		gs._centersTex,
		gs._covATex,
		gs._covBTex,
		gs._colorsTex,
		gs._quadBuffer,
		gs._indexBuffer,
		gs._splatIndexBuffer,
		...gs._shTextures ?? []
	].forEach((resource) => resource.destroy());
	mesh._worker.terminate();
}
function initSplatTransform(node) {
	const wm = createWorldMatrixState(() => composeTrsLocalMatrix(node.position, node.rotationQuaternion, node.scaling));
	const onDirty = () => wm.markLocalDirty();
	const [iqx, iqy, iqz, iqw] = eulerXYZToQuatTuple(0, 0, 0);
	const rq = new ObservableQuat(iqx, iqy, iqz, iqw, onDirty);
	node.rotationQuaternion = rq;
	node.rotation = createEulerProxy(rq);
	node.position = new ObservableVec3(0, 0, 0, onDirty);
	node.scaling = new ObservableVec3(1, 1, 1, onDirty);
	node.children = [];
	Object.defineProperty(node, "parent", {
		get() {
			return wm.parent;
		},
		set(v) {
			wm.parent = v;
		},
		configurable: true,
		enumerable: true
	});
	Object.defineProperty(node, "worldMatrix", {
		get() {
			return wm.getWorldMatrix();
		},
		configurable: true,
		enumerable: false
	});
	Object.defineProperty(node, "worldMatrixVersion", {
		get() {
			return wm.getWorldMatrixVersion();
		},
		configurable: true,
		enumerable: false
	});
	attachWorldMatrixState(node, wm);
}
export { createGaussianSplattingMesh, disposeGaussianSplattingMesh, postSplatSortIfDirty, uploadPendingSplatOrder };

//# sourceMappingURL=gaussian-splatting-mesh.js.map