import { createMeshLoDError } from "./mesh-lod-errors.js";
// src/mesh-lod/mesh-lod-format.ts
var MLOD_MAGIC = "MESHLOD\0";
var FORMAT_MAJOR = 1;
var FORMAT_MINOR = 0;
var READER_MAJOR = 1;
var READER_MINOR = 0;
var ENDIAN_TAG = 16909060;
var HEADER_SIZE = 256;
var SECTION_ENTRY_SIZE = 64;
var GROUP_RECORD_SIZE = 64;
var CLUSTER_RECORD_SIZE = 64;
var HIERARCHY_NODE_SIZE = 32;
var PAGE_TABLE_RECORD_SIZE = 64;
var STORED_PAGE_HEADER_SIZE = 64;
var SECTION_ALIGNMENT = 64;
var PAGE_ALIGNMENT = 65536;
var DECODED_VERTEX_STRIDE = 24;
var LOCAL_INDEX_STRIDE = 2;
var PAGE_MAX_BYTES = 262144;
var STORED_PAGE_MAGIC = "MLPG";
var STORED_PAGE_MAJOR = 1;
var SECTION_PROVENANCE_JSON = 1;
var SECTION_GROUPS = 2;
var SECTION_CLUSTERS = 3;
var SECTION_HIERARCHY_NODES = 4;
var SECTION_GROUP_PAGE_REFS = 5;
var SECTION_PAGE_TABLE = 6;
var SECTION_PAGE_DATA = 7;
var REQUIRED_SECTION_COUNT = 7;
var SECTION_FLAG_REQUIRED = 1;
var SECTION_FLAG_OPTIONAL = 2;
var SECTION_FLAG_PER_ITEM_CRC = 4;
var SECTION_FLAG_PAGE_DATA = 8;
var GROUP_FLAG_TERMINAL = 1;
var GROUP_FLAG_PINNED_COARSE = 2;
var CLUSTER_FLAG_NORMAL_CONE = 1;
var PAGE_FLAG_PINNED = 1;
var PAGE_FLAG_COARSE = 2;
var _crcTable = null;
function crcTable() {
	if (_crcTable) return _crcTable;
	const table = /* @__PURE__ */ new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let crc = i;
		for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 2197175160 ^ crc >>> 1 : crc >>> 1;
		table[i] = crc >>> 0;
	}
	return _crcTable = table;
}
/** CRC32C over `bytes[begin, end)`. Returns an unsigned 32-bit integer. */
function crc32c(bytes, begin = 0, end = bytes.length) {
	const table = crcTable();
	let crc = 4294967295;
	for (let i = begin; i < end; i++) crc = (table[(crc ^ bytes[i]) & 255] ^ crc >>> 8) >>> 0;
	return (crc ^ 4294967295) >>> 0;
}
var Reader = class {
	bytes;
	view;
	constructor(bytes) {
		this.bytes = bytes;
		this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	}
	u16(offset) {
		return this.view.getUint16(offset, true);
	}
	u32(offset) {
		return this.view.getUint32(offset, true);
	}
	i32(offset) {
		return this.view.getInt32(offset, true);
	}
	f32(offset) {
		return this.view.getFloat32(offset, true);
	}
	/** Reads a u64 as a Number, failing if it exceeds the safe-integer range. */
	u64(offset) {
		const value = this.view.getBigUint64(offset, true);
		if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw fail("MLOD_INVALID_LAYOUT", "64-bit value exceeds the safe integer range", { byteOffset: offset });
		return Number(value);
	}
	ascii(offset, length) {
		let s = "";
		for (let i = 0; i < length; i++) s += String.fromCharCode(this.bytes[offset + i]);
		return s;
	}
	hex(offset, length) {
		let s = "";
		for (let i = 0; i < length; i++) s += this.bytes[offset + i].toString(16).padStart(2, "0");
		return s;
	}
	allZero(offset, length) {
		for (let i = 0; i < length; i++) if (this.bytes[offset + i] !== 0) return false;
		return true;
	}
};
function fail(code, message, context) {
	return createMeshLoDError(code, `.mlod: ${message}`, context);
}
var H = {
	magic: 0,
	formatMajor: 8,
	formatMinor: 10,
	minReaderMajor: 12,
	minReaderMinor: 14,
	endianTag: 16,
	headerBytes: 20,
	containerFlags: 24,
	sectionCount: 28,
	directoryOffset: 32,
	directoryBytes: 40,
	bootstrapBytes: 48,
	totalFileBytes: 56,
	sourceDigest: 64,
	buildFingerprint: 96,
	hierarchyId: 128,
	meshIndex: 144,
	primitiveIndex: 148,
	sourceTriangleCount: 152,
	totalClusterTriangles: 160,
	clusterCount: 168,
	groupCount: 172,
	nodeCount: 176,
	pageCount: 180,
	pinnedPageCount: 184,
	levelCount: 188,
	attributeMask: 192,
	vertexStride: 196,
	boundsMin: 200,
	boundsMax: 212,
	maxNonterminalError: 224,
	headerCrc: 228,
	directoryCrc: 232,
	reserved: 236,
	reservedSize: 20
};
function decodeHeader(reader) {
	const size = reader.bytes.length;
	if (size < 256) throw fail("MLOD_TRUNCATED", "file smaller than the header", {
		expected: 256,
		actual: size
	});
	if (reader.ascii(H.magic, 8) !== "MESHLOD\0") throw fail("MLOD_BAD_MAGIC", "bad container magic");
	const formatMajor = reader.u16(H.formatMajor);
	const formatMinor = reader.u16(H.formatMinor);
	const minReaderMajor = reader.u16(H.minReaderMajor);
	const minReaderMinor = reader.u16(H.minReaderMinor);
	if (formatMajor !== 1) throw fail("MLOD_UNSUPPORTED_VERSION", "unsupported format major", {
		expected: 1,
		actual: formatMajor
	});
	if (minReaderMajor > 1 || minReaderMajor === 1 && minReaderMinor > 0) throw fail("MLOD_UNSUPPORTED_VERSION", "container requires a newer reader", {
		expected: `1.0`,
		actual: `${minReaderMajor}.${minReaderMinor}`
	});
	if (reader.u32(H.endianTag) !== 16909060) throw fail("MLOD_UNSUPPORTED_ENDIAN", "bad endian tag");
	if (reader.u32(H.headerBytes) !== 256) throw fail("MLOD_HEADER_INTEGRITY", "bad header size", {
		expected: 256,
		actual: reader.u32(H.headerBytes)
	});
	const totalFileBytes = reader.u64(H.totalFileBytes);
	const bootstrapBytes = reader.u64(H.bootstrapBytes);
	if (bootstrapBytes < 256 || bootstrapBytes > totalFileBytes) throw fail("MLOD_INVALID_LAYOUT", "bootstrap bytes are out of range", {
		expected: totalFileBytes,
		actual: bootstrapBytes
	});
	if (!reader.allZero(H.reserved, H.reservedSize)) throw fail("MLOD_INVALID_LAYOUT", "header reserved bytes are not zero", { byteOffset: H.reserved });
	const storedHeaderCrc = reader.u32(H.headerCrc);
	const headerCopy = reader.bytes.slice(0, 256);
	headerCopy[H.headerCrc] = 0;
	headerCopy[H.headerCrc + 1] = 0;
	headerCopy[H.headerCrc + 2] = 0;
	headerCopy[H.headerCrc + 3] = 0;
	if (crc32c(headerCopy) !== storedHeaderCrc) throw fail("MLOD_HEADER_INTEGRITY", "header CRC mismatch", { byteOffset: H.headerCrc });
	return {
		formatMajor,
		formatMinor,
		minReaderMajor,
		minReaderMinor,
		containerFlags: reader.u32(H.containerFlags),
		sectionCount: reader.u32(H.sectionCount),
		directoryOffset: reader.u64(H.directoryOffset),
		directoryBytes: reader.u64(H.directoryBytes),
		bootstrapBytes,
		totalFileBytes,
		sourceSha256: reader.hex(H.sourceDigest, 32),
		buildFingerprintSha256: reader.hex(H.buildFingerprint, 32),
		hierarchyId: reader.hex(H.hierarchyId, 16),
		meshIndex: reader.u32(H.meshIndex),
		primitiveIndex: reader.u32(H.primitiveIndex),
		sourceTriangleCount: reader.u64(H.sourceTriangleCount),
		hierarchyTriangleCount: reader.u64(H.totalClusterTriangles),
		clusterCount: reader.u32(H.clusterCount),
		groupCount: reader.u32(H.groupCount),
		hierarchyNodeCount: reader.u32(H.nodeCount),
		pageCount: reader.u32(H.pageCount),
		pinnedPageCount: reader.u32(H.pinnedPageCount),
		levelCount: reader.u32(H.levelCount),
		attributeMask: reader.u32(H.attributeMask),
		vertexStride: reader.u32(H.vertexStride),
		boundsMin: [
			reader.f32(H.boundsMin),
			reader.f32(H.boundsMin + 4),
			reader.f32(H.boundsMin + 8)
		],
		boundsMax: [
			reader.f32(H.boundsMax),
			reader.f32(H.boundsMax + 4),
			reader.f32(H.boundsMax + 8)
		],
		maxNonterminalError: reader.f32(H.maxNonterminalError)
	};
}
/** Validate the header and confirm the buffer holds at least the coarse bootstrap
*  region (and no more than the declared file). */
function parseHeader(reader) {
	const header = decodeHeader(reader);
	const size = reader.bytes.length;
	if (size > header.totalFileBytes) throw fail("MLOD_INVALID_LAYOUT", "buffer size exceeds the declared file size", {
		expected: header.totalFileBytes,
		actual: size
	});
	if (size < header.bootstrapBytes) throw fail("MLOD_TRUNCATED", "buffer shorter than the coarse bootstrap region", {
		expected: header.bootstrapBytes,
		actual: size
	});
	return header;
}
var SE = {
	type: 0,
	flags: 4,
	offset: 8,
	storedBytes: 16,
	decodedBytes: 24,
	elementCount: 32,
	elementStride: 36,
	crc: 40,
	alignment: 44,
	reserved: 48,
	reservedSize: 16
};
function rangeWithin(offset, length, total) {
	return offset >= 0 && length >= 0 && offset <= total && length <= total - offset;
}
function rangesDisjoint(offsetA, lengthA, offsetB, lengthB) {
	return offsetA + lengthA <= offsetB || offsetB + lengthB <= offsetA;
}
function parseDirectory(reader, header) {
	const size = header.totalFileBytes;
	const { sectionCount, directoryOffset, directoryBytes } = header;
	if (sectionCount !== 7) throw fail("MLOD_INVALID_LAYOUT", "unexpected section count", {
		expected: 7,
		actual: sectionCount
	});
	if (directoryBytes !== sectionCount * 64) throw fail("MLOD_INVALID_LAYOUT", "directory size disagrees with the section count");
	const bootstrapLimit = Math.min(reader.bytes.length, header.bootstrapBytes);
	if (directoryOffset < 256 || !rangeWithin(directoryOffset, directoryBytes, Math.min(bootstrapLimit, 65536))) throw fail("MLOD_INVALID_LAYOUT", "directory is outside the available bootstrap or first 64 KiB", { byteOffset: directoryOffset });
	if (reader.u32(H.directoryCrc) !== crc32c(reader.bytes, directoryOffset, directoryOffset + directoryBytes)) throw fail("MLOD_DIRECTORY_INTEGRITY", "directory CRC mismatch");
	const entries = [];
	let previousType = 0;
	for (let i = 0; i < sectionCount; i++) {
		const base = directoryOffset + i * 64;
		if (!reader.allZero(base + SE.reserved, SE.reservedSize)) throw fail("MLOD_INVALID_LAYOUT", "section entry reserved bytes are not zero", { byteOffset: base + SE.reserved });
		const type = reader.u32(base + SE.type);
		const flags = reader.u32(base + SE.flags);
		const offset = reader.u64(base + SE.offset);
		const storedBytes = reader.u64(base + SE.storedBytes);
		const decodedBytes = reader.u64(base + SE.decodedBytes);
		const elementCount = reader.u32(base + SE.elementCount);
		const elementStride = reader.u32(base + SE.elementStride);
		const crc = reader.u32(base + SE.crc);
		const alignment = reader.u32(base + SE.alignment);
		if (i > 0 && type <= previousType) throw fail("MLOD_INVALID_LAYOUT", "directory is not sorted by section type", { sectionType: type });
		previousType = type;
		if (type !== i + 1) throw fail("MLOD_INVALID_LAYOUT", "missing or misordered required section", { sectionType: type });
		if (!rangeWithin(offset, storedBytes, size)) throw fail("MLOD_INVALID_LAYOUT", "section range is out of bounds", {
			sectionType: type,
			byteOffset: offset
		});
		if (alignment === 0 || offset % alignment !== 0) throw fail("MLOD_INVALID_LAYOUT", "section is not aligned", {
			sectionType: type,
			byteOffset: offset
		});
		const pageData = (flags & SECTION_FLAG_PAGE_DATA) !== 0;
		if (pageData !== (type === 7)) throw fail("MLOD_INVALID_LAYOUT", "section page-data flag disagrees with its type", {
			sectionType: type,
			byteOffset: base + SE.flags
		});
		if (!pageData) {
			if (!rangeWithin(offset, storedBytes, bootstrapLimit)) throw fail("MLOD_INVALID_LAYOUT", "metadata section is outside the available bootstrap", {
				sectionType: type,
				byteOffset: offset
			});
			if (decodedBytes !== storedBytes) throw fail("MLOD_INVALID_LAYOUT", "metadata decoded size disagrees with stored size", { sectionType: type });
			if (crc32c(reader.bytes, offset, offset + storedBytes) !== crc) throw fail("MLOD_SECTION_INTEGRITY", "section CRC mismatch", { sectionType: type });
		} else if (crc !== 0) throw fail("MLOD_INVALID_LAYOUT", "page-data section must have a zero section CRC", { sectionType: type });
		entries.push({
			type,
			flags,
			required: (flags & SECTION_FLAG_REQUIRED) !== 0,
			optional: (flags & SECTION_FLAG_OPTIONAL) !== 0,
			perItemCrc: (flags & SECTION_FLAG_PER_ITEM_CRC) !== 0,
			pageData,
			offset,
			storedBytes,
			decodedBytes,
			elementCount,
			elementStride,
			crc,
			alignment
		});
	}
	for (let i = 0; i < sectionCount; i++) {
		const a = entries[i];
		if (a.storedBytes > 0 && a.offset < directoryOffset + directoryBytes && !rangesDisjoint(a.offset, a.storedBytes, directoryOffset, directoryBytes)) throw fail("MLOD_INVALID_LAYOUT", "a section overlaps the directory", { sectionType: a.type });
		for (let j = i + 1; j < sectionCount; j++) {
			const b = entries[j];
			if (!rangesDisjoint(a.offset, a.storedBytes, b.offset, b.storedBytes)) throw fail("MLOD_INVALID_LAYOUT", "two sections overlap", { sectionType: a.type });
		}
	}
	return entries;
}
function parseProvenance(reader, entry) {
	const text = new TextDecoder("utf-8", { fatal: false }).decode(reader.bytes.subarray(entry.offset, entry.offset + entry.storedBytes));
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch (cause) {
		throw fail("MLOD_INVALID_LAYOUT", "provenance JSON is not valid", {
			sectionType: 1,
			cause
		});
	}
	if (typeof parsed !== "object" || parsed === null) throw fail("MLOD_INVALID_LAYOUT", "provenance JSON is not an object", { sectionType: 1 });
	const record = parsed;
	const readString = (key) => {
		const value = record[key];
		if (typeof value !== "string") throw fail("MLOD_INVALID_LAYOUT", `provenance is missing string field ${key}`, { sectionType: 1 });
		return value;
	};
	return {
		toolVersion: readString("toolVersion"),
		meshoptimizerRevision: readString("meshoptimizerRevision"),
		cgltfRevision: readString("cgltfRevision")
	};
}
var GR = {
	sphere: 0,
	error: 16,
	depth: 20,
	firstCluster: 24,
	clusterCount: 28,
	firstPageRef: 32,
	pageRefCount: 36,
	flags: 38,
	sourceTriangles: 40,
	emittedTriangles: 44
};
var CR = {
	sphere: 0,
	error: 16,
	groupId: 20,
	refinedGroupId: 24,
	pageId: 28,
	firstVertex: 32,
	firstLocalIndex: 36,
	vertexCount: 40,
	triangleCount: 42,
	sourceTriangles: 44,
	flags: 48,
	normalCone: 52,
	coneCutoff: 56
};
var NR = {
	sphere: 0,
	error: 16,
	group: 20,
	firstChild: 24,
	childCount: 28
};
var PT = {
	offset: 0,
	storedBytes: 8,
	meaningfulBytes: 12,
	decodedBytes: 16,
	crc: 20,
	vertexCount: 24,
	localIndexCount: 28,
	vertexByteOffset: 32,
	indexByteOffset: 36,
	firstCluster: 40,
	clusterCount: 44,
	flags: 48,
	minDepth: 52,
	maxDepth: 54
};
var SP = {
	magic: 0,
	major: 4,
	headerBytes: 6,
	pageId: 8
};
function validateSpatialSphere(reader, offset, sectionType) {
	for (let component = 0; component < 4; component++) {
		const byteOffset = offset + component * 4;
		const value = reader.f32(byteOffset);
		const radius = component === 3;
		if (!Number.isFinite(value) || radius && value < 0) throw fail("MLOD_INVALID_HIERARCHY", radius ? "sphere radius must be finite and nonnegative" : "sphere center must be finite", {
			sectionType,
			byteOffset,
			actual: value
		});
	}
}
function parseGroups(reader, entry, header) {
	requireSection(entry, header.groupCount, 64, "GROUPS");
	const groups = [];
	for (let g = 0; g < header.groupCount; g++) {
		const base = entry.offset + g * 64;
		validateSpatialSphere(reader, base + GR.sphere, entry.type);
		const flags = reader.u16(base + GR.flags);
		const terminal = (flags & GROUP_FLAG_TERMINAL) !== 0;
		const simplifiedError = reader.f32(base + GR.error);
		if (!terminal && (!Number.isFinite(simplifiedError) || simplifiedError < 0)) throw fail("MLOD_INVALID_HIERARCHY", "nonterminal group simplification error must be finite and nonnegative", {
			sectionType: entry.type,
			byteOffset: base + GR.error,
			actual: simplifiedError
		});
		const depth = reader.u32(base + GR.depth);
		const firstCluster = reader.u32(base + GR.firstCluster);
		const clusterCount = reader.u32(base + GR.clusterCount);
		const firstPageRef = reader.u32(base + GR.firstPageRef);
		const pageRefCount = reader.u16(base + GR.pageRefCount);
		if (depth >= header.levelCount) throw fail("MLOD_INVALID_HIERARCHY", "group depth exceeds the level count", { byteOffset: base });
		if (firstCluster + clusterCount > header.clusterCount) throw fail("MLOD_INVALID_HIERARCHY", "group cluster range is out of bounds", { byteOffset: base });
		groups.push({
			center: [
				reader.f32(base + GR.sphere),
				reader.f32(base + GR.sphere + 4),
				reader.f32(base + GR.sphere + 8)
			],
			radius: reader.f32(base + GR.sphere + 12),
			simplifiedError,
			depth,
			firstCluster,
			clusterCount,
			firstPageRef,
			pageRefCount,
			terminal,
			pinned: (flags & GROUP_FLAG_PINNED_COARSE) !== 0,
			sourceTriangleCount: reader.u32(base + GR.sourceTriangles),
			outputTriangleCount: reader.u32(base + GR.emittedTriangles)
		});
	}
	return groups;
}
function parseClusters(reader, entry, header) {
	requireSection(entry, header.clusterCount, 64, "CLUSTERS");
	const clusters = [];
	for (let c = 0; c < header.clusterCount; c++) {
		const base = entry.offset + c * 64;
		validateSpatialSphere(reader, base + CR.sphere, entry.type);
		const groupId = reader.u32(base + CR.groupId);
		const refinedGroupId = reader.i32(base + CR.refinedGroupId);
		const pageId = reader.u32(base + CR.pageId);
		if (groupId >= header.groupCount) throw fail("MLOD_INVALID_HIERARCHY", "cluster owning group is out of range", { byteOffset: base });
		if (refinedGroupId !== -1 && (refinedGroupId < 0 || refinedGroupId >= groupId)) throw fail("MLOD_INVALID_HIERARCHY", "cluster refined group is invalid", { byteOffset: base });
		if (pageId >= header.pageCount) throw fail("MLOD_INVALID_HIERARCHY", "cluster page id is out of range", { byteOffset: base });
		const flags = reader.u32(base + CR.flags);
		let normalCone = null;
		if ((flags & CLUSTER_FLAG_NORMAL_CONE) !== 0) {
			const packed = reader.u32(base + CR.normalCone);
			const snorm8 = (shift) => {
				const byte = packed >>> shift & 255;
				return (byte >= 128 ? byte - 256 : byte) / 127;
			};
			const cutoff = reader.f32(base + CR.coneCutoff);
			if (!Number.isFinite(cutoff) || cutoff < 0 || cutoff >= 1) throw fail("MLOD_INVALID_HIERARCHY", "cluster normal cone cutoff is invalid", { byteOffset: base + CR.coneCutoff });
			normalCone = [
				snorm8(0),
				snorm8(8),
				snorm8(16),
				cutoff
			];
		}
		clusters.push({
			center: [
				reader.f32(base + CR.sphere),
				reader.f32(base + CR.sphere + 4),
				reader.f32(base + CR.sphere + 8)
			],
			radius: reader.f32(base + CR.sphere + 12),
			error: reader.f32(base + CR.error),
			groupId,
			refinedGroupId,
			pageId,
			vertexOffset: reader.u32(base + CR.firstVertex),
			indexOffset: reader.u32(base + CR.firstLocalIndex),
			vertexCount: reader.u16(base + CR.vertexCount),
			triangleCount: reader.u16(base + CR.triangleCount),
			sourceTriangleCount: reader.u32(base + CR.sourceTriangles),
			normalCone
		});
	}
	return clusters;
}
function parseNodes(reader, entry, header) {
	requireSection(entry, header.hierarchyNodeCount, 32, "HIERARCHY_NODES");
	const nodes = [];
	for (let n = 0; n < header.hierarchyNodeCount; n++) {
		const base = entry.offset + n * 32;
		validateSpatialSphere(reader, base + NR.sphere, entry.type);
		const group = reader.i32(base + NR.group);
		const childOffset = reader.u32(base + NR.firstChild);
		const childCount = reader.u32(base + NR.childCount);
		if (group === -1) {
			if (childCount === 0 || childCount > 8 || childOffset + childCount > header.hierarchyNodeCount) throw fail("MLOD_INVALID_HIERARCHY", "internal node children are invalid", { byteOffset: base });
		} else if (group < 0 || group >= header.groupCount || childCount !== 0) throw fail("MLOD_INVALID_HIERARCHY", "leaf node is invalid", { byteOffset: base });
		nodes.push({
			center: [
				reader.f32(base + NR.sphere),
				reader.f32(base + NR.sphere + 4),
				reader.f32(base + NR.sphere + 8)
			],
			radius: reader.f32(base + NR.sphere + 12),
			error: reader.f32(base + NR.error),
			groupId: group,
			childOffset,
			childCount
		});
	}
	if (nodes.length < header.levelCount) throw fail("MLOD_INVALID_HIERARCHY", "hierarchy has fewer nodes than levels");
	const state = new Uint8Array(nodes.length);
	const stack = [];
	for (let level = header.levelCount - 1; level >= 0; level--) stack.push(level);
	let visited = 0;
	while (stack.length > 0) {
		const id = stack.pop();
		if (id < 0) {
			state[~id] = 2;
			continue;
		}
		if (state[id] !== 0) throw fail("MLOD_INVALID_HIERARCHY", "hierarchy contains a cycle or shared child", { byteOffset: entry.offset + id * 32 });
		state[id] = 1;
		visited++;
		stack.push(~id);
		const node = nodes[id];
		for (let child = node.childCount - 1; child >= 0; child--) stack.push(node.childOffset + child);
	}
	if (visited !== nodes.length) throw fail("MLOD_INVALID_HIERARCHY", "hierarchy contains unreachable nodes", {
		expected: nodes.length,
		actual: visited
	});
	return nodes;
}
function parseGroupPageRefs(reader, entry, header) {
	if (entry.type !== 5 || entry.elementStride !== 4 || entry.storedBytes !== entry.elementCount * 4) throw fail("MLOD_INVALID_LAYOUT", "group-page-refs section is malformed", { sectionType: 5 });
	const refs = new Uint32Array(entry.elementCount);
	for (let r = 0; r < entry.elementCount; r++) {
		const value = reader.u32(entry.offset + r * 4);
		if (value >= header.pageCount) throw fail("MLOD_INVALID_HIERARCHY", "group page ref is out of range", { byteOffset: entry.offset + r * 4 });
		refs[r] = value;
	}
	return refs;
}
function parsePages(reader, pageTable, pageData, header) {
	requireSection(pageTable, header.pageCount, 64, "PAGE_TABLE");
	if (pageData.elementCount !== header.pageCount) throw fail("MLOD_INVALID_LAYOUT", "page-data element count disagrees with the header");
	const size = header.totalFileBytes;
	const available = reader.bytes.length;
	const pages = [];
	const ranges = [];
	let previousPageEnd = pageData.offset;
	let pinnedEnd = pageData.offset;
	for (let p = 0; p < header.pageCount; p++) {
		const base = pageTable.offset + p * 64;
		const offset = reader.u64(base + PT.offset);
		const storedBytes = reader.u32(base + PT.storedBytes);
		const decodedBytes = reader.u32(base + PT.decodedBytes);
		const crc = reader.u32(base + PT.crc);
		const flags = reader.u32(base + PT.flags);
		const firstCluster = reader.u32(base + PT.firstCluster);
		const clusterCount = reader.u32(base + PT.clusterCount);
		const vertexByteOffset = reader.u32(base + PT.vertexByteOffset);
		const indexByteOffset = reader.u32(base + PT.indexByteOffset);
		if (offset % 65536 !== 0 || storedBytes % 65536 !== 0 || storedBytes < 65536 || storedBytes > 262144) throw fail("MLOD_INVALID_LAYOUT", "page violates 64-256 KiB alignment", {
			pageId: p,
			byteOffset: base
		});
		if (decodedBytes === 0 || decodedBytes > 262144 || decodedBytes % 4 !== 0) throw fail("MLOD_INVALID_LAYOUT", "decoded page allocation is outside the format limits", {
			pageId: p,
			byteOffset: base + PT.decodedBytes,
			expected: `4-${PAGE_MAX_BYTES} bytes, divisible by 4`,
			actual: decodedBytes
		});
		if (vertexByteOffset % 4 !== 0 || indexByteOffset % 2 !== 0) throw fail("MLOD_INVALID_LAYOUT", "decoded stream offset is misaligned", {
			pageId: p,
			byteOffset: base + (vertexByteOffset % 4 !== 0 ? PT.vertexByteOffset : PT.indexByteOffset)
		});
		if (!rangeWithin(offset, storedBytes, size) || offset !== previousPageEnd) throw fail("MLOD_INVALID_LAYOUT", "page data is not contiguous", {
			pageId: p,
			byteOffset: offset
		});
		previousPageEnd = offset + storedBytes;
		if (offset + storedBytes <= available) {
			if (crc32c(reader.bytes, offset, offset + storedBytes) !== crc) throw fail("MLOD_PAGE_INTEGRITY", "page CRC mismatch", {
				pageId: p,
				byteOffset: offset
			});
			if (reader.ascii(offset + SP.magic, 4) !== "MLPG") throw fail("MLOD_PAGE_INTEGRITY", "bad stored page magic", {
				pageId: p,
				byteOffset: offset
			});
			if (reader.u32(offset + SP.pageId) !== p) throw fail("MLOD_PAGE_INTEGRITY", "stored page id mismatch", {
				pageId: p,
				byteOffset: offset
			});
		}
		const pinned = (flags & PAGE_FLAG_PINNED) !== 0;
		if (pinned !== p < header.pinnedPageCount) throw fail("MLOD_INVALID_HIERARCHY", "pinned pages are not a contiguous prefix", { pageId: p });
		if (pinned) pinnedEnd = offset + storedBytes;
		if (firstCluster + clusterCount > header.clusterCount) throw fail("MLOD_INVALID_HIERARCHY", "page cluster range is out of bounds", { pageId: p });
		ranges.push([firstCluster, clusterCount]);
		pages.push({
			offset,
			storedBytes,
			meaningfulBytes: reader.u32(base + PT.meaningfulBytes),
			decodedBytes,
			crc,
			vertexCount: reader.u32(base + PT.vertexCount),
			localIndexCount: reader.u32(base + PT.localIndexCount),
			vertexByteOffset,
			indexByteOffset,
			firstCluster,
			clusterCount,
			pinned,
			coarse: (flags & PAGE_FLAG_COARSE) !== 0,
			minDepth: reader.u16(base + PT.minDepth),
			maxDepth: reader.u16(base + PT.maxDepth)
		});
	}
	ranges.sort((a, b) => a[0] - b[0]);
	let tiling = 0;
	for (const [first, count] of ranges) {
		if (first !== tiling) throw fail("MLOD_INVALID_HIERARCHY", "page cluster ranges do not tile");
		tiling += count;
	}
	if (tiling !== header.clusterCount) throw fail("MLOD_INVALID_HIERARCHY", "pages do not cover every cluster", {
		expected: header.clusterCount,
		actual: tiling
	});
	if (previousPageEnd !== size) throw fail("MLOD_INVALID_LAYOUT", "page data does not reach the end of the file", {
		expected: size,
		actual: previousPageEnd
	});
	if (header.bootstrapBytes !== pinnedEnd) throw fail("MLOD_INVALID_LAYOUT", "bootstrap bytes do not match the pinned page prefix", {
		expected: pinnedEnd,
		actual: header.bootstrapBytes
	});
	return pages;
}
function validateRecordReferences(groups, clusters, nodes, refs, pages, groupOffset, clusterOffset) {
	if (clusters.length > 0 && !groups.some((group) => group.terminal && group.clusterCount > 0)) throw fail("MLOD_INVALID_HIERARCHY", "nonempty hierarchy has no terminal fallback");
	const coveredGroups = new Uint32Array(Math.ceil(groups.length / 32));
	for (const node of nodes) if (node.groupId >= 0) coveredGroups[node.groupId >>> 5] |= 1 << (node.groupId & 31);
	for (let p = 0; p < pages.length; p++) if (pages[p].coarse && !pages[p].pinned) throw fail("MLOD_INVALID_HIERARCHY", "coarse page is not in the pinned prefix", { pageId: p });
	const lastUnpinnedRef = new Uint32Array(refs.length + 1);
	for (let r = 0; r < refs.length; r++) lastUnpinnedRef[r + 1] = pages[refs[r]].pinned ? lastUnpinnedRef[r] : r + 1;
	for (let g = 0; g < groups.length; g++) {
		const group = groups[g];
		if (group.firstPageRef + group.pageRefCount > refs.length) throw fail("MLOD_INVALID_HIERARCHY", "group page refs are out of range", { byteOffset: groupOffset + g * 64 + GR.firstPageRef });
		const unpinnedRef = lastUnpinnedRef[group.firstPageRef + group.pageRefCount];
		if ((group.terminal || group.pinned) && unpinnedRef > group.firstPageRef) throw fail("MLOD_INVALID_HIERARCHY", "fallback group references an unpinned page", {
			pageId: refs[unpinnedRef - 1],
			byteOffset: groupOffset + g * 64 + GR.firstPageRef
		});
	}
	const missingPages = groups.map(() => /* @__PURE__ */ new Set());
	for (let c = 0; c < clusters.length; c++) {
		const cluster = clusters[c];
		const page = pages[cluster.pageId];
		const base = clusterOffset + c * 64;
		if (c < page.firstCluster || c >= page.firstCluster + page.clusterCount) throw fail("MLOD_INVALID_HIERARCHY", "cluster is not in its owning page range", { byteOffset: base + CR.pageId });
		if (cluster.vertexOffset + cluster.vertexCount > page.vertexCount) throw fail("MLOD_INVALID_HIERARCHY", "cluster vertices exceed their page", { byteOffset: base + CR.firstVertex });
		if (cluster.indexOffset + cluster.triangleCount * 3 > page.localIndexCount) throw fail("MLOD_INVALID_HIERARCHY", "cluster local indices exceed their page", { byteOffset: base + CR.firstLocalIndex });
		missingPages[cluster.groupId].add(cluster.pageId);
	}
	for (let g = 0; g < groups.length; g++) {
		const group = groups[g];
		const missing = missingPages[g];
		if ((group.clusterCount > 0 || missing.size > 0) && (coveredGroups[g >>> 5] & 1 << (g & 31)) === 0) throw fail("MLOD_INVALID_HIERARCHY", "nonempty group has no reachable hierarchy leaf", { byteOffset: groupOffset + g * 64 + GR.clusterCount });
		for (let r = group.firstPageRef; r < group.firstPageRef + group.pageRefCount && missing.size > 0; r++) missing.delete(refs[r]);
		if (missing.size > 0) throw fail("MLOD_INVALID_HIERARCHY", "group page refs omit a cluster's owning page", {
			pageId: missing.values().next().value,
			byteOffset: groupOffset + g * 64 + GR.firstPageRef
		});
	}
}
function requireSection(entry, count, stride, name) {
	if (entry.elementCount !== count || entry.elementStride !== stride || entry.storedBytes !== count * stride) throw fail("MLOD_INVALID_LAYOUT", `${name} section counts disagree with the header`, { sectionType: entry.type });
}
function validateHeaderInvariants(header) {
	if ((header.attributeMask & 3) !== 3) throw fail("MLOD_INVALID_LAYOUT", "attribute mask is missing position or normal");
	if (header.vertexStride !== 24) throw fail("MLOD_INVALID_LAYOUT", "unexpected decoded vertex stride", {
		expected: 24,
		actual: header.vertexStride
	});
	if (header.pinnedPageCount > header.pageCount) throw fail("MLOD_INVALID_LAYOUT", "pinned page count exceeds the page count");
	for (const value of [
		...header.boundsMin,
		...header.boundsMax,
		header.maxNonterminalError
	]) if (!Number.isFinite(value)) throw fail("MLOD_INVALID_HIERARCHY", "header bounds or error is not finite");
}
/** Peek the header of a bootstrap chunk (the first read) to learn how many bytes
*  the coarse bootstrap region and the full file occupy. Validates only the
*  header (magic, version, endian, size, CRC); the caller fetches the remaining
*  bootstrap bytes before a full {@link parseMeshLoDContainer}. */
function readBootstrapExtent(bytes) {
	const header = decodeHeader(new Reader(bytes));
	return {
		totalFileBytes: header.totalFileBytes,
		bootstrapBytes: header.bootstrapBytes
	};
}
/** Parse and validate a `.mlod` container. Accepts either a complete file
*  (`bytes.length === totalFileBytes`) or a coarse bootstrap region
*  (`bytes.length === bootstrapBytes`): metadata, references, the full page-table
*  structure, and pinned pages are always validated; fine-page CRC and framing are
*  validated only for pages present in `bytes`. Throws a stable
*  {@link MeshLoDError} on any malformed, corrupt, truncated, or
*  version-incompatible input. */
function parseMeshLoDContainer(bytes) {
	const reader = new Reader(bytes);
	const header = parseHeader(reader);
	validateHeaderInvariants(header);
	const sections = parseDirectory(reader, header);
	const provenance = parseProvenance(reader, sections[0]);
	const groups = parseGroups(reader, sections[1], header);
	const clusters = parseClusters(reader, sections[2], header);
	const hierarchyNodes = parseNodes(reader, sections[3], header);
	const groupPageRefs = parseGroupPageRefs(reader, sections[4], header);
	const pageRecords = parsePages(reader, sections[5], sections[6], header);
	validateRecordReferences(groups, clusters, hierarchyNodes, groupPageRefs, pageRecords, sections[1].offset, sections[2].offset);
	return {
		header,
		sections,
		provenance,
		groups,
		clusters,
		hierarchyNodes,
		pageRecords,
		groupPageRefs
	};
}
/** Build the public {@link MeshLoDMetadata} view from a parsed container. */
function toMeshLoDMetadata(parsed) {
	const { header, provenance } = parsed;
	return {
		formatMajor: header.formatMajor,
		formatMinor: header.formatMinor,
		toolVersion: provenance.toolVersion,
		meshoptimizerRevision: provenance.meshoptimizerRevision,
		cgltfRevision: provenance.cgltfRevision,
		sourceSha256: header.sourceSha256,
		buildFingerprintSha256: header.buildFingerprintSha256,
		meshIndex: header.meshIndex,
		primitiveIndex: header.primitiveIndex,
		sourceTriangleCount: header.sourceTriangleCount,
		hierarchyTriangleCount: header.hierarchyTriangleCount,
		clusterCount: header.clusterCount,
		groupCount: header.groupCount,
		hierarchyNodeCount: header.hierarchyNodeCount,
		hierarchyDepth: header.levelCount,
		pageCount: header.pageCount,
		pinnedPageCount: header.pinnedPageCount,
		boundsMin: header.boundsMin,
		boundsMax: header.boundsMax
	};
}
export { CLUSTER_RECORD_SIZE, DECODED_VERTEX_STRIDE, ENDIAN_TAG, FORMAT_MAJOR, FORMAT_MINOR, GROUP_RECORD_SIZE, HEADER_SIZE, HIERARCHY_NODE_SIZE, LOCAL_INDEX_STRIDE, MLOD_MAGIC, PAGE_ALIGNMENT, PAGE_MAX_BYTES, PAGE_TABLE_RECORD_SIZE, READER_MAJOR, READER_MINOR, REQUIRED_SECTION_COUNT, SECTION_ALIGNMENT, SECTION_CLUSTERS, SECTION_ENTRY_SIZE, SECTION_GROUPS, SECTION_GROUP_PAGE_REFS, SECTION_HIERARCHY_NODES, SECTION_PAGE_DATA, SECTION_PAGE_TABLE, SECTION_PROVENANCE_JSON, STORED_PAGE_HEADER_SIZE, STORED_PAGE_MAGIC, STORED_PAGE_MAJOR, crc32c, parseMeshLoDContainer, readBootstrapExtent, toMeshLoDMetadata };

//# sourceMappingURL=mesh-lod-format.js.map