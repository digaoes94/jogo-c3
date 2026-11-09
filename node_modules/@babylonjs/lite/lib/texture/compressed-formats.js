// src/texture/compressed-formats.ts
var _table = null;
var _copyTable = null;
function getTable() {
	if (_table) return _table;
	const t = /* @__PURE__ */ new Map();
	_table = t;
	function add(gl, gpuFormat, feature, blockW, blockH, blockBytes) {
		t.set(gl, {
			gpuFormat,
			feature,
			blockW,
			blockH,
			blockBytes
		});
	}
	const BC = "texture-compression-bc";
	const ETC = "texture-compression-etc2";
	const ASTC = "texture-compression-astc";
	add(33776, "bc1-rgba-unorm", BC, 4, 4, 8);
	add(33777, "bc1-rgba-unorm", BC, 4, 4, 8);
	add(33778, "bc2-rgba-unorm", BC, 4, 4, 16);
	add(33779, "bc3-rgba-unorm", BC, 4, 4, 16);
	add(36283, "bc4-r-unorm", BC, 4, 4, 8);
	add(36284, "bc4-r-snorm", BC, 4, 4, 8);
	add(36285, "bc5-rg-unorm", BC, 4, 4, 16);
	add(36286, "bc5-rg-snorm", BC, 4, 4, 16);
	add(36495, "bc6h-rgb-ufloat", BC, 4, 4, 16);
	add(36494, "bc6h-rgb-float", BC, 4, 4, 16);
	add(36492, "bc7-rgba-unorm", BC, 4, 4, 16);
	add(36493, "bc7-rgba-unorm-srgb", BC, 4, 4, 16);
	add(37488, "eac-r11unorm", ETC, 4, 4, 8);
	add(37489, "eac-r11snorm", ETC, 4, 4, 8);
	add(37490, "eac-rg11unorm", ETC, 4, 4, 16);
	add(37491, "eac-rg11snorm", ETC, 4, 4, 16);
	add(37492, "etc2-rgb8unorm", ETC, 4, 4, 8);
	add(37493, "etc2-rgb8unorm-srgb", ETC, 4, 4, 8);
	add(37494, "etc2-rgb8a1unorm", ETC, 4, 4, 8);
	add(37495, "etc2-rgb8a1unorm-srgb", ETC, 4, 4, 8);
	add(37496, "etc2-rgba8unorm", ETC, 4, 4, 16);
	add(37497, "etc2-rgba8unorm-srgb", ETC, 4, 4, 16);
	const ASTC_BLOCKS = [
		[4, 4],
		[5, 4],
		[5, 5],
		[6, 5],
		[6, 6],
		[8, 5],
		[8, 6],
		[8, 8],
		[10, 5],
		[10, 6],
		[10, 8],
		[10, 10],
		[12, 10],
		[12, 12]
	];
	for (let i = 0; i < ASTC_BLOCKS.length; i++) {
		const [w, h] = ASTC_BLOCKS[i];
		const tag = `${w}x${h}`;
		add(37808 + i, `astc-${tag}-unorm`, ASTC, w, h, 16);
		add(37840 + i, `astc-${tag}-unorm-srgb`, ASTC, w, h, 16);
	}
	return t;
}
/** Look up compressed format info from a KTX1 glInternalFormat value. Returns undefined if unknown/unsupported. */
function getCompressedFormat(glInternalFormat) {
	return getTable().get(glInternalFormat);
}
/** Copy footprints by GPU format; opaque, CPU-unwritable, and combined depth/stencil formats have no entry. */
function getTextureFormatBlockInfo(format) {
	if (!_copyTable) {
		const table = /* @__PURE__ */ new Map();
		for (const info of getTable().values()) {
			table.set(info.gpuFormat, info);
			if (info.gpuFormat === "bc1-rgba-unorm" || info.gpuFormat === "bc2-rgba-unorm" || info.gpuFormat === "bc3-rgba-unorm") table.set(`${info.gpuFormat}-srgb`, info);
		}
		const add = (blockBytes, formats) => {
			const info = {
				blockW: 1,
				blockH: 1,
				blockBytes
			};
			for (const name of formats.split(" ")) table.set(name, info);
		};
		add(1, "r8unorm r8snorm r8uint r8sint stencil8");
		add(2, "r16unorm r16snorm r16uint r16sint r16float rg8unorm rg8snorm rg8uint rg8sint depth16unorm");
		add(4, "r32uint r32sint r32float rg16unorm rg16snorm rg16uint rg16sint rg16float rgba8unorm rgba8unorm-srgb rgba8snorm rgba8uint rgba8sint bgra8unorm bgra8unorm-srgb rgb9e5ufloat rgb10a2uint rgb10a2unorm rg11b10ufloat");
		add(8, "rg32uint rg32sint rg32float rgba16unorm rgba16snorm rgba16uint rgba16sint rgba16float");
		add(16, "rgba32uint rgba32sint rgba32float");
		_copyTable = table;
	}
	return _copyTable.get(format);
}
/** Map a KTX suffix string to the required WebGPU device feature. Returns undefined for unsupported (e.g. PVRTC). */
function suffixToFeature(suffix) {
	const s = suffix.toLowerCase();
	if (s.includes("astc")) return "texture-compression-astc";
	if (s.includes("dxt") || s.includes("s3tc") || s.includes("bc")) return "texture-compression-bc";
	if (s.includes("etc")) return "texture-compression-etc2";
}
export { getCompressedFormat, getTextureFormatBlockInfo, suffixToFeature };

//# sourceMappingURL=compressed-formats.js.map