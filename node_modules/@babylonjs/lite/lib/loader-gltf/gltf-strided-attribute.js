import { F32, U16, U32, U8 } from "../engine/typed-arrays.js";
// src/loader-gltf/gltf-strided-attribute.ts
var FLOAT = 5126;
var UNSIGNED_SHORT = 5123;
var UNSIGNED_INT = 5125;
/** Copy an over-strided glTF accessor into tight typed-array storage. */
function copyStridedAttribute(accessor, bufferView, binChunk, componentCount, componentBytes) {
	const ct = accessor.componentType;
	const count = accessor.count;
	const out = new (ct === FLOAT ? F32 : ct === UNSIGNED_INT ? U32 : ct === UNSIGNED_SHORT ? U16 : U8)(count * componentCount);
	const base = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
	const stride = bufferView.byteStride;
	for (let v = 0; v < count; v++) {
		const row = base + v * stride;
		for (let c = 0; c < componentCount; c++) {
			const off = row + c * componentBytes;
			out[v * componentCount + c] = ct === FLOAT ? binChunk.getFloat32(off, true) : ct === UNSIGNED_INT ? binChunk.getUint32(off, true) : ct === UNSIGNED_SHORT ? binChunk.getUint16(off, true) : binChunk.getUint8(off);
		}
	}
	return out;
}
export { copyStridedAttribute };

//# sourceMappingURL=gltf-strided-attribute.js.map