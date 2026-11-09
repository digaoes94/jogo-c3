// src/particle/particle-blend.ts
function createBlend(key, colorSrc, colorDst, alphaSrc, alphaDst, particlePasses) {
	return {
		_key: key,
		_descriptor: {
			color: {
				srcFactor: colorSrc,
				dstFactor: colorDst,
				operation: "add"
			},
			alpha: {
				srcFactor: alphaSrc,
				dstFactor: alphaDst,
				operation: "add"
			}
		},
		_depthMode: "transparent",
		_particlePasses: particlePasses
	};
}
/** @internal Create the exact Babylon.js particle blend descriptor for a serialized blend mode. */
function createParticleBlend(mode) {
	switch (mode) {
		case 0: return createBlend("p0", "one", "one", "zero", "one");
		case 1: return createBlend("p1", "src-alpha", "one-minus-src-alpha", "one", "one");
		case 3: return createBlend("p3", "dst", "zero", "one", "one", 1);
		case 4: return createBlend("p4", "dst", "zero", "one", "one", 2);
		default: return createBlend("p2", "src-alpha", "one", "zero", "one");
	}
}
export { createParticleBlend };

//# sourceMappingURL=particle-blend.js.map