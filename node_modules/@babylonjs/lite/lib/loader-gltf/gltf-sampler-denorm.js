import { F32, I16, I8, U8 } from "../engine/typed-arrays.js";
import { _installSamplerConverter } from "./gltf-animation.js";
// src/loader-gltf/gltf-sampler-denorm.ts
/** Lazily-installed animation-sampler converter for non-Float32 / normalized accessor payloads:
*  normalized signed BYTE/SHORT rotation output (glTF-Asset-Generator Animation_SamplerType),
*  normalized UNSIGNED_BYTE flags, misaligned Float32, etc. Imported for side effect only when an
*  animation sampler is non-float (registry trigger) or by KHR_animation_pointer, so plain
*  float-sampler animations never bundle this denormalization code and stay byte-identical. */
_installSamplerConverter((src, length, normalized) => {
	if (src instanceof F32) return new F32(src.buffer, src.byteOffset, length);
	const out = new F32(length);
	const div = src instanceof I8 ? 127 : src instanceof I16 ? 32767 : src instanceof U8 ? 255 : 65535;
	const signed = src instanceof I8 || src instanceof I16;
	const s = src;
	for (let i = 0; i < length; i++) out[i] = normalized ? signed ? Math.max(s[i] / div, -1) : s[i] / div : s[i];
	return out;
});
var feature = { id: "_sampler_denorm" };
export { feature as default };

//# sourceMappingURL=gltf-sampler-denorm.js.map