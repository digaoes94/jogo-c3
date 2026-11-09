import "../glyph-storage.js";
// src/text/_gpu/text-textures.ts
/** Owns the rgba32float curve and rg32uint band textures shared across an atlas's lifetime.
*  Lazy-init: created on first bind, recreated only when capacity grows. */
/** Width of the curve / band textures. Must match `TEX_WIDTH` in `glyph-storage.ts` —
*  duplicated here as a literal to avoid a Rollup module-init ordering hazard where the
*  text-textures module body executes before glyph-storage's `TEX_WIDTH` const is
*  initialized. Same Slug-protocol invariant; never changes. */
var TEX_WIDTH = 4096;
var GLYPH_METADATA_BYTES = 48;
function nextPow2Rows(rows) {
	let r = 1;
	while (r < rows) r <<= 1;
	return r;
}
function createMetaBuffer(device, slots) {
	return device.createBuffer({
		label: "text-glyph-metadata",
		size: slots * GLYPH_METADATA_BYTES,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
	});
}
function rowsForTexels(texels) {
	if (texels <= 0) return 1;
	return Math.ceil(texels / TEX_WIDTH);
}
function createAtlasTexture(device, rows, label, format) {
	return device.createTexture({
		label,
		format,
		size: {
			width: TEX_WIDTH,
			height: rows,
			depthOrArrayLayers: 1
		},
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC
	});
}
/** Upload all used texels (rows up to rowsUsed) of `cpuData` to `tex`. */
function uploadAll(device, tex, cpuData, texelsUsed, componentsPerTexel) {
	if (texelsUsed === 0) return;
	const rows = rowsForTexels(texelsUsed);
	device.queue.writeTexture({ texture: tex }, cpuData.buffer, {
		offset: cpuData.byteOffset,
		bytesPerRow: TEX_WIDTH * componentsPerTexel * 4,
		rowsPerImage: rows
	}, {
		width: TEX_WIDTH,
		height: rows,
		depthOrArrayLayers: 1
	});
}
/** Ensure `atlas._gpu` matches the current device and has enough rows for all used texels.
*  Returns true when textures were (re)created — caller must rebuild any bind groups. */
function ensureSharedAtlasGpu(device, atlas) {
	let gpu = atlas._gpu;
	const curveRowsNeeded = rowsForTexels(atlas._curveTexelsUsed);
	const bandRowsNeeded = rowsForTexels(atlas._bandTexelsUsed);
	const slotsNeeded = Math.max(1, atlas._slotCount);
	if (gpu && gpu._device !== device) {
		gpu._curveTex.destroy();
		gpu._bandTex.destroy();
		gpu._metaBuf.destroy();
		gpu = null;
	}
	let rebuilt = false;
	if (!gpu) {
		const curveRows = nextPow2Rows(Math.max(1, curveRowsNeeded));
		const bandRows = nextPow2Rows(Math.max(1, bandRowsNeeded));
		const metaCap = nextPow2Rows(slotsNeeded);
		gpu = {
			_device: device,
			_curveTex: createAtlasTexture(device, curveRows, "text-slug-curves", "rgba32float"),
			_bandTex: createAtlasTexture(device, bandRows, "text-slug-bands", "rg32uint"),
			_curveTexRows: curveRows,
			_bandTexRows: bandRows,
			_metaBuf: createMetaBuffer(device, metaCap),
			_metaCap: metaCap,
			_uploadedVersion: -1
		};
		atlas._gpu = gpu;
		rebuilt = true;
	} else {
		if (curveRowsNeeded > gpu._curveTexRows) {
			gpu._curveTex.destroy();
			gpu._curveTexRows = nextPow2Rows(curveRowsNeeded);
			gpu._curveTex = createAtlasTexture(device, gpu._curveTexRows, "text-slug-curves", "rgba32float");
			gpu._uploadedVersion = -1;
			rebuilt = true;
		}
		if (bandRowsNeeded > gpu._bandTexRows) {
			gpu._bandTex.destroy();
			gpu._bandTexRows = nextPow2Rows(bandRowsNeeded);
			gpu._bandTex = createAtlasTexture(device, gpu._bandTexRows, "text-slug-bands", "rg32uint");
			gpu._uploadedVersion = -1;
			rebuilt = true;
		}
		if (slotsNeeded > gpu._metaCap) {
			gpu._metaBuf.destroy();
			gpu._metaCap = nextPow2Rows(slotsNeeded);
			gpu._metaBuf = createMetaBuffer(device, gpu._metaCap);
			gpu._uploadedVersion = -1;
			rebuilt = true;
		}
	}
	if (gpu._uploadedVersion !== atlas._version) {
		uploadAll(device, gpu._curveTex, atlas._curveTexData, atlas._curveTexelsUsed, 4);
		uploadAll(device, gpu._bandTex, atlas._bandTexData, atlas._bandTexelsUsed, 2);
		if (atlas._slotCount > 0) {
			const meta = atlas._metaData;
			device.queue.writeBuffer(gpu._metaBuf, 0, meta.buffer, meta.byteOffset, atlas._slotCount * GLYPH_METADATA_BYTES);
		}
		gpu._uploadedVersion = atlas._version;
	}
	return {
		_rebuilt: rebuilt,
		_gpu: gpu
	};
}
export { ensureSharedAtlasGpu };

//# sourceMappingURL=text-textures.js.map