import { U8 } from "../engine/typed-arrays.js";
import { TU } from "../engine/gpu-flags.js";
import { acquireTexture } from "../resource/texture-acquire.js";
import { getBilinearSampler } from "../resource/samplers.js";
// src/texture/solid-texture.ts
/** Create a 1×1 solid-color texture for flat-color PBR materials.
*  Avoids loading an image — just writes 4 bytes to a tiny GPU texture. */
/** Create a 1×1 solid-color `Texture2D` from straight RGBA components in [0, 1].
*  @param engine - Engine context.
*  @param r - Red channel (0–1).
*  @param g - Green channel (0–1).
*  @param b - Blue channel (0–1).
*  @param a - Alpha channel (0–1). Default 1.0.
*  @returns A bilinear-sampled `Texture2D` backed by a tiny GPU texture. */
function createSolidTexture2D(engine, r, g, b, a = 1) {
	const device = engine._device;
	const texture = device.createTexture({
		size: {
			width: 1,
			height: 1
		},
		format: "rgba8unorm",
		usage: TU.TEXTURE_BINDING | TU.COPY_DST
	});
	const data = new U8([
		Math.round(r * 255),
		Math.round(g * 255),
		Math.round(b * 255),
		Math.round(a * 255)
	]);
	device.queue.writeTexture({ texture }, data, {
		bytesPerRow: 4,
		rowsPerImage: 1
	}, {
		width: 1,
		height: 1
	});
	const sampler = getBilinearSampler(engine);
	const tex = {
		texture,
		view: texture.createView(),
		sampler,
		width: 1,
		height: 1
	};
	engine._dlr?.s(tex, r, g, b, a);
	acquireTexture(tex);
	return tex;
}
export { createSolidTexture2D };

//# sourceMappingURL=solid-texture.js.map