import { F32 } from "../engine/typed-arrays.js";
import "./types.js";
// src/animation/evaluate.ts
/** Binary search: find index i such that `input[i] <= t < input[i+1]`. */
function findKeyframe(input, t) {
	let lo = 0;
	let hi = input.length - 1;
	if (t <= input[0]) return 0;
	if (t >= input[hi]) return hi > 0 ? hi - 1 : 0;
	while (lo < hi - 1) {
		const mid = lo + hi >> 1;
		if (input[mid] <= t) lo = mid;
		else hi = mid;
	}
	return lo;
}
var _quat = new F32([
	0,
	0,
	0,
	1
]);
/** Normalise 4 consecutive components (quaternion) in-place. No-op on zero length. */
function normalizeQuat4(buf, o) {
	const x = buf[o];
	const y = buf[o + 1];
	const z = buf[o + 2];
	const w = buf[o + 3];
	const lenSq = x * x + y * y + z * z + w * w;
	if (lenSq > 0) {
		const inv = 1 / Math.sqrt(lenSq);
		buf[o] = x * inv;
		buf[o + 1] = y * inv;
		buf[o + 2] = z * inv;
		buf[o + 3] = w * inv;
	}
}
/** Spherical linear interpolation between two quaternions. Writes to out[].
*  Lives here (not in math/mat4.ts) so non-animated scenes don't pay for it. */
function quatSlerp(out, ax, ay, az, aw, bx, by, bz, bw, t) {
	let dot = ax * bx + ay * by + az * bz + aw * bw;
	if (dot < 0) {
		bx = -bx;
		by = -by;
		bz = -bz;
		bw = -bw;
		dot = -dot;
	}
	if (dot > .9995) {
		out[0] = ax + t * (bx - ax);
		out[1] = ay + t * (by - ay);
		out[2] = az + t * (bz - az);
		out[3] = aw + t * (bw - aw);
		normalizeQuat4(out, 0);
		return;
	}
	const theta = Math.acos(dot);
	const sinTheta = Math.sin(theta);
	const wa = Math.sin((1 - t) * theta) / sinTheta;
	const wb = Math.sin(t * theta) / sinTheta;
	out[0] = wa * ax + wb * bx;
	out[1] = wa * ay + wb * by;
	out[2] = wa * az + wb * bz;
	out[3] = wa * aw + wb * bw;
}
/** Babylon.js-compatible quaternion interpolation for caller-authored property animation. */
function propertyQuatSlerp(out, ax, ay, az, aw, bx, by, bz, bw, t) {
	let dot = ax * bx + ay * by + az * bz + aw * bw;
	let endWeight;
	let startWeight;
	const negateEnd = dot < 0;
	if (negateEnd) dot = -dot;
	if (dot > .999999) {
		startWeight = 1 - t;
		endWeight = negateEnd ? -t : t;
	} else {
		const angle = Math.acos(dot);
		const inverseSine = 1 / Math.sin(angle);
		startWeight = Math.sin((1 - t) * angle) * inverseSine;
		endWeight = (negateEnd ? -1 : 1) * Math.sin(t * angle) * inverseSine;
	}
	out[0] = startWeight * ax + endWeight * bx;
	out[1] = startWeight * ay + endWeight * by;
	out[2] = startWeight * az + endWeight * bz;
	out[3] = startWeight * aw + endWeight * bw;
}
function copySample(output, srcOffset, stride, dst, dstOffset) {
	for (let c = 0; c < stride; c++) dst[dstOffset + c] = output[srcOffset + c];
}
function interpolateLinearSample(output, keyIndex, stride, isQuat, gradient, dst, dstOffset) {
	const s0 = keyIndex * stride;
	const s1 = (keyIndex + 1) * stride;
	if (isQuat) {
		propertyQuatSlerp(_quat, output[s0], output[s0 + 1], output[s0 + 2], output[s0 + 3], output[s1], output[s1 + 1], output[s1 + 2], output[s1 + 3], gradient);
		dst[dstOffset] = _quat[0];
		dst[dstOffset + 1] = _quat[1];
		dst[dstOffset + 2] = _quat[2];
		dst[dstOffset + 3] = _quat[3];
		return;
	}
	for (let c = 0; c < stride; c++) dst[dstOffset + c] = output[s0 + c] + gradient * (output[s1 + c] - output[s0 + c]);
}
/**
* Evaluate a sampler at time `t` and write the result into `dst` at `dstOffset`.
* @param stride - Number of components per value (3 for vec3, 4 for quat).
* @param isQuat - True for rotation channels (uses slerp instead of lerp).
*/
function evaluateSampler(sampler, t, stride, isQuat, dst, dstOffset) {
	const { input, output, interpolation } = sampler;
	const keyCount = input.length;
	if (keyCount === 0) return;
	if (keyCount === 1 || t <= input[0]) {
		const srcOff = interpolation === 2 ? stride : 0;
		for (let c = 0; c < stride; c++) dst[dstOffset + c] = output[srcOff + c];
		return;
	}
	const idx = findKeyframe(input, t);
	const t0 = input[idx];
	const t1 = input[idx + 1];
	if (interpolation === 1) {
		const srcOff = (t >= t1 ? idx + 1 : idx) * stride;
		for (let c = 0; c < stride; c++) dst[dstOffset + c] = output[srcOff + c];
		return;
	}
	const dt = t1 - t0;
	const f = t >= t1 ? 1 : dt > 0 ? (t - t0) / dt : 0;
	if (interpolation === 2) {
		const f2 = f * f;
		const f3 = f2 * f;
		const h00 = 2 * f3 - 3 * f2 + 1;
		const h10 = f3 - 2 * f2 + f;
		const h01 = -2 * f3 + 3 * f2;
		const h11 = f3 - f2;
		const k0 = idx * stride * 3;
		const k1 = (idx + 1) * stride * 3;
		for (let c = 0; c < stride; c++) {
			const p0 = output[k0 + stride + c];
			const m0 = output[k0 + 2 * stride + c] * dt;
			const p1 = output[k1 + stride + c];
			const m1 = output[k1 + c] * dt;
			dst[dstOffset + c] = h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1;
		}
		if (isQuat) normalizeQuat4(dst, dstOffset);
		return;
	}
	const s0 = idx * stride;
	const s1 = (idx + 1) * stride;
	if (isQuat) {
		quatSlerp(_quat, output[s0], output[s0 + 1], output[s0 + 2], output[s0 + 3], output[s1], output[s1 + 1], output[s1 + 2], output[s1 + 3], f);
		dst[dstOffset] = _quat[0];
		dst[dstOffset + 1] = _quat[1];
		dst[dstOffset + 2] = _quat[2];
		dst[dstOffset + 3] = _quat[3];
	} else for (let c = 0; c < stride; c++) dst[dstOffset + c] = output[s0 + c] + f * (output[s1 + c] - output[s0 + c]);
}
/**
* Evaluate a caller-authored property sampler with an optional transform of the
* selected segment's normalized progress. Kept separate from {@link evaluateSampler}
* so imported glTF samplers retain their unchanged LINEAR/STEP/CUBICSPLINE path.
*/
function evaluatePropertySampler(sampler, t, stride, isQuat, easing, dst, dstOffset) {
	const { input, output, interpolation } = sampler;
	const sampleTime = Math.fround(t);
	const keyCount = input.length;
	if (keyCount === 0) return;
	if (keyCount === 1 || sampleTime <= input[0]) {
		copySample(output, 0, stride, dst, dstOffset);
		return;
	}
	if (sampleTime >= input[keyCount - 1]) {
		copySample(output, (keyCount - 1) * stride, stride, dst, dstOffset);
		return;
	}
	const idx = findKeyframe(input, sampleTime);
	if (interpolation === 1) {
		copySample(output, idx * stride, stride, dst, dstOffset);
		return;
	}
	const t0 = input[idx];
	const dt = input[idx + 1] - t0;
	const linearGradient = dt > 0 ? (sampleTime - t0) / dt : 0;
	interpolateLinearSample(output, idx, stride, isQuat, easing ? easing(linearGradient) : linearGradient, dst, dstOffset);
}
export { evaluatePropertySampler, evaluateSampler };

//# sourceMappingURL=evaluate.js.map