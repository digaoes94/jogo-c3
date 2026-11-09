import { decomposeMat4 } from "../math/decompose-mat4.js";
import { fgInt, isFgInt } from "./custom-types/fg-integer.js";
import { fgMatrix2D, fgMatrix3D, isFgMatrix2D, isFgMatrix3D } from "./custom-types/fg-matrix.js";
import { crossVec3 } from "../math/cross-vec3.js";
import { dotVec3 } from "../math/dot-vec3.js";
import { composeMat4 } from "../math/compose-mat4.js";
// src/flow-graph/fg-math.ts
function isVec2(v) {
	return typeof v === "object" && v !== null && "x" in v && "y" in v && !("z" in v);
}
/** Runtime guard for `Mat4` (column-major Float32Array of length 16). */
function isMat4(v) {
	return (v instanceof Float32Array || v instanceof Float64Array) && v.length === 16;
}
function isVec3(v) {
	return typeof v === "object" && v !== null && "x" in v && "y" in v && "z" in v && !("w" in v);
}
function isVec4(v) {
	return typeof v === "object" && v !== null && "x" in v && "y" in v && "z" in v && "w" in v;
}
/** Apply a component-wise binary op across number / FlowGraphInteger / Vector2-4.
*  Mixed/unknown shapes return the left operand (BJS behaviour) so the runtime
*  loop never throws. */
function binary(a, b, f) {
	if (isFgInt(a) && isFgInt(b)) return fgInt(f(a.value, b.value));
	if (typeof a === "number" && typeof b === "number") return f(a, b);
	if (isVec4(a) && isVec4(b)) return {
		x: f(a.x, b.x),
		y: f(a.y, b.y),
		z: f(a.z, b.z),
		w: f(a.w, b.w)
	};
	if (isVec3(a) && isVec3(b)) return {
		x: f(a.x, b.x),
		y: f(a.y, b.y),
		z: f(a.z, b.z)
	};
	if (isVec2(a) && isVec2(b)) return {
		x: f(a.x, b.x),
		y: f(a.y, b.y)
	};
	return a;
}
/** Apply a component-wise unary op across number / FlowGraphInteger / Vector2-4. */
function unary(a, f) {
	if (isFgInt(a)) return fgInt(f(a.value));
	if (typeof a === "number") return f(a);
	if (isVec4(a)) return {
		x: f(a.x),
		y: f(a.y),
		z: f(a.z),
		w: f(a.w)
	};
	if (isVec3(a)) return {
		x: f(a.x),
		y: f(a.y),
		z: f(a.z)
	};
	if (isVec2(a)) return {
		x: f(a.x),
		y: f(a.y)
	};
	return a;
}
/** Type-generic component-wise add (glTF `math/add`). */
function fgAdd(a, b) {
	return binary(a, b, (x, y) => x + y);
}
/** Type-generic component-wise subtract, a − b (glTF `math/sub`). */
function fgSub(a, b) {
	return binary(a, b, (x, y) => x - y);
}
/** Type-generic component-wise (Hadamard) multiply (glTF `math/mul`, which is
*  per-component for vectors — `useMatrixPerComponent` in BJS). */
function fgMul(a, b) {
	return binary(a, b, (x, y) => x * y);
}
/** Type-generic component-wise divide, a ÷ b (glTF `math/div`). */
function fgDiv(a, b) {
	return binary(a, b, (x, y) => x / y);
}
/** Type-generic component-wise remainder, a − b·trunc(a/b) (glTF `math/rem`,
*  matching JS `%`). */
function fgRem(a, b) {
	return binary(a, b, (x, y) => x % y);
}
/** Type-generic component-wise absolute value (glTF `math/abs`). */
function fgAbs(a) {
	return unary(a, Math.abs);
}
/** Type-generic component-wise floor (glTF `math/floor`). */
function fgFloor(a) {
	return unary(a, Math.floor);
}
/** Type-generic component-wise clamp, min(max(a, b), c) (glTF `math/clamp`,
*  b = min, c = max). */
function fgClamp(a, b, c) {
	return binary(binary(a, b, (x, y) => Math.max(x, y)), c, (x, y) => Math.min(x, y));
}
/** Scalar less-than, `a < b` → boolean (glTF `math/lt`). Operates on the numeric
*  payload of number / FlowGraphInteger; returns false for non-scalar shapes. */
function fgLt(a, b) {
	const x = isFgInt(a) ? a.value : a;
	const y = isFgInt(b) ? b.value : b;
	if (typeof x === "number" && typeof y === "number") return x < y;
	return false;
}
/** Combine two scalars into a Vector2 (glTF `math/combine2`). */
function fgCombine2(a, b) {
	const x = isFgInt(a) ? a.value : a;
	const y = isFgInt(b) ? b.value : b;
	return {
		x: x ?? 0,
		y: y ?? 0
	};
}
/** Extract a Vector2's components (glTF `math/extract2`) → `[x, y]`. */
function fgExtract2(v) {
	if (isVec2(v) || isVec3(v) || isVec4(v)) return [v.x, v.y];
	return [0, 0];
}
/** Numeric payload of a number / FlowGraphInteger; `NaN` for other shapes. */
function num(v) {
	if (isFgInt(v)) return v.value;
	return typeof v === "number" ? v : NaN;
}
/** Numeric payload, or 0 when the value is not scalar (combine inputs). */
function num0(v) {
	const n = num(v);
	return Number.isNaN(n) && !(typeof v === "number") ? 0 : n;
}
/** True for number | FlowGraphInteger (the comparison/bitwise scalar domain). */
function isNumeric(v) {
	return typeof v === "number" || isFgInt(v);
}
/** Coerce to a 32-bit signed int payload (integer bitwise ops). */
function toI(v) {
	return (isFgInt(v) ? v.value : v) | 0;
}
/** Component-wise ternary across number / FlowGraphInteger / Vector2-4. */
function ternary(a, b, c, f) {
	if (isFgInt(a) && isFgInt(b) && isFgInt(c)) return fgInt(f(a.value, b.value, c.value));
	if (typeof a === "number" && typeof b === "number" && typeof c === "number") return f(a, b, c);
	if (isVec4(a) && isVec4(b) && isVec4(c)) return {
		x: f(a.x, b.x, c.x),
		y: f(a.y, b.y, c.y),
		z: f(a.z, b.z, c.z),
		w: f(a.w, b.w, c.w)
	};
	if (isVec3(a) && isVec3(b) && isVec3(c)) return {
		x: f(a.x, b.x, c.x),
		y: f(a.y, b.y, c.y),
		z: f(a.z, b.z, c.z)
	};
	if (isVec2(a) && isVec2(b) && isVec2(c)) return {
		x: f(a.x, b.x, c.x),
		y: f(a.y, b.y, c.y)
	};
	return a;
}
/** Component-wise minimum (glTF `math/min`). */
function fgMin(a, b) {
	return binary(a, b, Math.min);
}
/** Component-wise maximum (glTF `math/max`). */
function fgMax(a, b) {
	return binary(a, b, Math.max);
}
/** Component-wise power, a^b (glTF `math/pow`). */
function fgPow(a, b) {
	return binary(a, b, Math.pow);
}
/** Component-wise atan2(a, b) where a = y, b = x (glTF `math/atan2`). */
function fgAtan2(a, b) {
	return binary(a, b, Math.atan2);
}
/** Component-wise negation, −a (glTF `math/neg`). */
function fgNeg(a) {
	return unary(a, (x) => -x);
}
/** Component-wise sign (glTF `math/sign`). */
function fgSign(a) {
	return unary(a, Math.sign);
}
/** Component-wise ceil (glTF `math/ceil`). */
function fgCeil(a) {
	return unary(a, Math.ceil);
}
/** Component-wise round, half toward +∞ (glTF `math/round`). */
function fgRound(a) {
	return unary(a, Math.round);
}
/** Component-wise truncation toward zero (glTF `math/trunc`). */
function fgTrunc(a) {
	return unary(a, Math.trunc);
}
/** Component-wise fractional part, `x − floor(x)` (glTF `math/fract`). */
function fgFract(a) {
	return unary(a, (x) => x - Math.floor(x));
}
/** Component-wise clamp to [0, 1] (glTF `math/saturate`). */
function fgSaturate(a) {
	return unary(a, (x) => Math.min(Math.max(x, 0), 1));
}
/** Component-wise square root (glTF `math/sqrt`). */
function fgSqrt(a) {
	return unary(a, Math.sqrt);
}
/** Component-wise cube root (glTF `math/cbrt`). */
function fgCbrt(a) {
	return unary(a, Math.cbrt);
}
/** Component-wise e^x (glTF `math/exp`). */
function fgExp(a) {
	return unary(a, Math.exp);
}
/** Component-wise natural log (glTF `math/log`). */
function fgLog(a) {
	return unary(a, Math.log);
}
/** Component-wise base-2 log (glTF `math/log2`). */
function fgLog2(a) {
	return unary(a, Math.log2);
}
/** Component-wise base-10 log (glTF `math/log10`). */
function fgLog10(a) {
	return unary(a, Math.log10);
}
/** Component-wise degrees → radians (glTF `math/rad`). */
function fgDegToRad(a) {
	return unary(a, (x) => x * Math.PI / 180);
}
/** Component-wise radians → degrees (glTF `math/deg`). */
function fgRadToDeg(a) {
	return unary(a, (x) => x * 180 / Math.PI);
}
/** Component-wise sine (glTF `math/sin`). */
function fgSin(a) {
	return unary(a, Math.sin);
}
/** Component-wise cosine (glTF `math/cos`). */
function fgCos(a) {
	return unary(a, Math.cos);
}
/** Component-wise tangent (glTF `math/tan`). */
function fgTan(a) {
	return unary(a, Math.tan);
}
/** Component-wise arcsine (glTF `math/asin`). */
function fgAsin(a) {
	return unary(a, Math.asin);
}
/** Component-wise arccosine (glTF `math/acos`). */
function fgAcos(a) {
	return unary(a, Math.acos);
}
/** Component-wise arctangent (glTF `math/atan`). */
function fgAtan(a) {
	return unary(a, Math.atan);
}
/** Component-wise hyperbolic sine (glTF `math/sinh`). */
function fgSinh(a) {
	return unary(a, Math.sinh);
}
/** Component-wise hyperbolic cosine (glTF `math/cosh`). */
function fgCosh(a) {
	return unary(a, Math.cosh);
}
/** Component-wise hyperbolic tangent (glTF `math/tanh`). */
function fgTanh(a) {
	return unary(a, Math.tanh);
}
/** Component-wise inverse hyperbolic sine (glTF `math/asinh`). */
function fgAsinh(a) {
	return unary(a, Math.asinh);
}
/** Component-wise inverse hyperbolic cosine (glTF `math/acosh`). */
function fgAcosh(a) {
	return unary(a, Math.acosh);
}
/** Component-wise inverse hyperbolic tangent (glTF `math/atanh`). */
function fgAtanh(a) {
	return unary(a, Math.atanh);
}
/** Linear blend `(1 − t)·a + t·b` (glTF `math/mix`). Supports vector a/b with a
*  scalar `t`, mirroring BJS's component-wise interpolation. */
function fgMix(a, b, t) {
	const tv = num(t);
	if (Number.isNaN(tv)) return a;
	const lerp = (x, y) => (1 - tv) * x + tv * y;
	if (isVec4(a) && isVec4(b)) return {
		x: lerp(a.x, b.x),
		y: lerp(a.y, b.y),
		z: lerp(a.z, b.z),
		w: lerp(a.w, b.w)
	};
	if (isVec3(a) && isVec3(b)) return {
		x: lerp(a.x, b.x),
		y: lerp(a.y, b.y),
		z: lerp(a.z, b.z)
	};
	if (isVec2(a) && isVec2(b)) return {
		x: lerp(a.x, b.x),
		y: lerp(a.y, b.y)
	};
	if (isNumeric(a) && isNumeric(b)) {
		const r = lerp(num(a), num(b));
		return isFgInt(a) && isFgInt(b) ? fgInt(r) : r;
	}
	return ternary(a, b, t, (x, y, z) => (1 - z) * x + z * y);
}
/** Component-wise Hermite smooth-step coefficient (glTF `math/smoothStep`). */
function fgSmoothStep(a, b, c) {
	return ternary(a, b, c, (edge0, edge1, value) => {
		const t = Math.min(Math.max((value - Math.min(edge0, edge1)) / Math.abs(edge1 - edge0), 0), 1);
		return t * t * (3 - 2 * t);
	});
}
/** Quaternion spherical interpolation (glTF `math/quatSlerp`). */
function fgQuatSlerp(a, b, amount) {
	if (!isVec4(a) || !isVec4(b) || typeof amount !== "number") return {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	};
	let bx = b.x;
	let by = b.y;
	let bz = b.z;
	let bw = b.w;
	let dot = a.x * bx + a.y * by + a.z * bz + a.w * bw;
	if (dot < 0) {
		dot = -dot;
		bx = -bx;
		by = -by;
		bz = -bz;
		bw = -bw;
	}
	let left = 1 - amount;
	let right = amount;
	if (dot < .999999) {
		const omega = Math.acos(Math.min(1, Math.max(-1, dot)));
		const invSin = 1 / Math.sin(omega);
		left = Math.sin((1 - amount) * omega) * invSin;
		right = Math.sin(amount * omega) * invSin;
	}
	return {
		x: left * a.x + right * bx,
		y: left * a.y + right * by,
		z: left * a.z + right * bz,
		w: left * a.w + right * bw
	};
}
/** Strict equality (glTF `math/eq`): exact, zero-tolerance, component-wise for
*  vectors/quaternions; mismatched types compare unequal (BJS behaviour). */
function fgEq(a, b) {
	if (isFgInt(a) && isFgInt(b)) return a.value === b.value;
	if (isFgInt(a) !== isFgInt(b)) return false;
	if (isVec4(a) && isVec4(b)) return a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;
	if (isVec3(a) && isVec3(b)) return a.x === b.x && a.y === b.y && a.z === b.z;
	if (isVec2(a) && isVec2(b)) return a.x === b.x && a.y === b.y;
	return a === b;
}
/** Scalar `a ≤ b` (glTF `math/le`); false for non-scalar shapes. */
function fgLe(a, b) {
	return isNumeric(a) && isNumeric(b) ? num(a) <= num(b) : false;
}
/** Scalar `a > b` (glTF `math/gt`); false for non-scalar shapes. */
function fgGt(a, b) {
	return isNumeric(a) && isNumeric(b) ? num(a) > num(b) : false;
}
/** Scalar `a ≥ b` (glTF `math/ge`); false for non-scalar shapes. */
function fgGe(a, b) {
	return isNumeric(a) && isNumeric(b) ? num(a) >= num(b) : false;
}
/** Scalar NaN test (glTF `math/isNaN`); false for non-scalar shapes. */
function fgIsNaN(a) {
	return isNumeric(a) ? Number.isNaN(num(a)) : false;
}
/** Scalar non-finite test — ±Infinity and NaN (glTF `math/isInf`). */
function fgIsInf(a) {
	return isNumeric(a) ? !Number.isFinite(num(a)) : false;
}
/** Random value in `[min, max)` (glTF `math/random`); defaults to `[0, 1)`. */
function fgRandom(min = 0, max = 1) {
	return Math.random() * (max - min) + min;
}
/** Logical/bitwise AND (glTF `math/and`): `&&` for booleans, `&` for ints. */
function fgAnd(a, b) {
	if (typeof a === "boolean" && typeof b === "boolean") return a && b;
	if (typeof a === "number" && typeof b === "number") return a & b;
	if (isFgInt(a) && isFgInt(b)) return fgInt(a.value & b.value);
	return a;
}
/** Logical/bitwise OR (glTF `math/or`): `||` for booleans, `|` for ints. */
function fgOr(a, b) {
	if (typeof a === "boolean" && typeof b === "boolean") return a || b;
	if (typeof a === "number" && typeof b === "number") return a | b;
	if (isFgInt(a) && isFgInt(b)) return fgInt(a.value | b.value);
	return a;
}
/** Logical/bitwise XOR (glTF `math/xor`): `a≠b` for booleans, `^` for ints. */
function fgXor(a, b) {
	if (typeof a === "boolean" && typeof b === "boolean") return a !== b;
	if (typeof a === "number" && typeof b === "number") return a ^ b;
	if (isFgInt(a) && isFgInt(b)) return fgInt(a.value ^ b.value);
	return a;
}
/** Logical/bitwise NOT (glTF `math/not`): `!a` for booleans, `~a` for ints. */
function fgNot(a) {
	if (typeof a === "boolean") return !a;
	if (typeof a === "number") return ~a;
	if (isFgInt(a)) return fgInt(~a.value);
	return a;
}
/** Logical left shift, `a << b` (glTF `math/lsl`). */
function fgLsl(a, b) {
	return fgInt(toI(a) << toI(b));
}
/** Arithmetic right shift, `a >> b`, sign-extending (glTF `math/asr`). */
function fgAsr(a, b) {
	return fgInt(toI(a) >> toI(b));
}
/** Count leading zero bits over 32 bits (glTF `math/clz`). */
function fgClz(a) {
	return fgInt(Math.clz32(toI(a)));
}
/** Count trailing zero bits; 32 for input 0 (glTF `math/ctz`). */
function fgCtz(a) {
	const n = toI(a);
	return fgInt(n ? 31 - Math.clz32(n & -n) : 32);
}
/** Population count — number of set bits over 32 bits (glTF `math/popcnt`). */
function fgPopcnt(a) {
	let n = toI(a) >>> 0;
	let r = 0;
	while (n) {
		r += n & 1;
		n >>>= 1;
	}
	return fgInt(r);
}
/** Euclidean length of a Vector2/3/4 or Quaternion (glTF `math/length`). */
function fgLength(a) {
	if (isVec2(a)) return Math.hypot(a.x, a.y);
	if (isVec4(a)) return Math.hypot(a.x, a.y, a.z, a.w);
	if (isVec3(a)) return Math.hypot(a.x, a.y, a.z);
	return 0;
}
/** Normalize a Vector2/3/4 or Quaternion to unit length; zero-vector stays zero
*  (glTF `math/normalize`). */
function fgNormalize(a) {
	const len = fgLength(a);
	const s = len === 0 ? 0 : 1 / len;
	if (isVec2(a)) return {
		x: a.x * s,
		y: a.y * s
	};
	if (isVec4(a)) return {
		x: a.x * s,
		y: a.y * s,
		z: a.z * s,
		w: a.w * s
	};
	if (isVec3(a)) return {
		x: a.x * s,
		y: a.y * s,
		z: a.z * s
	};
	return a;
}
/** Dot product of two same-size vectors/quaternions (glTF `math/dot`). */
function fgDot(a, b) {
	if (isVec2(a) && isVec2(b)) return a.x * b.x + a.y * b.y;
	if (isVec4(a) && isVec4(b)) return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
	if (isVec3(a) && isVec3(b)) return dotVec3(a, b);
	return 0;
}
/** 3D cross product (glTF `math/cross`); Vector3 only. */
function fgCross(a, b) {
	if (isVec3(a) && isVec3(b)) return crossVec3(a, b);
	return a;
}
var SLERP_EPSILON = 1e-6;
function perpendicular(v) {
	const axis = Math.abs(v.x) <= Math.abs(v.y) && Math.abs(v.x) <= Math.abs(v.z) ? {
		x: 1,
		y: 0,
		z: 0
	} : Math.abs(v.y) <= Math.abs(v.z) ? {
		x: 0,
		y: 1,
		z: 0
	} : {
		x: 0,
		y: 0,
		z: 1
	};
	const cross = crossVec3(v, axis);
	const invLength = 1 / Math.hypot(cross.x, cross.y, cross.z);
	return {
		x: cross.x * invLength,
		y: cross.y * invLength,
		z: cross.z * invLength
	};
}
/** Spherical interpolation for float2/float3 vectors (glTF `math/slerp`). */
function fgVectorSlerp(a, b, amount) {
	if (typeof amount !== "number") return a;
	if (isVec2(a) && isVec2(b)) {
		const lengthA = Math.hypot(a.x, a.y);
		const lengthB = Math.hypot(b.x, b.y);
		if (lengthA < SLERP_EPSILON || lengthB < SLERP_EPSILON) return {
			x: (1 - amount) * a.x + amount * b.x,
			y: (1 - amount) * a.y + amount * b.y
		};
		const ax = a.x / lengthA;
		const ay = a.y / lengthA;
		const bx = b.x / lengthB;
		const by = b.y / lengthB;
		let angle = Math.acos(Math.min(1, Math.max(-1, ax * bx + ay * by)));
		if (ax * by - ay * bx < 0) angle = -angle;
		const length = (1 - amount) * lengthA + amount * lengthB;
		const cos = Math.cos(amount * angle);
		const sin = Math.sin(amount * angle);
		return {
			x: (ax * cos - ay * sin) * length,
			y: (ax * sin + ay * cos) * length
		};
	}
	if (isVec3(a) && isVec3(b)) {
		const lengthA = Math.hypot(a.x, a.y, a.z);
		const lengthB = Math.hypot(b.x, b.y, b.z);
		const lerp = () => ({
			x: (1 - amount) * a.x + amount * b.x,
			y: (1 - amount) * a.y + amount * b.y,
			z: (1 - amount) * a.z + amount * b.z
		});
		if (lengthA < SLERP_EPSILON || lengthB < SLERP_EPSILON) return lerp();
		const unitA = {
			x: a.x / lengthA,
			y: a.y / lengthA,
			z: a.z / lengthA
		};
		const unitB = {
			x: b.x / lengthB,
			y: b.y / lengthB,
			z: b.z / lengthB
		};
		const dot = dotVec3(unitA, unitB);
		if (dot > .999999) return lerp();
		const axis = dot < -.999999 ? perpendicular(unitA) : (() => {
			const cross = crossVec3(unitA, unitB);
			const invLength = 1 / Math.hypot(cross.x, cross.y, cross.z);
			return {
				x: cross.x * invLength,
				y: cross.y * invLength,
				z: cross.z * invLength
			};
		})();
		const angle = amount * Math.acos(Math.min(1, Math.max(-1, dot)));
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		const axisCrossA = crossVec3(axis, unitA);
		const length = (1 - amount) * lengthA + amount * lengthB;
		return {
			x: (unitA.x * cos + axisCrossA.x * sin) * length,
			y: (unitA.y * cos + axisCrossA.y * sin) * length,
			z: (unitA.z * cos + axisCrossA.z * sin) * length
		};
	}
	return a;
}
/** Rotate a Vector2 by `angle` radians, CCW (glTF `math/rotate2D`). */
function fgRotate2D(a, angle) {
	if (isVec2(a) && typeof angle === "number") {
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		return {
			x: c * a.x - s * a.y,
			y: s * a.x + c * a.y
		};
	}
	return a;
}
/** Rotate a Vector3 by a Quaternion (glTF `math/rotate3D`). */
function fgRotate3D(a, q) {
	if (isVec3(a) && isVec4(q)) {
		const { x, y, z } = a;
		const tx = 2 * (q.y * z - q.z * y);
		const ty = 2 * (q.z * x - q.x * z);
		const tz = 2 * (q.x * y - q.y * x);
		return {
			x: x + q.w * tx + (q.y * tz - q.z * ty),
			y: y + q.w * ty + (q.z * tx - q.x * tz),
			z: z + q.w * tz + (q.x * ty - q.y * tx)
		};
	}
	return a;
}
/** Combine three scalars into a Vector3 (glTF `math/combine3`). */
function fgCombine3(a, b, c) {
	return {
		x: num0(a),
		y: num0(b),
		z: num0(c)
	};
}
/** Combine four scalars into a Vector4 (glTF `math/combine4`). */
function fgCombine4(a, b, c, d) {
	return {
		x: num0(a),
		y: num0(b),
		z: num0(c),
		w: num0(d)
	};
}
/** Extract a Vector3's components (glTF `math/extract3`) → `[x, y, z]`. */
function fgExtract3(v) {
	if (isVec3(v) || isVec4(v)) return [
		v.x,
		v.y,
		v.z
	];
	return [
		0,
		0,
		0
	];
}
/** Extract a Vector4's / Quaternion's components (glTF `math/extract4`). */
function fgExtract4(v) {
	if (isVec4(v)) return [
		v.x,
		v.y,
		v.z,
		v.w
	];
	return [
		0,
		0,
		0,
		0
	];
}
/** Quaternion conjugate, `(−x, −y, −z, w)` (glTF `math/quatConjugate`). */
function fgConjugate(a) {
	if (isVec4(a)) return {
		x: -a.x,
		y: -a.y,
		z: -a.z,
		w: a.w
	};
	return a;
}
/**
* Hamilton product of two quaternions, `a ⊗ b` (glTF `math/quatMul`). Self-
* contained (no core import) so the block chunk never shares a core module with
* non-flow-graph scene chunks. Convention matches BJS `Quaternion.multiply`
* (`a.multiply(b)`). Non-quaternion inputs return `a` unchanged. */
function fgQuatMul(a, b) {
	if (isVec4(a) && isVec4(b)) return quatMul(a, b);
	return a;
}
function quatMul(a, b) {
	return {
		x: a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y,
		y: a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z,
		z: a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x,
		w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
	};
}
/**
* Transform a vector by a matrix (`M · v`, column-major).
*
* Dispatch:
* - `Vec2 × FgMatrix2D` — 2×2 column-major multiply
* - `Vec3 × FgMatrix3D` — 3×3 column-major multiply
* - `Vec4 × Mat4`       — 4×4 column-major multiply (glTF `math/transform`)
*
* Equivalent to BJS `v × M` (row-vector) because Lite stores column-major while
* BJS stores row-major: the mathematical result is identical.
*/
function fgTransformVector(v, m) {
	if (isVec2(v) && isFgMatrix2D(m)) {
		const mm = m.m;
		return {
			x: mm[0] * v.x + mm[2] * v.y,
			y: mm[1] * v.x + mm[3] * v.y
		};
	}
	if (isVec3(v) && isFgMatrix3D(m)) {
		const mm = m.m;
		return {
			x: mm[0] * v.x + mm[3] * v.y + mm[6] * v.z,
			y: mm[1] * v.x + mm[4] * v.y + mm[7] * v.z,
			z: mm[2] * v.x + mm[5] * v.y + mm[8] * v.z
		};
	}
	if (isVec4(v) && isMat4(m)) return {
		x: m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12] * v.w,
		y: m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13] * v.w,
		z: m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14] * v.w,
		w: m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15] * v.w
	};
	return v;
}
/**
* Build an `FgMatrix2D` from 4 column-major scalar inputs (glTF `math/combine2x2`).
* Inputs map directly to storage: `input_i = m[i]`.
*/
function fgCombineMatrix2D(inputs) {
	return fgMatrix2D(inputs);
}
/**
* Build an `FgMatrix3D` from 9 column-major scalar inputs (glTF `math/combine3x3`).
* Inputs map directly to storage: `input_i = m[i]`.
*/
function fgCombineMatrix3D(inputs) {
	return fgMatrix3D(inputs);
}
/**
* Build a `Mat4` from 16 column-major scalar inputs (glTF `math/combine4x4`).
* Inputs map directly to storage: `input_i = m[i]`.
*/
function fgCombineMatrix(inputs) {
	const out = /* @__PURE__ */ new Float32Array(16);
	for (let i = 0; i < 16; i++) out[i] = inputs[i] ?? 0;
	return out;
}
/**
* Extract `FgMatrix2D` elements in column-major order (glTF `math/extract2x2`).
* Output `output_i = m.m[i]` — Lite's column-major storage order.
*/
function fgExtractMatrix2D(m) {
	if (isFgMatrix2D(m)) return [
		m.m[0],
		m.m[1],
		m.m[2],
		m.m[3]
	];
	return [
		0,
		0,
		0,
		0
	];
}
/**
* Extract `FgMatrix3D` elements in column-major order (glTF `math/extract3x3`).
* Output `output_i = m.m[i]` — Lite's column-major storage order.
*/
function fgExtractMatrix3D(m) {
	if (isFgMatrix3D(m)) return [
		m.m[0],
		m.m[1],
		m.m[2],
		m.m[3],
		m.m[4],
		m.m[5],
		m.m[6],
		m.m[7],
		m.m[8]
	];
	return [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0
	];
}
/**
* Extract `Mat4` elements in column-major order (glTF `math/extract4x4`).
* Output `output_i = m[i]` — Lite's column-major storage order.
*/
function fgExtractMatrix(m) {
	if (isMat4(m)) return Array.from({ length: 16 }, (_, i) => m[i]);
	return Array.from({ length: 16 }, () => 0);
}
/**
* Transpose a matrix (glTF `math/transpose`). Column-major in, column-major out.
* Supports `FgMatrix2D`, `FgMatrix3D`, and `Mat4`.
*/
function fgTranspose(m) {
	if (isFgMatrix2D(m)) {
		const mm = m.m;
		return fgMatrix2D([
			mm[0],
			mm[2],
			mm[1],
			mm[3]
		]);
	}
	if (isFgMatrix3D(m)) {
		const mm = m.m;
		return fgMatrix3D([
			mm[0],
			mm[3],
			mm[6],
			mm[1],
			mm[4],
			mm[7],
			mm[2],
			mm[5],
			mm[8]
		]);
	}
	if (isMat4(m)) {
		const out = /* @__PURE__ */ new Float32Array(16);
		for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) out[j * 4 + i] = m[i * 4 + j];
		return out;
	}
	return m;
}
/**
* Compute the scalar determinant of a matrix (glTF `math/determinant`).
* Determinant is layout-independent (`det(M) = det(M^T)`), so the column-major
* formula yields the same scalar as BJS's row-major formula.
*/
function fgDeterminant(m) {
	if (isFgMatrix2D(m)) {
		const mm = m.m;
		return mm[0] * mm[3] - mm[1] * mm[2];
	}
	if (isFgMatrix3D(m)) {
		const mm = m.m;
		return mm[0] * (mm[4] * mm[8] - mm[7] * mm[5]) - mm[3] * (mm[1] * mm[8] - mm[7] * mm[2]) + mm[6] * (mm[1] * mm[5] - mm[4] * mm[2]);
	}
	if (isMat4(m)) {
		const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
		const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
		const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
		const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
		const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10;
		const b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
		const b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
		const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
		const b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31;
		const b10 = a21 * a33 - a23 * a31;
		return b00 * (a22 * a33 - a23 * a32) - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	}
	return 0;
}
/** Inverse of a column-major Mat4. Returns null when singular. */
function fgMat4Invert(input) {
	const m = input;
	const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
	const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
	const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
	const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
	const b00 = a00 * a11 - a01 * a10;
	const b01 = a00 * a12 - a02 * a10;
	const b02 = a00 * a13 - a03 * a10;
	const b03 = a01 * a12 - a02 * a11;
	const b04 = a01 * a13 - a03 * a11;
	const b05 = a02 * a13 - a03 * a12;
	const b06 = a20 * a31 - a21 * a30;
	const b07 = a20 * a32 - a22 * a30;
	const b08 = a20 * a33 - a23 * a30;
	const b09 = a21 * a32 - a22 * a31;
	const b10 = a21 * a33 - a23 * a31;
	const b11 = a22 * a33 - a23 * a32;
	let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	if (Math.abs(det) < 1e-10) return null;
	det = 1 / det;
	const out = /* @__PURE__ */ new Float32Array(16);
	out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
	out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
	out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
	out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
	out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
	out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
	out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
	return out;
}
/** Column-major Mat4 product: `out = a * b`. */
function fgMat4Multiply(a, b) {
	const x = a;
	const y = b;
	const a0 = x[0], a1 = x[1], a2 = x[2], a3 = x[3];
	const a4 = x[4], a5 = x[5], a6 = x[6], a7 = x[7];
	const a8 = x[8], a9 = x[9], a10 = x[10], a11 = x[11];
	const a12 = x[12], a13 = x[13], a14 = x[14], a15 = x[15];
	const out = /* @__PURE__ */ new Float32Array(16);
	let b0 = y[0], b1 = y[1], b2 = y[2], b3 = y[3];
	out[0] = a0 * b0 + a4 * b1 + a8 * b2 + a12 * b3;
	out[1] = a1 * b0 + a5 * b1 + a9 * b2 + a13 * b3;
	out[2] = a2 * b0 + a6 * b1 + a10 * b2 + a14 * b3;
	out[3] = a3 * b0 + a7 * b1 + a11 * b2 + a15 * b3;
	b0 = y[4];
	b1 = y[5];
	b2 = y[6];
	b3 = y[7];
	out[4] = a0 * b0 + a4 * b1 + a8 * b2 + a12 * b3;
	out[5] = a1 * b0 + a5 * b1 + a9 * b2 + a13 * b3;
	out[6] = a2 * b0 + a6 * b1 + a10 * b2 + a14 * b3;
	out[7] = a3 * b0 + a7 * b1 + a11 * b2 + a15 * b3;
	b0 = y[8];
	b1 = y[9];
	b2 = y[10];
	b3 = y[11];
	out[8] = a0 * b0 + a4 * b1 + a8 * b2 + a12 * b3;
	out[9] = a1 * b0 + a5 * b1 + a9 * b2 + a13 * b3;
	out[10] = a2 * b0 + a6 * b1 + a10 * b2 + a14 * b3;
	out[11] = a3 * b0 + a7 * b1 + a11 * b2 + a15 * b3;
	b0 = y[12];
	b1 = y[13];
	b2 = y[14];
	b3 = y[15];
	out[12] = a0 * b0 + a4 * b1 + a8 * b2 + a12 * b3;
	out[13] = a1 * b0 + a5 * b1 + a9 * b2 + a13 * b3;
	out[14] = a2 * b0 + a6 * b1 + a10 * b2 + a14 * b3;
	out[15] = a3 * b0 + a7 * b1 + a11 * b2 + a15 * b3;
	return out;
}
/** 4x4 column-major identity. */
function fgMat4Identity() {
	const out = /* @__PURE__ */ new Float32Array(16);
	out[0] = 1;
	out[5] = 1;
	out[10] = 1;
	out[15] = 1;
	return out;
}
/**
* Invert a matrix (glTF `math/inverse`). Returns the identity when singular.
* Supports `FgMatrix2D`, `FgMatrix3D`, and `Mat4` (local column-major invert).
*/
function fgInvertMatrix(m) {
	if (isFgMatrix2D(m)) {
		const mm = m.m;
		const det = mm[0] * mm[3] - mm[1] * mm[2];
		if (Math.abs(det) < 1e-10) return fgMatrix2D();
		const d = 1 / det;
		return fgMatrix2D([
			mm[3] * d,
			-mm[1] * d,
			-mm[2] * d,
			mm[0] * d
		]);
	}
	if (isFgMatrix3D(m)) {
		const mm = m.m;
		const det = mm[0] * (mm[4] * mm[8] - mm[7] * mm[5]) - mm[3] * (mm[1] * mm[8] - mm[7] * mm[2]) + mm[6] * (mm[1] * mm[5] - mm[4] * mm[2]);
		if (Math.abs(det) < 1e-10) return fgMatrix3D();
		const d = 1 / det;
		return fgMatrix3D([
			(mm[4] * mm[8] - mm[7] * mm[5]) * d,
			-(mm[1] * mm[8] - mm[7] * mm[2]) * d,
			(mm[1] * mm[5] - mm[4] * mm[2]) * d,
			-(mm[3] * mm[8] - mm[6] * mm[5]) * d,
			(mm[0] * mm[8] - mm[6] * mm[2]) * d,
			-(mm[0] * mm[5] - mm[3] * mm[2]) * d,
			(mm[3] * mm[7] - mm[6] * mm[4]) * d,
			-(mm[0] * mm[7] - mm[6] * mm[1]) * d,
			(mm[0] * mm[4] - mm[3] * mm[1]) * d
		]);
	}
	if (isMat4(m)) return fgMat4Invert(m) ?? fgMat4Identity();
	return m;
}
/**
* Multiply two same-size matrices: `out = A × B` (standard matrix product).
* Supports `FgMatrix2D × FgMatrix2D`, `FgMatrix3D × FgMatrix3D`, and
* `Mat4 × Mat4` (local column-major multiply). (glTF `math/matMul`)
*/
function fgMatrixMultiplication(a, b) {
	if (isFgMatrix2D(a) && isFgMatrix2D(b)) {
		const am = a.m, bm = b.m;
		return fgMatrix2D([
			am[0] * bm[0] + am[2] * bm[1],
			am[1] * bm[0] + am[3] * bm[1],
			am[0] * bm[2] + am[2] * bm[3],
			am[1] * bm[2] + am[3] * bm[3]
		]);
	}
	if (isFgMatrix3D(a) && isFgMatrix3D(b)) {
		const am = a.m, bm = b.m;
		return fgMatrix3D([
			am[0] * bm[0] + am[3] * bm[1] + am[6] * bm[2],
			am[1] * bm[0] + am[4] * bm[1] + am[7] * bm[2],
			am[2] * bm[0] + am[5] * bm[1] + am[8] * bm[2],
			am[0] * bm[3] + am[3] * bm[4] + am[6] * bm[5],
			am[1] * bm[3] + am[4] * bm[4] + am[7] * bm[5],
			am[2] * bm[3] + am[5] * bm[4] + am[8] * bm[5],
			am[0] * bm[6] + am[3] * bm[7] + am[6] * bm[8],
			am[1] * bm[6] + am[4] * bm[7] + am[7] * bm[8],
			am[2] * bm[6] + am[5] * bm[7] + am[8] * bm[8]
		]);
	}
	if (isMat4(a) && isMat4(b)) return fgMat4Multiply(a, b);
	return a;
}
/**
* Compose a TRS `Mat4` from translation, rotation quaternion, and scale
* (glTF `math/matCompose`). Uses core `composeMat4` (column-major).
*/
function fgMatrixCompose(pos, quat, scale) {
	const p = isVec3(pos) ? pos : {
		x: 0,
		y: 0,
		z: 0
	};
	const q = isVec4(quat) ? quat : {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	};
	const s = isVec3(scale) ? scale : {
		x: 1,
		y: 1,
		z: 1
	};
	return composeMat4(p.x, p.y, p.z, q.x, q.y, q.z, q.w, s.x, s.y, s.z);
}
/**
* Decompose a `Mat4` into translation, rotation (unit quaternion), and scale
* (glTF `math/matDecompose`). Uses core `decomposeMat4`.
*
* Validity pre-check: the bottom row of the column-major matrix (`m[3]`, `m[7]`,
* `m[11]`, `m[15]`) must round to `[0, 0, 0, 1]` at 4 decimal places;
* otherwise `isValid = false` and zero/identity defaults are returned.
*/
function fgMatrixDecompose(m) {
	const zero = {
		x: 0,
		y: 0,
		z: 0
	};
	const identQ = {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	};
	const oneS = {
		x: 1,
		y: 1,
		z: 1
	};
	if (!isMat4(m)) return {
		position: zero,
		rotationQuaternion: identQ,
		scaling: oneS,
		isValid: false
	};
	const r0 = Math.round(m[3] * 1e4) / 1e4;
	const r1 = Math.round(m[7] * 1e4) / 1e4;
	const r2 = Math.round(m[11] * 1e4) / 1e4;
	const r3 = Math.round(m[15] * 1e4) / 1e4;
	if (r0 !== 0 || r1 !== 0 || r2 !== 0 || r3 !== 1) return {
		position: zero,
		rotationQuaternion: identQ,
		scaling: oneS,
		isValid: false
	};
	const { translation, rotation, scale } = decomposeMat4(m);
	return {
		position: translation,
		rotationQuaternion: rotation,
		scaling: scale,
		isValid: true
	};
}
/**
* Angle between two unit quaternions: `2 · acos(clamp(dot(a, b), −1, 1))`
* (glTF `math/quatAngleBetween`). Returns 0 for non-quaternion inputs.
*/
function fgAngleBetween(a, b) {
	if (isVec4(a) && isVec4(b)) {
		const d = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w));
		return 2 * Math.acos(d);
	}
	return 0;
}
/**
* Quaternion from axis and angle (glTF `math/quatFromAxisAngle`).
* Does NOT pre-normalize the axis (replicates BJS `Quaternion.RotationAxis`).
* Result: `[sin(θ/2)·axis, cos(θ/2)]`.
*/
function fgQuaternionFromAxisAngle(axis, angle) {
	const n = num(angle);
	if (!isVec3(axis) || Number.isNaN(n)) return {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	};
	const half = n / 2;
	const s = Math.sin(half);
	return {
		x: axis.x * s,
		y: axis.y * s,
		z: axis.z * s,
		w: Math.cos(half)
	};
}
/**
* Extract axis and angle from a unit quaternion (glTF `math/quatToAxisAngle`).
* `angle = 2·acos(w)`. If `sin(angle/2)` is near zero the axis defaults to
* `(1, 0, 0)`. Always sets `isValid = true` for a valid quaternion input.
*/
function fgAxisAngleFromQuaternion(q) {
	if (!isVec4(q)) return {
		axis: {
			x: 1,
			y: 0,
			z: 0
		},
		angle: 0,
		isValid: false
	};
	const w = Math.min(1, Math.max(-1, q.w));
	const angle = 2 * Math.acos(w);
	const s = Math.sqrt(Math.max(0, 1 - w * w));
	if (s < 1e-7) return {
		axis: {
			x: 1,
			y: 0,
			z: 0
		},
		angle,
		isValid: true
	};
	return {
		axis: {
			x: q.x / s,
			y: q.y / s,
			z: q.z / s
		},
		angle,
		isValid: true
	};
}
/**
* Quaternion that rotates direction `a` to direction `b` (glTF `math/quatFromDirections`).
* Assumes inputs are already unit vectors — does NOT pre-normalize.
* Computes `axis = cross(a, b)`, `angle = acos(clamp(dot(a,b), −1, 1))`,
* then `quatFromAxisAngle(axis, angle)`.
*/
function fgQuaternionFromDirections(a, b) {
	if (!isVec3(a) || !isVec3(b)) return {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	};
	const dot = dotVec3(a, b);
	if (Number.isFinite(dot) && dot > .999999) return {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	};
	if (Number.isFinite(dot) && dot < -.999999) {
		const axis = perpendicular(a);
		return {
			x: axis.x,
			y: axis.y,
			z: axis.z,
			w: 0
		};
	}
	const cross = crossVec3(a, b);
	const invLength = 1 / Math.hypot(cross.x, cross.y, cross.z);
	const axisScale = Math.sqrt(.5 - .5 * dot);
	return {
		x: cross.x * invLength * axisScale,
		y: cross.y * invLength * axisScale,
		z: cross.z * invLength * axisScale,
		w: Math.sqrt(.5 + .5 * dot)
	};
}
function quaternionFromBasis(m11, m12, m13, m21, m22, m23, m31, m32, m33) {
	const trace = m11 + m22 + m33;
	let s;
	if (trace > 0) {
		s = .5 / Math.sqrt(trace + 1);
		return {
			x: (m32 - m23) * s,
			y: (m13 - m31) * s,
			z: (m21 - m12) * s,
			w: .25 / s
		};
	}
	if (m11 > m22 && m11 > m33) {
		s = 2 * Math.sqrt(1 + m11 - m22 - m33);
		return {
			x: .25 * s,
			y: (m12 + m21) / s,
			z: (m13 + m31) / s,
			w: (m32 - m23) / s
		};
	}
	if (m22 > m33) {
		s = 2 * Math.sqrt(1 + m22 - m11 - m33);
		return {
			x: (m12 + m21) / s,
			y: .25 * s,
			z: (m23 + m32) / s,
			w: (m13 - m31) / s
		};
	}
	s = 2 * Math.sqrt(1 + m33 - m11 - m22);
	return {
		x: (m13 + m31) / s,
		y: (m23 + m32) / s,
		z: .25 * s,
		w: (m21 - m12) / s
	};
}
/** Quaternion whose local up/forward directions match the provided unit vectors. */
function fgQuaternionFromUpForward(up, forward) {
	if (!isVec3(up) || !isVec3(forward)) return {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	};
	let side = crossVec3(up, forward);
	const sideLength = Math.hypot(side.x, side.y, side.z);
	if (sideLength < SLERP_EPSILON) side = perpendicular(forward);
	else side = {
		x: side.x / sideLength,
		y: side.y / sideLength,
		z: side.z / sideLength
	};
	const correctedUp = crossVec3(forward, side);
	return quaternionFromBasis(side.x, correctedUp.x, forward.x, side.y, correctedUp.y, forward.y, side.z, correctedUp.z, forward.z);
}
var QUATERNION_ANGLE_ORDERS = [
	"xyz",
	"xzy",
	"yxz",
	"yzx",
	"zxy",
	"zyx"
];
/** Quaternion from intrinsic Tait-Bryan Euler angles (glTF `math/quatFromAngles`). */
function fgQuaternionFromAngles(x, y, z, order) {
	const angleX = num(x);
	const angleY = num(y);
	const angleZ = num(z);
	if (Number.isNaN(angleX) || Number.isNaN(angleY) || Number.isNaN(angleZ)) return {
		x: NaN,
		y: NaN,
		z: NaN,
		w: NaN
	};
	const qx = fgQuaternionFromAxisAngle({
		x: 1,
		y: 0,
		z: 0
	}, angleX);
	const qy = fgQuaternionFromAxisAngle({
		x: 0,
		y: 1,
		z: 0
	}, angleY);
	const qz = fgQuaternionFromAxisAngle({
		x: 0,
		y: 0,
		z: 1
	}, angleZ);
	const rotationOrder = typeof order === "string" && QUATERNION_ANGLE_ORDERS.includes(order) ? order : "yxz";
	const quaternions = {
		x: qx,
		y: qy,
		z: qz
	};
	return quatMul(quatMul(quaternions[rotationOrder[0]], quaternions[rotationOrder[1]]), quaternions[rotationOrder[2]]);
}
/** Convert linear sRGB scalar components to OkLCh. Hue is in radians. */
function fgRgbToOkLCh(r, g, b) {
	const red = num(r);
	const green = num(g);
	const blue = num(b);
	const long = .4122214708 * red + .5363325363 * green + .0514459929 * blue;
	const medium = .2119034982 * red + .6806995451 * green + .1073969566 * blue;
	const short = .0883024619 * red + .2817188376 * green + .6299787005 * blue;
	const lRoot = Math.cbrt(long);
	const mRoot = Math.cbrt(medium);
	const sRoot = Math.cbrt(short);
	const okL = .2104542553 * lRoot + .793617785 * mRoot - .0040720468 * sRoot;
	const okA = 1.9779984951 * lRoot - 2.428592205 * mRoot + .4505937099 * sRoot;
	const okB = .0259040371 * lRoot + .7827717662 * mRoot - .808675766 * sRoot;
	return {
		l: okL,
		c: Math.hypot(okA, okB),
		h: Math.atan2(okB, okA)
	};
}
/** Convert OkLCh scalar components to linear sRGB. Hue is in radians. */
function fgRgbFromOkLCh(l, c, h) {
	const lightness = num(l);
	const chroma = num(c);
	const hue = num(h);
	const okA = chroma * Math.cos(hue);
	const okB = chroma * Math.sin(hue);
	const lPrime = lightness + .3963377774 * okA + .2158037573 * okB;
	const mPrime = lightness - .1055613458 * okA - .0638541728 * okB;
	const sPrime = lightness - .0894841775 * okA - 1.291485548 * okB;
	const long = lPrime * lPrime * lPrime;
	const medium = mPrime * mPrime * mPrime;
	const short = sPrime * sPrime * sPrime;
	return {
		r: 4.0767416621 * long - 3.3077115913 * medium + .2309699292 * short,
		g: -1.2684380046 * long + 2.6097574011 * medium - .3413193965 * short,
		b: -.0041960863 * long - .7034186147 * medium + 1.707614701 * short
	};
}
export { fgAbs, fgAcos, fgAcosh, fgAdd, fgAnd, fgAngleBetween, fgAsin, fgAsinh, fgAsr, fgAtan, fgAtan2, fgAtanh, fgAxisAngleFromQuaternion, fgCbrt, fgCeil, fgClamp, fgClz, fgCombine2, fgCombine3, fgCombine4, fgCombineMatrix, fgCombineMatrix2D, fgCombineMatrix3D, fgConjugate, fgCos, fgCosh, fgCross, fgCtz, fgDegToRad, fgDeterminant, fgDiv, fgDot, fgEq, fgExp, fgExtract2, fgExtract3, fgExtract4, fgExtractMatrix, fgExtractMatrix2D, fgExtractMatrix3D, fgFloor, fgFract, fgGe, fgGt, fgInvertMatrix, fgIsInf, fgIsNaN, fgLe, fgLength, fgLog, fgLog10, fgLog2, fgLsl, fgLt, fgMatrixCompose, fgMatrixDecompose, fgMatrixMultiplication, fgMax, fgMin, fgMix, fgMul, fgNeg, fgNormalize, fgNot, fgOr, fgPopcnt, fgPow, fgQuatMul, fgQuatSlerp, fgQuaternionFromAngles, fgQuaternionFromAxisAngle, fgQuaternionFromDirections, fgQuaternionFromUpForward, fgRadToDeg, fgRandom, fgRem, fgRgbFromOkLCh, fgRgbToOkLCh, fgRotate2D, fgRotate3D, fgRound, fgSaturate, fgSign, fgSin, fgSinh, fgSmoothStep, fgSqrt, fgSub, fgTan, fgTanh, fgTransformVector, fgTranspose, fgTrunc, fgVectorSlerp, fgXor };

//# sourceMappingURL=fg-math.js.map