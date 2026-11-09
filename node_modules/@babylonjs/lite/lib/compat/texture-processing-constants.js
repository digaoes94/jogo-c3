// src/compat/texture-processing-constants.ts
function mapColor(color, transform) {
	return [
		transform(color[0], 0),
		transform(color[1], 1),
		transform(color[2], 2),
		transform(color[3], 3)
	];
}
function divideTextureProcessConstants(a, b) {
	return mapColor(a, (value, index) => value / Math.max(b[index] ?? 0, 1e-5));
}
function transmissionFractionConstants(a, b) {
	return mapColor(a, (value, index) => value / Math.max(value + (b[index] ?? 0) * (1 - value), 1e-5));
}
function transmissionScatterToSingleScatterAlbedoConstants(transmissionColor, transmissionScatter) {
	const extinction = transmissionColor.slice(0, 3).map((value) => -Math.log(Math.max(value, 1e-7)));
	const shift = Math.min(0, ...extinction.map((value, index) => value - (transmissionScatter[index] ?? 0)));
	return [
		transmissionScatter[0] / Math.max(extinction[0] - shift, 1e-5),
		transmissionScatter[1] / Math.max(extinction[1] - shift, 1e-5),
		transmissionScatter[2] / Math.max(extinction[2] - shift, 1e-5),
		transmissionScatter[3]
	];
}
function multiScatterToSingleScatterAlbedoConstants(multiScatter, anisotropy = 0) {
	const aniso = Math.min(Math.max(anisotropy, -.9999), .9999);
	return mapColor(multiScatter, (value, index) => {
		if (index === 3) return value;
		const rho = Math.min(Math.max(value, 0), 1);
		const s = rho === 0 ? 1 : 4.09712 + 4.20863 * rho - Math.sqrt(9.59217 + 41.6808 * rho + 17.7126 * rho * rho);
		return (1 - s * s) / Math.max(1 - aniso * s * s, 1e-7);
	});
}
function singleScatterToMultiScatterAlbedoConstants(singleScatter, anisotropy = 0) {
	const aniso = Math.min(Math.max(anisotropy, -.9999), .9999);
	return mapColor(singleScatter, (value, index) => {
		if (index === 3) return value;
		const albedo = Math.min(Math.max(value, 0), 1);
		const s = Math.sqrt(Math.max((1 - albedo) / Math.max(1 - aniso * albedo, 1e-7), 0));
		return (1 - s) * (1 - .139 * s) / (1 + 1.17 * s);
	});
}
function thinWalledScatterWeightConstants(transmission, scatter) {
	const transmittedScatter = transmission * scatter;
	const denominator = 1 - transmission + transmittedScatter;
	return {
		transmission: transmission * (1 - scatter),
		subsurface: denominator > 1e-5 ? transmittedScatter / denominator : 0
	};
}
export { divideTextureProcessConstants, multiScatterToSingleScatterAlbedoConstants, singleScatterToMultiScatterAlbedoConstants, thinWalledScatterWeightConstants, transmissionFractionConstants, transmissionScatterToSingleScatterAlbedoConstants };

//# sourceMappingURL=texture-processing-constants.js.map