import { invertMat4 } from "./invert-mat4.js";
// src/math/color-temperature.ts
var planckianLocus = [
	[
		0,
		.18006,
		.26352,
		-.24341
	],
	[
		10,
		.18066,
		.26589,
		-.25479
	],
	[
		20,
		.18133,
		.26846,
		-.26876
	],
	[
		30,
		.18208,
		.27119,
		-.28539
	],
	[
		40,
		.18293,
		.27407,
		-.3047
	],
	[
		50,
		.18388,
		.27709,
		-.32675
	],
	[
		60,
		.18494,
		.28021,
		-.35156
	],
	[
		70,
		.18611,
		.28342,
		-.37915
	],
	[
		80,
		.1874,
		.28668,
		-.40955
	],
	[
		90,
		.1888,
		.28997,
		-.44278
	],
	[
		100,
		.19032,
		.29326,
		-.47888
	],
	[
		125,
		.19462,
		.30141,
		-.58204
	],
	[
		150,
		.19962,
		.30921,
		-.70471
	],
	[
		175,
		.20525,
		.31647,
		-.84901
	],
	[
		200,
		.21142,
		.32312,
		-1.0182
	],
	[
		225,
		.21807,
		.32909,
		-1.2168
	],
	[
		250,
		.22511,
		.33439,
		-1.4512
	],
	[
		275,
		.23247,
		.33904,
		-1.7298
	],
	[
		300,
		.2401,
		.34308,
		-2.0637
	],
	[
		325,
		.24792,
		.34655,
		-2.4681
	],
	[
		350,
		.25591,
		.34951,
		-2.9641
	],
	[
		375,
		.264,
		.352,
		-3.5814
	],
	[
		400,
		.27218,
		.35407,
		-4.3633
	],
	[
		425,
		.28039,
		.35577,
		-5.3762
	],
	[
		450,
		.28863,
		.35714,
		-6.7262
	],
	[
		475,
		.29685,
		.35823,
		-8.5955
	],
	[
		500,
		.30505,
		.35907,
		-11.324
	],
	[
		525,
		.3132,
		.35968,
		-15.628
	],
	[
		550,
		.32129,
		.36011,
		-23.325
	],
	[
		575,
		.32931,
		.36038,
		-40.77
	],
	[
		600,
		.33724,
		.36051,
		-116.45
	]
];
var MinTemperatureKelvin = 1e6 / 600;
var MaxTintMagnitude = 150;
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}
function temperatureTintToXyz(temperatureKelvin, tint) {
	const mired = clamp(1e6 / (Number.isNaN(temperatureKelvin) ? MinTemperatureKelvin : Math.max(temperatureKelvin, MinTemperatureKelvin)), 0, 600);
	let low = 0;
	let high = planckianLocus.length - 1;
	while (high - low > 1) {
		const middle = low + high >> 1;
		if (planckianLocus[middle][0] <= mired) low = middle;
		else high = middle;
	}
	const [lowMired, lowU, lowV, lowSlope] = planckianLocus[low];
	const [highMired, highU, highV, highSlope] = planckianLocus[high];
	const interpolation = (mired - lowMired) / (highMired - lowMired);
	let u = lowU + (highU - lowU) * interpolation;
	let v = lowV + (highV - lowV) * interpolation;
	const lowLength = Math.hypot(1, lowSlope);
	const highLength = Math.hypot(1, highSlope);
	let isothermX = 1 / lowLength + (1 / highLength - 1 / lowLength) * interpolation;
	let isothermY = lowSlope / lowLength + (highSlope / highLength - lowSlope / lowLength) * interpolation;
	const isothermLength = Math.hypot(isothermX, isothermY);
	isothermX /= isothermLength;
	isothermY /= isothermLength;
	const tintOffset = clamp(tint, -150, 150) / 3e3;
	u -= isothermX * tintOffset;
	v -= isothermY * tintOffset;
	const denominator = 2 * u - 8 * v + 4;
	const x = 3 * u / denominator;
	const y = 2 * v / denominator;
	return [
		x / y,
		1,
		(1 - x - y) / y
	];
}
function matrix(...values) {
	return new Float32Array(values);
}
function multiply(a, b) {
	const result = /* @__PURE__ */ new Float32Array(16);
	for (let row = 0; row < 4; row++) for (let column = 0; column < 4; column++) result[row * 4 + column] = a[row * 4] * b[column] + a[row * 4 + 1] * b[4 + column] + a[row * 4 + 2] * b[8 + column] + a[row * 4 + 3] * b[12 + column];
	return result;
}
function inverse(value) {
	const result = invertMat4(value);
	return result ? new Float32Array(result) : matrix(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
}
function transformNormal(value, transform) {
	return [
		value[0] * transform[0] + value[1] * transform[4] + value[2] * transform[8],
		value[0] * transform[1] + value[1] * transform[5] + value[2] * transform[9],
		value[0] * transform[2] + value[1] * transform[6] + value[2] * transform[10]
	];
}
function adaptationRatio(destination, source) {
	return clamp(source > 0 ? destination / source : 10, .1, 10);
}
function adaptWhite(source, destination, bradford, inverseBradford) {
	const sourceLms = transformNormal(source, bradford);
	const destinationLms = transformNormal(destination, bradford);
	return multiply(multiply(bradford, matrix(adaptationRatio(destinationLms[0], sourceLms[0]), 0, 0, 0, 0, adaptationRatio(destinationLms[1], sourceLms[1]), 0, 0, 0, 0, adaptationRatio(destinationLms[2], sourceLms[2]), 0, 0, 0, 0, 1)), inverseBradford);
}
var whiteBalanceConstants;
function getWhiteBalanceConstants() {
	if (whiteBalanceConstants) return whiteBalanceConstants;
	const bradford = matrix(.8951, -.7502, .0389, 0, .2664, 1.7135, -.0685, 0, -.1614, .0367, 1.0296, 0, 0, 0, 0, 1);
	const inverseBradford = inverse(bradford);
	const rgbToXyz = multiply(matrix(.4124564, .2126729, .0193339, 0, .3575761, .7151522, .119192, 0, .1804375, .072175, .9503041, 0, 0, 0, 0, 1), adaptWhite([
		.95047,
		1,
		1.08883
	], temperatureTintToXyz(6500, 0), bradford, inverseBradford));
	return whiteBalanceConstants = {
		bradford,
		inverseBradford,
		rgbToXyz,
		xyzToRgb: inverse(rgbToXyz),
		referenceWhite: transformNormal([
			1,
			1,
			1
		], rgbToXyz)
	};
}
function getWhiteBalanceMatrix(temperatureKelvin, tint) {
	const constants = getWhiteBalanceConstants();
	const adapted = multiply(multiply(constants.rgbToXyz, adaptWhite(temperatureTintToXyz(temperatureKelvin, tint), constants.referenceWhite, constants.bradford, constants.inverseBradford)), constants.xyzToRgb);
	return new Float32Array([
		adapted[0],
		adapted[1],
		adapted[2],
		adapted[4],
		adapted[5],
		adapted[6],
		adapted[8],
		adapted[9],
		adapted[10]
	]);
}
export { MaxTintMagnitude, MinTemperatureKelvin, getWhiteBalanceMatrix, temperatureTintToXyz };

//# sourceMappingURL=color-temperature.js.map