// src/animation/easing.ts
/** Circular ease-in. */
function circleEase(gradient) {
	const clamped = Math.max(0, Math.min(1, gradient));
	return 1 - Math.sqrt(1 - clamped * clamped);
}
/** Quadratic ease-in. */
function quadraticEase(gradient) {
	return gradient * gradient;
}
/** Cubic ease-in. */
function cubicEase(gradient) {
	return gradient * gradient * gradient;
}
/** Quartic ease-in. */
function quarticEase(gradient) {
	const squared = gradient * gradient;
	return squared * squared;
}
/** Quintic ease-in. */
function quinticEase(gradient) {
	const squared = gradient * gradient;
	return squared * squared * gradient;
}
/** Sinusoidal ease-in. */
function sineEase(gradient) {
	return 1 - Math.sin(Math.PI / 2 * (1 - gradient));
}
/** Power ease-in. */
function powerEase(gradient, power = 2) {
	return Math.pow(gradient, Math.max(0, power));
}
/** Exponential ease-in. */
function exponentialEase(gradient, exponent = 2) {
	return exponent <= 0 ? gradient : (Math.exp(exponent * gradient) - 1) / (Math.exp(exponent) - 1);
}
/** Back ease-in. */
function backEase(gradient, amplitude = 1) {
	return gradient * gradient * gradient - gradient * Math.max(0, amplitude) * Math.sin(Math.PI * gradient);
}
/** Elastic ease-in. */
function elasticEase(gradient, oscillations = 3, springiness = 3) {
	const clampedOscillations = Math.max(0, oscillations);
	const clampedSpringiness = Math.max(0, springiness);
	return (clampedSpringiness === 0 ? gradient : (Math.exp(clampedSpringiness * gradient) - 1) / (Math.exp(clampedSpringiness) - 1)) * Math.sin((2 * Math.PI * clampedOscillations + Math.PI / 2) * gradient);
}
/** Bounce ease-in. */
function bounceEase(gradient, bounces = 3, bounciness = 2) {
	const clampedBounces = Math.max(0, bounces);
	const safeBounciness = bounciness <= 1 ? 1.001 : bounciness;
	const bouncePower = Math.pow(safeBounciness, clampedBounces);
	const inverseScale = 1 - safeBounciness;
	const scale = (1 - bouncePower) / inverseScale + bouncePower * .5;
	const scaledGradient = gradient * scale;
	const bounce = Math.floor(Math.log(-scaledGradient * inverseScale + 1) / Math.log(safeBounciness));
	const nextBounce = bounce + 1;
	const start = (1 - Math.pow(safeBounciness, bounce)) / (inverseScale * scale);
	const midpoint = (start + (1 - Math.pow(safeBounciness, nextBounce)) / (inverseScale * scale)) * .5;
	const offset = gradient - midpoint;
	const radius = midpoint - start;
	return -Math.pow(1 / safeBounciness, clampedBounces - bounce) / (radius * radius) * (offset - radius) * (offset + radius);
}
/**
* Cubic Bezier ease-in from (0, 0) to (1, 1).
*
* The control-point x coordinates define time, so the curve parameter is refined
* before sampling y. Results outside the animation interval settle to an endpoint.
*/
function bezierCurveEase(gradient, x1 = 0, y1 = 0, x2 = 1, y2 = 1) {
	if (gradient === 0) return 0;
	const xCubic = 1 - 3 * x2 + 3 * x1;
	const xQuadratic = 3 * x2 - 6 * x1;
	const xLinear = 3 * x1;
	let curveTime = gradient;
	for (let iteration = 0; iteration < 5; iteration++) {
		const squaredTime = curveTime * curveTime;
		const x = xCubic * squaredTime * curveTime + xQuadratic * squaredTime + xLinear * curveTime;
		const derivative = 3 * xCubic * squaredTime + 2 * xQuadratic * curveTime + xLinear;
		curveTime -= (x - gradient) / derivative;
		curveTime = Math.min(1, Math.max(0, curveTime));
	}
	const inverseTime = 1 - curveTime;
	return 3 * inverseTime * inverseTime * curveTime * y1 + 3 * inverseTime * curveTime * curveTime * y2 + curveTime * curveTime * curveTime;
}
/** Create a callback using a fixed power. */
function createPowerEase(power = 2) {
	return (gradient) => powerEase(gradient, power);
}
/** Create a callback using a fixed exponential exponent. */
function createExponentialEase(exponent = 2) {
	return (gradient) => exponentialEase(gradient, exponent);
}
/** Create a callback using a fixed back amplitude. */
function createBackEase(amplitude = 1) {
	return (gradient) => backEase(gradient, amplitude);
}
/** Create a callback using fixed elastic parameters. */
function createElasticEase(oscillations = 3, springiness = 3) {
	return (gradient) => elasticEase(gradient, oscillations, springiness);
}
/** Create a callback using fixed bounce parameters. */
function createBounceEase(bounces = 3, bounciness = 2) {
	return (gradient) => bounceEase(gradient, bounces, bounciness);
}
/** Create a callback using fixed cubic Bezier control points. */
function createBezierCurveEase(x1 = 0, y1 = 0, x2 = 1, y2 = 1) {
	return (gradient) => bezierCurveEase(gradient, x1, y1, x2, y2);
}
export { backEase, bezierCurveEase, bounceEase, circleEase, createBackEase, createBezierCurveEase, createBounceEase, createElasticEase, createExponentialEase, createPowerEase, cubicEase, elasticEase, exponentialEase, powerEase, quadraticEase, quarticEase, quinticEase, sineEase };

//# sourceMappingURL=easing.js.map