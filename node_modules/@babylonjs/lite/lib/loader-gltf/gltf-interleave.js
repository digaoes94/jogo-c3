import { DV, F32, U16, U32, U8 } from "../engine/typed-arrays.js";
import { BU } from "../engine/gpu-flags.js";
import { createMappedBuffer } from "../resource/mapped-buffer.js";
import { initMeshTransform } from "../mesh/mesh.js";
import { computeAabb } from "../math/compute-aabb.js";
import { TYPE_SIZES, resolveAccessor } from "./gltf-parser.js";
import { _enableShaderVb } from "../material/shader/shader-vb.js";
import { computeSmoothNormals } from "./gltf-normals.js";
// src/loader-gltf/gltf-interleave.ts
/**
* Interleaved (strided) glTF vertex-buffer support — dynamically imported.
*
* The engine renders interleaved attributes genuinely: the raw strided
* bufferView slice is uploaded ONCE as a shared GPU buffer, bound to each
* attribute slot at byte offset 0, with the per-attribute byte offset encoded in
* the pipeline vertex layout (`attributes[].offset`) and `arrayStride` set to the
* bufferView byteStride. This mirrors stock Babylon.js's WebGPU vertex state and
* avoids a non-zero `setVertexBuffer` bind offset, which corrupts vertex fetch on
* some AMD (Renoir) / Dawn paths. The loader never rewrites the asset.
*
* This whole module is loaded via `await import()` only when an asset actually
* contains an interleaved bufferView, so non-interleaved scenes pay ZERO bundle
* cost. The tight CPU copy of position/normal/uv (for AABB, picking, CSG, …) is
* de-strided LAZILY — only on first CPU read via `installLazyCpu` — so scenes
* that only render never materialize it.
*/
var FLOAT = 5126;
var UNSIGNED_SHORT = 5123;
var UNSIGNED_INT = 5125;
var UNSIGNED_BYTE = 5121;
var COMP_BYTES = {
	[UNSIGNED_BYTE]: 1,
	[UNSIGNED_SHORT]: 2,
	[UNSIGNED_INT]: 4,
	[FLOAT]: 4
};
function createSequentialIndices(vertexCount) {
	const indices = vertexCount > 65535 ? new U32(vertexCount) : new U16(vertexCount);
	for (let i = 0; i < vertexCount; i++) indices[i] = i;
	return indices;
}
/** True if accessor `idx`'s bufferView is interleaved (byteStride present and
*  larger than the attribute's tightly-packed element size). */
function accessorIsStrided(json, idx) {
	const a = json.accessors[idx];
	const stride = (a.bufferView === void 0 ? void 0 : json.bufferViews[a.bufferView])?.byteStride;
	if (stride === void 0) return false;
	return stride !== (TYPE_SIZES[a.type] ?? 1) * (COMP_BYTES[a.componentType] ?? 4);
}
/** Resolve a strided accessor into an {@link AccessorInterleave} descriptor. */
function resolveStrided(json, binChunk, accessorIdx) {
	const accessor = json.accessors[accessorIdx];
	const bufferView = json.bufferViews[accessor.bufferView];
	const ab = binChunk.buffer;
	return {
		_bufferView: accessor.bufferView,
		_stride: bufferView.byteStride,
		_offset: accessor.byteOffset ?? 0,
		_componentType: accessor.componentType,
		_componentCount: TYPE_SIZES[accessor.type] ?? 1,
		_count: accessor.count,
		_slice: new U8(ab, binChunk.byteOffset + (bufferView.byteOffset ?? 0), bufferView.byteLength)
	};
}
/** De-stride an interleaved attribute into a tight Float32Array, reading raw
*  component values (no normalization) so the result matches what a tight
*  accessor view would have produced. */
function destrideToTight(il) {
	const dv = new DV(il._slice.buffer, il._slice.byteOffset, il._slice.byteLength);
	const cb = COMP_BYTES[il._componentType] ?? 4;
	const ct = il._componentType;
	const cc = il._componentCount;
	const out = new F32(il._count * cc);
	for (let v = 0; v < il._count; v++) {
		const rowBase = il._offset + v * il._stride;
		for (let c = 0; c < cc; c++) {
			const off = rowBase + c * cb;
			out[v * cc + c] = ct === FLOAT ? dv.getFloat32(off, true) : ct === UNSIGNED_SHORT ? dv.getUint16(off, true) : ct === UNSIGNED_INT ? dv.getUint32(off, true) : dv.getUint8(off);
		}
	}
	return out;
}
/** Resolve COLOR_0 to a tight float32 VEC4 [0,1] buffer — the vertex-color layout the
*  PBR pipeline binds (float32x4: rgb modulates base color, a modulates alpha). glTF
*  COLOR_0 may be VEC3 or VEC4, FLOAT or normalized UNSIGNED_BYTE/SHORT, and (here)
*  interleaved with a byteStride. Binding the raw strided/ubyte source as float32x4
*  reads neighbouring bytes as floats (garbage / rainbow colors). This normalizes
*  integer types to [0,1], gives a VEC3 source alpha = 1, and de-strides — mirroring
*  the tight path's normalizeColorToVec4. Reads relative to `binChunk`. */
function resolveColorVec4(json, binChunk, idx) {
	const accessor = json.accessors[idx];
	const ct = accessor.componentType;
	const cb = COMP_BYTES[ct] ?? 4;
	const comps = TYPE_SIZES[accessor.type] ?? 4;
	const out = new F32(accessor.count * 4);
	if (accessor.bufferView === void 0) {
		if (comps < 4) for (let v = 0; v < accessor.count; v++) out[v * 4 + 3] = 1;
		return out;
	}
	const bv = json.bufferViews[accessor.bufferView];
	const stride = bv.byteStride ?? comps * cb;
	const inv = ct === UNSIGNED_BYTE ? 1 / 255 : ct === UNSIGNED_SHORT ? 1 / 65535 : 1;
	const base = (bv.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
	for (let v = 0; v < accessor.count; v++) {
		const row = base + v * stride;
		for (let c = 0; c < 4; c++) {
			if (c === 3 && comps < 4) {
				out[v * 4 + 3] = 1;
				break;
			}
			const off = row + c * cb;
			const raw = ct === FLOAT ? binChunk.getFloat32(off, true) : ct === UNSIGNED_SHORT ? binChunk.getUint16(off, true) : binChunk.getUint8(off);
			out[v * 4 + c] = raw * inv;
		}
	}
	return out;
}
/** Build a mesh-data partial for a primitive, but ONLY if it actually sources
*  ≥1 attribute from an interleaved (strided) bufferView. Returns `undefined`
*  for fully-tight primitives so the caller falls back to its tight path.
*
*  Strided POSITION/NORMAL/TEXCOORD_0 attributes keep their raw slice in `_vb`
*  (for genuine GPU interleaving) and leave the tight CPU field `null` — the
*  de-strided copy is materialized lazily on first CPU read (see
*  {@link installLazyCpu}). Strided TANGENT/TEXCOORD_1 are eagerly de-strided
*  (they feed device-lost recovery), but no current asset interleaves them.
*  COLOR_0 is always normalized to a tight float32x3 buffer (see
*  {@link resolveColorVec4}). Tight attributes resolve exactly like the core loader. */
async function buildInterleavedPartial(json, binChunk, primitive, worldMatrix, nodeIdx) {
	const attrs = primitive.attributes;
	let anyStrided = false;
	for (const name in attrs) if (accessorIsStrided(json, attrs[name])) {
		anyStrided = true;
		break;
	}
	if (!anyStrided) return;
	const vb = {};
	let vertexCount = 0;
	const resolveOne = (name, eager) => {
		const idx = attrs[name];
		if (idx === void 0) return {
			_tight: null,
			_count: 0
		};
		if (accessorIsStrided(json, idx)) {
			const il = resolveStrided(json, binChunk, idx);
			const elemBytes = il._componentCount * (COMP_BYTES[il._componentType] ?? 4);
			if (il._offset + elemBytes > il._stride) return {
				_tight: destrideToTight(il),
				_count: il._count
			};
			return {
				_tight: eager ? destrideToTight(il) : null,
				_il: il,
				_count: il._count
			};
		}
		const av = resolveAccessor(json, binChunk, idx);
		return {
			_tight: av._data,
			_count: av._count
		};
	};
	const pos = resolveOne("POSITION", false);
	vb._p = pos._il;
	vertexCount = pos._count;
	const nrm = resolveOne("NORMAL", false);
	vb._n = nrm._il;
	const uvIdx = attrs["TEXCOORD_0"];
	const uv = uvIdx !== void 0 && json.accessors[uvIdx].componentType !== FLOAT ? {
		_tight: (await import("./gltf-uv-denorm.js")).resolveUvVec2(json, binChunk, uvIdx),
		_count: json.accessors[uvIdx].count
	} : resolveOne("TEXCOORD_0", false);
	vb._u = uv._il;
	const tan = resolveOne("TANGENT", true);
	vb._t = tan._il;
	const uv2 = resolveOne("TEXCOORD_1", true);
	vb._u2 = uv2._il;
	const colorIdx = attrs["COLOR_0"];
	const colors = colorIdx !== void 0 ? resolveColorVec4(json, binChunk, colorIdx) : null;
	const positions = pos._tight;
	let normals = nrm._tight;
	let uvs = uv._tight;
	const tangents = tan._tight;
	const uv2s = uv2._tight;
	const idxData = primitive.indices !== void 0 ? resolveAccessor(json, binChunk, primitive.indices) : null;
	const indices = idxData ? idxData._data instanceof U32 ? new U32(idxData._data) : idxData._data instanceof U8 ? Uint16Array.from(idxData._data) : new U16(idxData._data.buffer, idxData._data.byteOffset, idxData._count) : createSequentialIndices(vertexCount);
	if (!normals && !vb._n) {
		const tightPos = positions ?? (vb._p ? destrideToTight(vb._p) : new F32(vertexCount * 3));
		normals = computeSmoothNormals(tightPos, indices, vertexCount);
	}
	if (!uvs && !vb._u) uvs = new F32(vertexCount * 2);
	const flatNormal = !nrm._tight && !vb._n;
	return {
		_positions: positions,
		_normals: normals,
		_tangents: tangents,
		_uvs: uvs,
		_uv2s: uv2s,
		_colors: colors,
		_flatNormal: flatNormal,
		_indices: indices,
		_vertexCount: vertexCount,
		_indexCount: indices.length,
		_worldMatrix: worldMatrix,
		_vb: vb,
		_nodeIndex: nodeIdx,
		_primitive: primitive
	};
}
/** Build the GPU geometry for an interleaved mesh: one shared buffer per
*  bufferView for strided attributes (bound at offset 0; the per-attribute byte
*  offset goes into the pipeline vertex layout, matching stock Babylon.js), tight
*  attributes get their own buffer — byte-identical to non-interleaved meshes.
*  The raw `_slice` is intentionally retained on `_vb` so the CPU copy can be
*  de-strided lazily later (see {@link installLazyCpu}). */
function buildInterleavedGpu(engine, m) {
	const vbsrc = m._vb;
	const vertexLayout = {
		position: vbsrc._p,
		normal: vbsrc._n,
		tangent: vbsrc._t,
		uv: vbsrc._u,
		uv2: vbsrc._u2,
		color: vbsrc._c
	};
	Object.setPrototypeOf(vertexLayout, null);
	const shared = /* @__PURE__ */ new Map();
	const vbuf = (a, tight) => {
		if (!a) return tight ? createMappedBuffer(engine, tight, BU.VERTEX) : null;
		let b = shared.get(a._bufferView);
		if (!b) shared.set(a._bufferView, b = createMappedBuffer(engine, a._slice, BU.VERTEX));
		return b;
	};
	const k = (a) => `${a?._stride ?? 0},${a?._offset ?? 0}`;
	return {
		positionBuffer: vbuf(vbsrc._p, m._positions),
		normalBuffer: vbuf(vbsrc._n, m._normals),
		tangentBuffer: m._tangents ? vbuf(vbsrc._t, m._tangents) : null,
		uvBuffer: vbuf(vbsrc._u, m._uvs),
		uv2Buffer: m._uv2s ? vbuf(vbsrc._u2, m._uv2s) : null,
		colorBuffer: m._colors ? vbuf(vbsrc._c, m._colors) : null,
		indexBuffer: createMappedBuffer(engine, m._indices, BU.INDEX),
		indexCount: m._indexCount,
		indexFormat: m._indices instanceof U32 ? "uint32" : "uint16",
		_vbLayout: vertexLayout,
		_vbKey: `vb${k(vbsrc._p)}.${k(vbsrc._n)}.${k(vbsrc._t)}.${k(vbsrc._u)}.${k(vbsrc._u2)}.${k(vbsrc._c)}`
	};
}
/** Build a complete engine mesh from interleaved glTF mesh-data. Owns ALL
*  interleave-specific work (GPU upload, AABB fold, lazy CPU install, device-lost
*  retention) so the core loader's tight path stays byte-identical to the
*  non-interleaved engine — keeping interleave bytes out of every glTF scene that
*  doesn't use it. */
function buildInterleavedMesh(engine, m, index, material, name, source) {
	const gpu = source?._gpu ?? buildInterleavedGpu(engine, m);
	_enableShaderVb();
	const [boundMin, boundMax] = m._vb._p ? computeAabbStrided(m._vb._p) : computeAabb(m._positions);
	const mesh = initMeshTransform({
		name: name || `gltf_mesh_${index}`,
		material,
		receiveShadows: false,
		boundMin,
		boundMax,
		_gpu: gpu,
		_flatNormal: m._flatNormal
	});
	installLazyCpu(mesh, m);
	mesh._cpuIndices = source?._cpuIndices ?? (m._indices instanceof U32 ? m._indices : new U32(m._indices));
	engine._dlr?.m(mesh, m._uv2s, m._tangents, m._colors, m._indices, gpu.indexFormat);
	return mesh;
}
/** Fold an AABB directly over an interleaved (strided) FLOAT vec3 position
*  source — no tight copy is materialized. Mirrors {@link computeAabb}'s
*  world-transform handling. All current interleaved assets use FLOAT positions. */
function computeAabbStrided(il, world) {
	const dv = new DV(il._slice.buffer, il._slice.byteOffset, il._slice.byteLength);
	let minX = Infinity, minY = Infinity, minZ = Infinity;
	let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
	for (let v = 0; v < il._count; v++) {
		const base = il._offset + v * il._stride;
		const lx = dv.getFloat32(base, true);
		const ly = dv.getFloat32(base + 4, true);
		const lz = dv.getFloat32(base + 8, true);
		let x = lx, y = ly, z = lz;
		if (world) {
			x = world[0] * lx + world[4] * ly + world[8] * lz + world[12];
			y = world[1] * lx + world[5] * ly + world[9] * lz + world[13];
			z = world[2] * lx + world[6] * ly + world[10] * lz + world[14];
		}
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
		if (z < minZ) minZ = z;
		if (z > maxZ) maxZ = z;
	}
	return [[
		minX,
		minY,
		minZ
	], [
		maxX,
		maxY,
		maxZ
	]];
}
/** Install lazy CPU-geometry accessors on an interleaved mesh. Each of
*  `_cpuPositions/_cpuNormals/_cpuUvs` that comes from a strided source is
*  defined as a getter that de-strides a tight copy on first access and caches
*  it; tight attributes are assigned directly. A mesh that is never picked /
*  CSG'd / navigated never materializes the de-strided arrays.
*
*  The property names are written as STATIC literals (not a computed key) so the
*  minifier mangles them identically to the static reads in the picking /
*  device-lost code — a computed `defineProperty(mesh, key)` would leave the name
*  an unmangled literal and mismatch those reads across the chunk boundary. */
function installLazyCpu(mesh, m) {
	const vb = m._vb;
	if (vb._p) Object.defineProperty(mesh, "_cpuPositions", lazyCpuDesc(vb._p));
	else if (m._positions) mesh._cpuPositions = m._positions;
	if (vb._n) Object.defineProperty(mesh, "_cpuNormals", lazyCpuDesc(vb._n));
	else if (m._normals) mesh._cpuNormals = m._normals;
	if (vb._u) Object.defineProperty(mesh, "_cpuUvs", lazyCpuDesc(vb._u));
	else if (m._uvs) mesh._cpuUvs = m._uvs;
}
/** Build a lazy shared-cache getter with a per-Mesh copy-on-write override. */
function lazyCpuDesc(il) {
	let local;
	return {
		configurable: true,
		enumerable: true,
		get() {
			return local ?? (il._cpu ??= destrideToTight(il));
		},
		set(v) {
			local = v;
		}
	};
}
export { accessorIsStrided, buildInterleavedMesh, buildInterleavedPartial, computeAabbStrided, installLazyCpu };

//# sourceMappingURL=gltf-interleave.js.map