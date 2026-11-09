import { TYPE_SIZES } from "./gltf-parser.js";
import { attachParsedSplat } from "../loader-splat/load-splat.js";
import { _rightHanded } from "#coordinate-system";
// src/loader-gltf/gltf-feature-gaussian-splatting.ts
var NAME = "KHR_gaussian_splatting";
var RotationAttribute = "KHR_gaussian_splatting:ROTATION";
var ScaleAttribute = "KHR_gaussian_splatting:SCALE";
var OpacityAttribute = "KHR_gaussian_splatting:OPACITY";
var ShDegree0Attribute = "KHR_gaussian_splatting:SH_DEGREE_0_COEF_0";
var CT_BYTE = 5120;
var CT_UNSIGNED_BYTE = 5121;
var CT_SHORT = 5122;
var CT_UNSIGNED_SHORT = 5123;
var CT_UNSIGNED_INT = 5125;
var CT_FLOAT = 5126;
var COMPONENT_BYTES = {
	[CT_BYTE]: 1,
	[CT_UNSIGNED_BYTE]: 1,
	[CT_SHORT]: 2,
	[CT_UNSIGNED_SHORT]: 2,
	[CT_UNSIGNED_INT]: 4,
	[CT_FLOAT]: 4
};
var ShC0 = .28209479177387814;
var RowLength = 32;
function clamp255(value) {
	return value <= 0 ? 0 : value >= 255 ? 255 : value + .5 | 0;
}
/** True when a primitive carries the KHR_gaussian_splatting extension or its custom attributes. */
function isGsPrimitive(primitive) {
	if (primitive?.extensions?.[NAME]) return true;
	const attributes = primitive?.attributes;
	if (!attributes) return false;
	for (const key in attributes) if (key.startsWith(NAME + ":")) return true;
	return false;
}
/**
* Read an accessor as a tight Float32Array, honoring `bufferView.byteStride`
* (interleaved sources) and normalizing integer component types per the glTF
* `normalized` flag. Mirrors BJS `_loadFloatAccessorAsync`.
*
* NOTE: this deliberately does NOT go through `resolveAccessor`, which returns a
* tightly-packed view and ignores `byteStride` — reading a strided KHR_gaussian_splatting
* attribute through it would pick up padding / a neighbouring attribute and corrupt the splat.
*/
function readFloats(json, binChunk, accessorIdx) {
	const accessor = json.accessors[accessorIdx];
	const componentCount = TYPE_SIZES[accessor.type] ?? 1;
	const count = accessor.count;
	const out = new Float32Array(count * componentCount);
	if (accessor.bufferView === void 0) return out;
	const bufferView = json.bufferViews[accessor.bufferView];
	const ct = accessor.componentType;
	const compBytes = COMPONENT_BYTES[ct] ?? 4;
	const elemBytes = componentCount * compBytes;
	const stride = bufferView.byteStride ?? elemBytes;
	const normalized = !!accessor.normalized;
	const base = binChunk.byteOffset + (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
	const dv = new DataView(binChunk.buffer);
	for (let v = 0; v < count; v++) {
		const rowBase = base + v * stride;
		for (let c = 0; c < componentCount; c++) {
			const off = rowBase + c * compBytes;
			let value;
			switch (ct) {
				case CT_FLOAT:
					value = dv.getFloat32(off, true);
					break;
				case CT_UNSIGNED_BYTE:
					value = normalized ? dv.getUint8(off) / 255 : dv.getUint8(off);
					break;
				case CT_BYTE:
					value = normalized ? Math.max(dv.getInt8(off) / 127, -1) : dv.getInt8(off);
					break;
				case CT_UNSIGNED_SHORT:
					value = normalized ? dv.getUint16(off, true) / 65535 : dv.getUint16(off, true);
					break;
				case CT_SHORT:
					value = normalized ? Math.max(dv.getInt16(off, true) / 32767, -1) : dv.getInt16(off, true);
					break;
				case CT_UNSIGNED_INT:
					value = dv.getUint32(off, true);
					break;
				default: value = dv.getFloat32(off, true);
			}
			out[v * componentCount + c] = value;
		}
	}
	return out;
}
/** Convert one GS primitive's glTF attributes into a standard 32-byte/splat row buffer. */
function buildSplatBuffer(json, binChunk, rec) {
	const attrs = rec.attributes;
	const positions = readFloats(json, binChunk, attrs["POSITION"]);
	const splatCount = positions.length / 3 | 0;
	const scales = attrs[ScaleAttribute] !== void 0 ? readFloats(json, binChunk, attrs[ScaleAttribute]) : null;
	const rotations = attrs[RotationAttribute] !== void 0 ? readFloats(json, binChunk, attrs[RotationAttribute]) : null;
	const opacities = attrs[OpacityAttribute] !== void 0 ? readFloats(json, binChunk, attrs[OpacityAttribute]) : null;
	const shDegree0 = attrs[ShDegree0Attribute] !== void 0 ? readFloats(json, binChunk, attrs[ShDegree0Attribute]) : null;
	const colors = attrs["COLOR_0"] !== void 0 ? readFloats(json, binChunk, attrs["COLOR_0"]) : null;
	const colorStride = colors ? colors.length / splatCount | 0 : 0;
	const buffer = /* @__PURE__ */ new ArrayBuffer(RowLength * splatCount);
	const floatView = new Float32Array(buffer);
	const byteView = new Uint8Array(buffer);
	for (let i = 0; i < splatCount; i++) {
		const floatBase = i * 8;
		const byteBase = i * RowLength;
		const p = i * 3;
		floatView[floatBase + 0] = positions[p + 0];
		floatView[floatBase + 1] = positions[p + 1];
		floatView[floatBase + 2] = positions[p + 2];
		floatView[floatBase + 3] = scales ? scales[p + 0] : 1;
		floatView[floatBase + 4] = scales ? scales[p + 1] : 1;
		floatView[floatBase + 5] = scales ? scales[p + 2] : 1;
		if (shDegree0) {
			byteView[byteBase + 24] = clamp255((.5 + ShC0 * shDegree0[p + 0]) * 255);
			byteView[byteBase + 25] = clamp255((.5 + ShC0 * shDegree0[p + 1]) * 255);
			byteView[byteBase + 26] = clamp255((.5 + ShC0 * shDegree0[p + 2]) * 255);
		} else if (colors) {
			const c = i * colorStride;
			byteView[byteBase + 24] = clamp255(colors[c + 0] * 255);
			byteView[byteBase + 25] = clamp255(colors[c + 1] * 255);
			byteView[byteBase + 26] = clamp255(colors[c + 2] * 255);
		} else {
			byteView[byteBase + 24] = 255;
			byteView[byteBase + 25] = 255;
			byteView[byteBase + 26] = 255;
		}
		if (opacities) byteView[byteBase + 27] = clamp255(opacities[i] * 255);
		else if (colors && colorStride >= 4) byteView[byteBase + 27] = clamp255(colors[i * colorStride + 3] * 255);
		else byteView[byteBase + 27] = 255;
		const r = i * 4;
		const qx = rotations ? rotations[r + 0] : 0;
		const qy = rotations ? rotations[r + 1] : 0;
		const qz = rotations ? rotations[r + 2] : 0;
		const qw = rotations ? rotations[r + 3] : 1;
		byteView[byteBase + 28] = clamp255(qw * 127.5 + 127.5);
		byteView[byteBase + 29] = clamp255(qx * 127.5 + 127.5);
		byteView[byteBase + 30] = clamp255(qy * 127.5 + 127.5);
		byteView[byteBase + 31] = clamp255(qz * 127.5 + 127.5);
	}
	return buffer;
}
var feature = {
	id: NAME,
	async preParse(json) {
		const records = [];
		const meshes = json.meshes ?? [];
		for (let mi = 0; mi < meshes.length; mi++) {
			const mesh = meshes[mi];
			const primitives = mesh?.primitives;
			if (!primitives?.length) continue;
			const kept = [];
			for (let pi = 0; pi < primitives.length; pi++) {
				const primitive = primitives[pi];
				if (isGsPrimitive(primitive)) records.push({
					name: `${mesh.name ?? "splat"}_${mi}_${pi}`,
					attributes: primitive.attributes
				});
				else kept.push(primitive);
			}
			mesh.primitives = kept;
		}
		if (records.length) json.__gsSplats = records;
	},
	async applyAsset(_meshes, _root, ctx) {
		const records = ctx._json.__gsSplats;
		if (!records?.length) return {};
		const prepared = records.map((rec) => ({
			name: rec.name,
			buffer: buildSplatBuffer(ctx._json, ctx._binChunk, rec)
		}));
		const ready = [];
		const sceneSetup = (scene) => {
			for (const item of prepared) ready.push(attachParsedSplat(scene, item.name, { data: item.buffer }).then((mesh) => {
				if (_rightHanded) mesh.scaling.y = -1;
				else mesh.rotation.z = Math.PI;
				return mesh;
			}));
		};
		return {
			_sceneSetup: sceneSetup,
			_gaussianSplats: ready
		};
	}
};
export { feature as default };

//# sourceMappingURL=gltf-feature-gaussian-splatting.js.map