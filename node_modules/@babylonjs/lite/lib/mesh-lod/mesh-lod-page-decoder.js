import { createMeshLoDError } from "./mesh-lod-errors.js";
import { PAGE_MAX_BYTES, crc32c } from "./mesh-lod-format.js";
// src/mesh-lod/mesh-lod-page-decoder.ts
var SP = {
	magic: 0,
	major: 4,
	headerBytes: 6,
	pageId: 8,
	flags: 12,
	vertexCount: 16,
	localIndexCount: 20,
	encVertexOffset: 24,
	encVertexBytes: 28,
	decVertexBytes: 32,
	encIndexOffset: 36,
	encIndexBytes: 40,
	decIndexBytes: 44,
	vertexStride: 48,
	indexStride: 52
};
var VERTEX_MODE = "ATTRIBUTES";
var INDEX_MODE = "TRIANGLES";
var NO_FILTER = "NONE";
var _decoder = null;
/** @internal Pre-seed (or clear) the shared decoder singleton. Used only by unit
*  and integration tests to drive the loader with a mock decoder in Node, where the
*  real `/meshopt_decoder.js` WASM script cannot load. Passing `null` resets it. */
function _setMeshLoDPageDecoder(decoder) {
	_decoder = decoder;
}
/** Lazily import and initialize the shared meshopt decoder (script + WASM). */
async function getMeshLoDPageDecoder() {
	if (_decoder) return _decoder;
	let getMeshoptDecoder;
	try {
		({getMeshoptDecoder} = await import("../loader-gltf/meshopt-decode.js"));
	} catch (cause) {
		throw createMeshLoDError("MLOD_DECODER_LOAD", "failed to import the meshopt decoder module", { cause });
	}
	try {
		_decoder = await getMeshoptDecoder();
	} catch (cause) {
		throw createMeshLoDError("MLOD_DECODER_LOAD", "failed to load the meshopt decoder script", { cause });
	}
	return _decoder;
}
function rangeWithin(offset, length, total) {
	return offset >= 0 && length >= 0 && offset + length <= total;
}
/** Validate and decode one stored page's streams into its decoded allocation.
*  `storedPage` is the page's bytes `[offset, offset+storedBytes)`. */
function decodeMeshLoDPage(storedPage, page, decoder) {
	if (storedPage.length !== page.storedBytes || crc32c(storedPage) !== page.crc) throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "page CRC mismatch");
	if (storedPage.length < 64) throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "truncated stored page header");
	if (!Number.isInteger(page.decodedBytes) || page.decodedBytes <= 0 || page.decodedBytes > 262144 || page.decodedBytes % 4 !== 0) throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "decoded page allocation is outside the format limits", {
		expected: `4-${PAGE_MAX_BYTES} bytes, divisible by 4`,
		actual: page.decodedBytes
	});
	const view = new DataView(storedPage.buffer, storedPage.byteOffset, storedPage.byteLength);
	const u16 = (o) => view.getUint16(o, true);
	const u32 = (o) => view.getUint32(o, true);
	let magic = "";
	for (let i = 0; i < 4; i++) magic += String.fromCharCode(storedPage[SP.magic + i]);
	if (magic !== "MLPG") throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "bad stored page magic");
	if (u16(SP.major) !== 1 || u16(SP.headerBytes) !== 64) throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "unsupported stored page header");
	const vertexCount = u32(SP.vertexCount);
	const indexCount = u32(SP.localIndexCount);
	const encVertexOffset = u32(SP.encVertexOffset);
	const encVertexBytes = u32(SP.encVertexBytes);
	const decVertexBytes = u32(SP.decVertexBytes);
	const encIndexOffset = u32(SP.encIndexOffset);
	const encIndexBytes = u32(SP.encIndexBytes);
	const decIndexBytes = u32(SP.decIndexBytes);
	if (u32(SP.vertexStride) !== 24 || u32(SP.indexStride) !== 2) throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "unexpected stream strides");
	if (vertexCount !== page.vertexCount || indexCount !== page.localIndexCount) throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "stored page counts disagree with the page table");
	if (decVertexBytes !== vertexCount * 24 || decIndexBytes !== indexCount * 2) throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "decoded stream sizes disagree with counts");
	if (!rangeWithin(encVertexOffset, encVertexBytes, storedPage.length) || !rangeWithin(encIndexOffset, encIndexBytes, storedPage.length)) throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "encoded stream is out of bounds");
	if (!(encVertexOffset + encVertexBytes <= encIndexOffset || encIndexOffset + encIndexBytes <= encVertexOffset)) throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "encoded streams overlap");
	if (!Number.isInteger(page.vertexByteOffset) || page.vertexByteOffset < 0 || page.vertexByteOffset % 4 !== 0 || !Number.isInteger(page.indexByteOffset) || page.indexByteOffset < 0 || page.indexByteOffset % 2 !== 0 || page.vertexByteOffset + decVertexBytes > page.indexByteOffset || page.indexByteOffset + decIndexBytes > page.decodedBytes) throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "decoded stream layout is misaligned or outside the page allocation");
	const decoded = new Uint8Array(page.decodedBytes);
	const vertexTarget = decoded.subarray(page.vertexByteOffset, page.vertexByteOffset + decVertexBytes);
	try {
		decoder.decodeGltfBuffer(vertexTarget, vertexCount, 24, storedPage.subarray(encVertexOffset, encVertexOffset + encVertexBytes), VERTEX_MODE, NO_FILTER);
		if (indexCount > 0) {
			const indexTarget = decoded.subarray(page.indexByteOffset, page.indexByteOffset + decIndexBytes);
			decoder.decodeGltfBuffer(indexTarget, indexCount, 2, storedPage.subarray(encIndexOffset, encIndexOffset + encIndexBytes), INDEX_MODE, NO_FILTER);
		}
	} catch (cause) {
		throw createMeshLoDError("MLOD_DECODER_FAILURE", "meshopt stream decode failed", { cause });
	}
	const indices = new Uint16Array(decoded.buffer, decoded.byteOffset + page.indexByteOffset, indexCount);
	for (let i = 0; i < indexCount; i++) if (indices[i] >= vertexCount) throw createMeshLoDError("MLOD_PAGE_INTEGRITY", "decoded index is out of range");
	return {
		decoded,
		vertexCount,
		indexCount
	};
}
export { _setMeshLoDPageDecoder, decodeMeshLoDPage, getMeshLoDPageDecoder };

//# sourceMappingURL=mesh-lod-page-decoder.js.map