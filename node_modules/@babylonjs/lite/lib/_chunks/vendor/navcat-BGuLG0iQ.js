/**
* Clamp a value between min and max
*/
var clamp = (value, min, max) => {
	return Math.max(min, Math.min(max, value));
};
// ../../node_modules/.pnpm/mathcat@0.0.12/node_modules/mathcat/dist/vec2.js
/**
* Creates a new, empty vec2
*
* @returns a new 2D vector
*/
function create$4() {
	return [0, 0];
}
/**
* Copy the values from one vec2 to another
*
* @param out the receiving vector
* @param a the source vector
* @returns out
*/
function copy$1(out, a) {
	out[0] = a[0];
	out[1] = a[1];
	return out;
}
/**
* Set the components of a vec2 to the given values
*
* @param out the receiving vector
* @param x X component
* @param y Y component
* @returns out
*/
function set$2(out, x, y) {
	out[0] = x;
	out[1] = y;
	return out;
}
/**
* Adds two vec2's
*
* @param out the receiving vector
* @param a the first operand
* @param b the second operand
* @returns out
*/
function add$1(out, a, b) {
	out[0] = a[0] + b[0];
	out[1] = a[1] + b[1];
	return out;
}
/**
* Subtracts vector b from vector a
*
* @param out the receiving vector
* @param a the first operand
* @param b the second operand
* @returns out
*/
function subtract$1(out, a, b) {
	out[0] = a[0] - b[0];
	out[1] = a[1] - b[1];
	return out;
}
/**
* Calculates the euclidian distance between two vec2's
*
* @param a the first operand
* @param b the second operand
* @returns distance between a and b
*/
function distance$1(a, b) {
	const x = b[0] - a[0];
	const y = b[1] - a[1];
	return Math.sqrt(x * x + y * y);
}
/**
* Calculates the dot product of two vec2's
*
* @param a the first operand
* @param b the second operand
* @returns dot product of a and b
*/
function dot$1(a, b) {
	return a[0] * b[0] + a[1] * b[1];
}
/**
* Returns whether or not the vectors have approximately the same elements in the same position.
*
* @param a The first vector.
* @param b The second vector.
* @returns True if the vectors are equal, false otherwise.
*/
function equals$1(a, b) {
	const a0 = a[0];
	const a1 = a[1];
	const b0 = b[0];
	const b1 = b[1];
	return Math.abs(a0 - b0) <= 1e-6 * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= 1e-6 * Math.max(1, Math.abs(a1), Math.abs(b1));
}
/**
* Returns whether or not the vector is finite
* @param a vector to test
* @returns whether or not the vector is finite
*/
function finite$1(a) {
	return Number.isFinite(a[0]) && Number.isFinite(a[1]);
}
// ../../node_modules/.pnpm/mathcat@0.0.12/node_modules/mathcat/dist/vec3.js
/**
* Creates a new, empty vec3
*
* @returns a new 3D vector
*/
function create$3() {
	return [
		0,
		0,
		0
	];
}
/**
* Creates a new vec3 initialized with values from an existing vector
*
* @param a vector to clone
* @returns a new 3D vector
*/
function clone$1(a) {
	const out = [
		0,
		0,
		0
	];
	out[0] = a[0];
	out[1] = a[1];
	out[2] = a[2];
	return out;
}
/**
* Copy the values from one vec3 to another
*
* @param out the receiving vector
* @param a the source vector
* @returns out
*/
function copy(out, a) {
	out[0] = a[0];
	out[1] = a[1];
	out[2] = a[2];
	return out;
}
/**
* Set the components of a vec3 to the given values
*
* @param out the receiving vector
* @param x X component
* @param y Y component
* @param z Z component
* @returns out
*/
function set$1(out, x, y, z) {
	out[0] = x;
	out[1] = y;
	out[2] = z;
	return out;
}
/**
* Sets the components of a vec3 from a buffer
* @param out the receiving vector
* @param buffer the source buffer
* @param startIndex the starting index in the buffer
* @returns out
*/
function fromBuffer(out, buffer, startIndex) {
	out[0] = buffer[startIndex];
	out[1] = buffer[startIndex + 1];
	out[2] = buffer[startIndex + 2];
	return out;
}
/**
* Adds two vec3's
*
* @param out the receiving vector
* @param a the first operand
* @param b the second operand
* @returns out
*/
function add(out, a, b) {
	out[0] = a[0] + b[0];
	out[1] = a[1] + b[1];
	out[2] = a[2] + b[2];
	return out;
}
/**
* Subtracts vector b from vector a
*
* @param out the receiving vector
* @param a the first operand
* @param b the second operand
* @returns out
*/
function subtract(out, a, b) {
	out[0] = a[0] - b[0];
	out[1] = a[1] - b[1];
	out[2] = a[2] - b[2];
	return out;
}
/**
* Returns the minimum of two vec3's
*
* @param out the receiving vector
* @param a the first operand
* @param b the second operand
* @returns out
*/
function min$1(out, a, b) {
	out[0] = Math.min(a[0], b[0]);
	out[1] = Math.min(a[1], b[1]);
	out[2] = Math.min(a[2], b[2]);
	return out;
}
/**
* Returns the maximum of two vec3's
*
* @param out the receiving vector
* @param a the first operand
* @param b the second operand
* @returns out
*/
function max$1(out, a, b) {
	out[0] = Math.max(a[0], b[0]);
	out[1] = Math.max(a[1], b[1]);
	out[2] = Math.max(a[2], b[2]);
	return out;
}
/**
* Scales a vec3 by a scalar number
*
* @param out the receiving vector
* @param a the vector to scale
* @param b amount to scale the vector by
* @returns out
*/
function scale(out, a, b) {
	out[0] = a[0] * b;
	out[1] = a[1] * b;
	out[2] = a[2] * b;
	return out;
}
/**
* Adds two vec3's after scaling the second operand by a scalar value
*
* @param out the receiving vector
* @param a the first operand
* @param b the second operand
* @param scale the amount to scale b by before adding
* @returns out
*/
function scaleAndAdd(out, a, b, scale) {
	out[0] = a[0] + b[0] * scale;
	out[1] = a[1] + b[1] * scale;
	out[2] = a[2] + b[2] * scale;
	return out;
}
/**
* Calculates the euclidian distance between two vec3's
*
* @param a the first operand
* @param b the second operand
* @returns distance between a and b
*/
function distance(a, b) {
	const x = b[0] - a[0];
	const y = b[1] - a[1];
	const z = b[2] - a[2];
	return Math.sqrt(x * x + y * y + z * z);
}
/**
* Calculates the squared length of a vec3
*
* @param a vector to calculate squared length of
* @returns squared length of a
*/
function squaredLength(a) {
	const x = a[0];
	const y = a[1];
	const z = a[2];
	return x * x + y * y + z * z;
}
/**
* Normalize a vec3
*
* @param out the receiving vector
* @param a vector to normalize
* @returns out
*/
function normalize(out, a) {
	const x = a[0];
	const y = a[1];
	const z = a[2];
	let len = x * x + y * y + z * z;
	if (len > 0) len = 1 / Math.sqrt(len);
	out[0] = a[0] * len;
	out[1] = a[1] * len;
	out[2] = a[2] * len;
	return out;
}
/**
* Calculates the dot product of two vec3's
*
* @param a the first operand
* @param b the second operand
* @returns dot product of a and b
*/
function dot(a, b) {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
* Computes the cross product of two vec3's
*
* @param out the receiving vector
* @param a the first operand
* @param b the second operand
* @returns out
*/
function cross(out, a, b) {
	const ax = a[0];
	const ay = a[1];
	const az = a[2];
	const bx = b[0];
	const by = b[1];
	const bz = b[2];
	out[0] = ay * bz - az * by;
	out[1] = az * bx - ax * bz;
	out[2] = ax * by - ay * bx;
	return out;
}
/**
* Performs a linear interpolation between two vec3's
*
* @param out the receiving vector
* @param a the first operand
* @param b the second operand
* @param t interpolation amount, in the range [0-1], between the two inputs
* @returns out
*/
function lerp(out, a, b, t) {
	const ax = a[0];
	const ay = a[1];
	const az = a[2];
	out[0] = ax + t * (b[0] - ax);
	out[1] = ay + t * (b[1] - ay);
	out[2] = az + t * (b[2] - az);
	return out;
}
/**
* Returns whether or not the vectors have approximately the same elements in the same position.
*
* @param a The first vector.
* @param b The second vector.
* @returns True if the vectors are equal, false otherwise.
*/
function equals(a, b) {
	const a0 = a[0];
	const a1 = a[1];
	const a2 = a[2];
	const b0 = b[0];
	const b1 = b[1];
	const b2 = b[2];
	return Math.abs(a0 - b0) <= 1e-6 * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= 1e-6 * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= 1e-6 * Math.max(1, Math.abs(a2), Math.abs(b2));
}
/**
* Returns whether or not the vector is finite
* @param a vector to test
* @returns whether or not the vector is finite
*/
function finite(a) {
	return Number.isFinite(a[0]) && Number.isFinite(a[1]) && Number.isFinite(a[2]);
}
/**
* Alias for {@link subtract}
*/
var sub = subtract;
// ../../node_modules/.pnpm/mathcat@0.0.12/node_modules/mathcat/dist/circle.js
function create$1() {
	return {
		center: [0, 0],
		radius: 0
	};
}
// ../../node_modules/.pnpm/mathcat@0.0.12/node_modules/mathcat/dist/box3.js
/**
* Create a new empty Box3 with "min" set to positive infinity and "max" set to negative infinity
* @returns A new Box3
*/
function create$2() {
	return [
		Number.POSITIVE_INFINITY,
		Number.POSITIVE_INFINITY,
		Number.POSITIVE_INFINITY,
		Number.NEGATIVE_INFINITY,
		Number.NEGATIVE_INFINITY,
		Number.NEGATIVE_INFINITY
	];
}
/**
* Clones a Box3
* @param box - A Box3 to clone
* @returns a clone of box
*/
function clone(box) {
	return [
		box[0],
		box[1],
		box[2],
		box[3],
		box[4],
		box[5]
	];
}
/**
* Sets the min and max values of a Box3
* @param out - The output Box3
* @param minX - The minimum X coordinate
* @param minY - The minimum Y coordinate
* @param minZ - The minimum Z coordinate
* @param maxX - The maximum X coordinate
* @param maxY - The maximum Y coordinate
* @param maxZ - The maximum Z coordinate
* @returns The updated Box3
*/
function set(out, minX, minY, minZ, maxX, maxY, maxZ) {
	out[0] = minX;
	out[1] = minY;
	out[2] = minZ;
	out[3] = maxX;
	out[4] = maxY;
	out[5] = maxZ;
	return out;
}
/**
* Extracts the minimum corner of a Box3
* @param out - The output Vec3 for the minimum corner
* @param box - The input Box3
* @returns The minimum corner
*/
function min(out, box) {
	out[0] = box[0];
	out[1] = box[1];
	out[2] = box[2];
	return out;
}
/**
* Extracts the maximum corner of a Box3
* @param out - The output Vec3 for the maximum corner
* @param box - The input Box3
* @returns The maximum corner
*/
function max(out, box) {
	out[0] = box[3];
	out[1] = box[4];
	out[2] = box[5];
	return out;
}
/**
* Check whether two bounding boxes intersect
*/
function intersectsBox3(boxA, boxB) {
	return boxA[0] <= boxB[3] && boxA[3] >= boxB[0] && boxA[1] <= boxB[4] && boxA[4] >= boxB[1] && boxA[2] <= boxB[5] && boxA[5] >= boxB[2];
}
new Array(27);
// ../../node_modules/.pnpm/mathcat@0.0.12/node_modules/mathcat/dist/circumcircle.js
var _circumcircleV1 = /*@__PURE__*/ create$4();
var _circumcircleV2 = /*@__PURE__*/ create$4();
var _circumcircleV3 = /*@__PURE__*/ create$4();
/**
* Calculates the circumcircle of three points and stores the center in the output parameter.
* @param out The circle to store the result in
* @param triangle The triangle defined by three points
* @returns
*/
function circumcircle(out, a, b, c) {
	const v1 = _circumcircleV1;
	const v2 = _circumcircleV2;
	const v3 = _circumcircleV3;
	set$2(v1, 0, 0);
	subtract$1(v2, b, a);
	subtract$1(v3, c, a);
	subtract$1(v2, v2, v1);
	subtract$1(v3, v3, v1);
	const cp = v2[0] * v3[1] - v2[1] * v3[0];
	if (Math.abs(cp) > 1e-6) {
		const v1Sq = dot$1(_circumcircleV1, _circumcircleV1);
		const v2Sq = dot$1(_circumcircleV2, _circumcircleV2);
		const v3Sq = dot$1(_circumcircleV3, _circumcircleV3);
		out.center[0] = (v1Sq * (v2[1] - v3[1]) + v2Sq * (v3[1] - v1[1]) + v3Sq * (v1[1] - v2[1])) / (2 * cp);
		out.center[1] = (v1Sq * (v3[0] - v2[0]) + v2Sq * (v1[0] - v3[0]) + v3Sq * (v2[0] - v1[0])) / (2 * cp);
		const r = distance$1(out.center, v1);
		add$1(out.center, out.center, a);
		out.radius = r;
		return out;
	}
	copy$1(out.center, a);
	out.radius = 0;
	return out;
}
// ../../node_modules/.pnpm/navcat@0.4.1/node_modules/navcat/dist/index.js
var BuildContextLogType;
(function(BuildContextLogType) {
	BuildContextLogType[BuildContextLogType["INFO"] = 0] = "INFO";
	BuildContextLogType[BuildContextLogType["WARNING"] = 1] = "WARNING";
	BuildContextLogType[BuildContextLogType["ERROR"] = 2] = "ERROR";
})(BuildContextLogType || (BuildContextLogType = {}));
var create = () => {
	return {
		logs: [],
		times: [],
		_startTimes: {}
	};
};
var start = (context, name) => {
	context._startTimes[name] = performance.now();
};
var end = (context, name) => {
	const duration = performance.now() - context._startTimes[name];
	delete context._startTimes[name];
	context.times.push({
		name,
		duration
	});
};
var info = (context, message) => {
	context.logs.push({
		type: BuildContextLogType.INFO,
		message
	});
};
var warn = (context, message) => {
	context.logs.push({
		type: BuildContextLogType.WARNING,
		message
	});
};
var error = (context, message) => {
	context.logs.push({
		type: BuildContextLogType.ERROR,
		message
	});
};
var BuildContext = {
	create,
	start,
	end,
	info,
	warn,
	error
};
var DIR_OFFSETS = [
	[-1, 0],
	[0, 1],
	[1, 0],
	[0, -1]
];
var getDirOffsetX = (dir) => {
	return DIR_OFFSETS[dir & 3][0];
};
var getDirOffsetY = (dir) => {
	return DIR_OFFSETS[dir & 3][1];
};
var getDirForOffset = (x, y) => {
	for (let i = 0; i < DIR_OFFSETS.length; i++) if (DIR_OFFSETS[i][0] === x && DIR_OFFSETS[i][1] === y) return i;
	return 0;
};
var BORDER_VERTEX = 65536;
var CONTOUR_REG_MASK = 65535;
var AREA_BORDER = 131072;
var BORDER_REG = 32768;
var MAX_HEIGHT = 65535;
/**
* A flag that indicates that an entity links to an external enttity.
* (E.g. A polygon edge is a portal that links to another polygon.)
*/
var POLY_NEIS_FLAG_EXT_LINK = 32768;
var EPS = 1e-6;
/**
* Tests if a point is inside a polygon in 2D (XZ plane)
*/
var pointInPoly = (point, vertices, nVertices) => {
	let inside = false;
	const x = point[0];
	const z = point[2];
	for (let l = nVertices, i = 0, j = l - 1; i < l; j = i++) {
		const xj = vertices[j * 3], zj = vertices[j * 3 + 2], xi = vertices[i * 3], zi = vertices[i * 3 + 2];
		const where = (zi - zj) * (x - xi) - (xi - xj) * (z - zi);
		if (zj < zi) {
			if (z >= zj && z < zi) {
				if (where === 0) return true;
				if (where > 0) {
					if (z === zj) {
						if (z > vertices[(j === 0 ? l - 1 : j - 1) * 3 + 2]) inside = !inside;
					} else inside = !inside;
				}
			}
		} else if (zi < zj) {
			if (z > zi && z <= zj) {
				if (where === 0) return true;
				if (where < 0) {
					if (z === zj) {
						if (z < vertices[(j === 0 ? l - 1 : j - 1) * 3 + 2]) inside = !inside;
					} else inside = !inside;
				}
			}
		} else if (z === zi && (x >= xj && x <= xi || x >= xi && x <= xj)) return true;
	}
	return inside;
};
var _distPtTriV0 = create$3();
var _distPtTriV1 = create$3();
var _distPtTriV2 = create$3();
var _distPtTriVec0 = create$4();
var _distPtTriVec1 = create$4();
var _distPtTriVec2 = create$4();
var distPtTri = (p, a, b, c) => {
	const v0 = _distPtTriV0;
	const v1 = _distPtTriV1;
	const v2 = _distPtTriV2;
	subtract(v0, c, a);
	subtract(v1, b, a);
	subtract(v2, p, a);
	_distPtTriVec0[0] = v0[0];
	_distPtTriVec0[1] = v0[2];
	_distPtTriVec1[0] = v1[0];
	_distPtTriVec1[1] = v1[2];
	_distPtTriVec2[0] = v2[0];
	_distPtTriVec2[1] = v2[2];
	const dot00 = dot$1(_distPtTriVec0, _distPtTriVec0);
	const dot01 = dot$1(_distPtTriVec0, _distPtTriVec1);
	const dot02 = dot$1(_distPtTriVec0, _distPtTriVec2);
	const dot11 = dot$1(_distPtTriVec1, _distPtTriVec1);
	const dot12 = dot$1(_distPtTriVec1, _distPtTriVec2);
	const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
	const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
	const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
	if (u >= -1e-4 && v >= -1e-4 && u + v <= 1.0001) {
		const y = a[1] + v0[1] * u + v1[1] * v;
		return Math.abs(y - p[1]);
	}
	return Number.MAX_VALUE;
};
var _distPtSegP = create$3();
var _distPtSegQ = create$3();
var distancePtSeg$1 = (pt, p, q) => {
	const pq = _distPtSegP;
	const d_vec = _distPtSegQ;
	subtract(pq, q, p);
	subtract(d_vec, pt, p);
	const d = dot(pq, pq);
	let t = dot(pq, d_vec);
	if (d > 0) t /= d;
	if (t < 0) t = 0;
	else if (t > 1) t = 1;
	scale(pq, pq, t);
	add(pq, p, pq);
	subtract(pq, pq, pt);
	return dot(pq, pq);
};
var createDistPtSeg2dResult = () => ({
	dist: 0,
	t: 0
});
var distancePtSeg2d = (out, pt, p, q) => {
	const pqx = q[0] - p[0];
	const pqz = q[2] - p[2];
	const dx = pt[0] - p[0];
	const dz = pt[2] - p[2];
	const d = pqx * pqx + pqz * pqz;
	let t = pqx * dx + pqz * dz;
	if (d > 0) t /= d;
	if (t < 0) t = 0;
	else if (t > 1) t = 1;
	const closeDx = p[0] + t * pqx - pt[0];
	const closeDz = p[2] + t * pqz - pt[2];
	out.dist = closeDx * closeDx + closeDz * closeDz;
	out.t = t;
	return out;
};
var createDistancePtSegSqr2dResult = () => ({
	distSqr: 0,
	t: 0
});
var distancePtSegSqr2d = (out, pt, p, q) => {
	const pqx = q[0] - p[0];
	const pqz = q[2] - p[2];
	const dx = pt[0] - p[0];
	const dz = pt[2] - p[2];
	const d = pqx * pqx + pqz * pqz;
	let t = pqx * dx + pqz * dz;
	if (d > 0) t /= d;
	if (t < 0) t = 0;
	else if (t > 1) t = 1;
	const closestX = p[0] + t * pqx;
	const closestZ = p[2] + t * pqz;
	const distX = closestX - pt[0];
	const distZ = closestZ - pt[2];
	out.distSqr = distX * distX + distZ * distZ;
	out.t = t;
	return out;
};
var _distPtTriA = create$3();
var _distPtTriB = create$3();
var _distPtTriC = create$3();
var distToTriMesh = (p, verts, tris, ntris) => {
	let dmin = Number.MAX_VALUE;
	for (let i = 0; i < ntris; ++i) {
		const va = tris[i * 4 + 0] * 3;
		const vb = tris[i * 4 + 1] * 3;
		const vc = tris[i * 4 + 2] * 3;
		fromBuffer(_distPtTriA, verts, va);
		fromBuffer(_distPtTriB, verts, vb);
		fromBuffer(_distPtTriC, verts, vc);
		const d = distPtTri(p, _distPtTriA, _distPtTriB, _distPtTriC);
		if (d < dmin) dmin = d;
	}
	if (dmin === Number.MAX_VALUE) return -1;
	return dmin;
};
var _distToPolyVj = create$3();
var _distToPolyVi = create$3();
var _distToPoly_distPtSeg2dResult = createDistPtSeg2dResult();
var distToPoly = (nvert, verts, p) => {
	let dmin = Number.MAX_VALUE;
	let c = 0;
	for (let i = 0, j = nvert - 1; i < nvert; j = i++) {
		const vi = i * 3;
		const vj = j * 3;
		if (verts[vi + 2] > p[2] !== verts[vj + 2] > p[2] && p[0] < (verts[vj] - verts[vi]) * (p[2] - verts[vi + 2]) / (verts[vj + 2] - verts[vi + 2]) + verts[vi]) c = c === 0 ? 1 : 0;
		fromBuffer(_distToPolyVj, verts, vj);
		fromBuffer(_distToPolyVi, verts, vi);
		distancePtSeg2d(_distToPoly_distPtSeg2dResult, p, _distToPolyVj, _distToPolyVi);
		dmin = Math.min(dmin, _distToPoly_distPtSeg2dResult.dist);
	}
	return c ? -dmin : dmin;
};
/**
* Calculates the closest height point on a triangle using barycentric coordinates.
* @param p The point to project
* @param a First triangle vertex
* @param b Second triangle vertex
* @param c Third triangle vertex
* @returns Height at position, or NaN if point is not inside triangle
*/
var closestHeightPointTriangle = (p, a, b, c) => {
	const v0x = c[0] - a[0];
	const v0y = c[1] - a[1];
	const v0z = c[2] - a[2];
	const v1x = b[0] - a[0];
	const v1y = b[1] - a[1];
	const v1z = b[2] - a[2];
	const v2x = p[0] - a[0];
	const v2z = p[2] - a[2];
	let denom = v0x * v1z - v0z * v1x;
	if (Math.abs(denom) < EPS) return NaN;
	let u = v1z * v2x - v1x * v2z;
	let v = v0x * v2z - v0z * v2x;
	if (denom < 0) {
		denom = -denom;
		u = -u;
		v = -v;
	}
	if (u >= 0 && v >= 0 && u + v <= denom) return a[1] + (v0y * u + v1y * v) / denom;
	return NaN;
};
var _overlapSegAB = create$4();
var _overlapSegAD = create$4();
var _overlapSegAC = create$4();
var _overlapSegCD = create$4();
var _overlapSegCA = create$4();
var overlapSegSeg2d = (a, b, c, d) => {
	const ab = _overlapSegAB;
	const ad = _overlapSegAD;
	const ac = _overlapSegAC;
	subtract$1(ab, b, a);
	subtract$1(ad, d, a);
	const a1 = ab[0] * ad[1] - ab[1] * ad[0];
	subtract$1(ac, c, a);
	const a2 = ab[0] * ac[1] - ab[1] * ac[0];
	if (a1 * a2 < 0) {
		const cd = _overlapSegCD;
		const ca = _overlapSegCA;
		subtract$1(cd, d, c);
		subtract$1(ca, a, c);
		const a3 = cd[0] * ca[1] - cd[1] * ca[0];
		if (a3 * (a3 + a2 - a1) < 0) return true;
	}
	return false;
};
/**
* 2D signed area in XZ plane (positive if c is to the left of ab)
*/
var triArea2D = (a, b, c) => {
	const abx = b[0] - a[0];
	const abz = b[2] - a[2];
	const acx = c[0] - a[0];
	const acz = c[2] - a[2];
	return acx * abz - abx * acz;
};
var createIntersectSegSeg2DResult = () => ({
	hit: false,
	s: 0,
	t: 0
});
/**
* Segment-segment intersection in XZ plane.
* Returns { hit, s, t } where
*  P = a + s*(b-a) and Q = c + t*(d-c). Hit only if both s and t are within [0,1].
*/
var intersectSegSeg2D = (out, a, b, c, d) => {
	const bax = b[0] - a[0];
	const baz = b[2] - a[2];
	const dcx = d[0] - c[0];
	const dcz = d[2] - c[2];
	const acx = a[0] - c[0];
	const acz = a[2] - c[2];
	const denom = dcz * bax - dcx * baz;
	if (Math.abs(denom) < 1e-12) {
		out.hit = false;
		out.s = 0;
		out.t = 0;
		return out;
	}
	const s = (dcx * acz - dcz * acx) / denom;
	const t = (bax * acz - baz * acx) / denom;
	out.hit = !(s < 0 || s > 1 || t < 0 || t > 1);
	out.s = s;
	out.t = t;
	return out;
};
var _polyMinExtentPt = create$3();
var _polyMinExtentP1 = create$3();
var _polyMinExtentP2 = create$3();
var _polyMinExtent_distPtSeg2dResult = createDistPtSeg2dResult();
var polyMinExtent = (verts, nverts) => {
	let minDist = Number.MAX_VALUE;
	for (let i = 0; i < nverts; i++) {
		const ni = (i + 1) % nverts;
		const p1 = i * 3;
		const p2 = ni * 3;
		let maxEdgeDist = 0;
		for (let j = 0; j < nverts; j++) {
			if (j === i || j === ni) continue;
			fromBuffer(_polyMinExtentPt, verts, j * 3);
			fromBuffer(_polyMinExtentP1, verts, p1);
			fromBuffer(_polyMinExtentP2, verts, p2);
			distancePtSeg2d(_polyMinExtent_distPtSeg2dResult, _polyMinExtentPt, _polyMinExtentP1, _polyMinExtentP2);
			maxEdgeDist = Math.max(maxEdgeDist, _polyMinExtent_distPtSeg2dResult.dist);
		}
		minDist = Math.min(minDist, maxEdgeDist);
	}
	return Math.sqrt(minDist);
};
/**
* Derives the xz-plane 2D perp product of the two vectors. (uz*vx - ux*vz)
* The vectors are projected onto the xz-plane, so the y-values are ignored.
* @param u The LHV vector [(x, y, z)]
* @param v The RHV vector [(x, y, z)]
* @returns The perp dot product on the xz-plane.
*/
var vperp2D = (u, v) => {
	return u[2] * v[0] - u[0] * v[2];
};
var createIntersectSegmentPoly2DResult = () => ({
	intersects: false,
	tmin: 0,
	tmax: 0,
	segMin: -1,
	segMax: -1
});
var _intersectSegmentPoly2DVi = create$3();
var _intersectSegmentPoly2DVj = create$3();
var _intersectSegmentPoly2DDir = create$3();
var _intersectSegmentPoly2DToStart = create$3();
var _intersectSegmentPoly2DEdge = create$3();
/**
* Intersects a segment with a polygon in 2D (ignoring Y).
* Uses the Sutherland-Hodgman clipping algorithm approach.
*
* @param result The result object to store intersection data
* @param startPosition Start position of the segment
* @param endPosition End position of the segment
* @param verts Polygon vertices as flat array [x,y,z,x,y,z,...]
* @param nv Number of vertices in the polygon
*/
var intersectSegmentPoly2D = (result, startPosition, endPosition, nv, verts) => {
	result.intersects = false;
	result.tmin = 0;
	result.tmax = 1;
	result.segMin = -1;
	result.segMax = -1;
	const dir = subtract(_intersectSegmentPoly2DDir, endPosition, startPosition);
	const vi = _intersectSegmentPoly2DVi;
	const vj = _intersectSegmentPoly2DVj;
	const edge = _intersectSegmentPoly2DEdge;
	const diff = _intersectSegmentPoly2DToStart;
	for (let i = 0, j = nv - 1; i < nv; j = i, i++) {
		fromBuffer(vi, verts, i * 3);
		fromBuffer(vj, verts, j * 3);
		subtract(edge, vi, vj);
		subtract(diff, startPosition, vj);
		const n = vperp2D(edge, diff);
		const d = vperp2D(dir, edge);
		if (Math.abs(d) < EPS) {
			if (n < 0) return result;
			continue;
		}
		const t = n / d;
		if (d < 0) {
			if (t > result.tmin) {
				result.tmin = t;
				result.segMin = j;
				if (result.tmin > result.tmax) return result;
			}
		} else if (t < result.tmax) {
			result.tmax = t;
			result.segMax = j;
			if (result.tmax < result.tmin) return result;
		}
	}
	result.intersects = true;
	return result;
};
/**
* Helper function to set connection data in a span
*/
var setCon = (span, dir, layerIndex) => {
	const shift = dir * 6;
	const mask = 63 << shift;
	span.con = span.con & ~mask | (layerIndex & 63) << shift;
};
/**
* Helper function to get connection data from a span
*/
var getCon = (span, dir) => {
	const shift = dir * 6;
	return span.con >> shift & 63;
};
/**
* Count the number of walkable spans in the heightfield
*/
var getHeightFieldSpanCount = (heightfield) => {
	const numCols = heightfield.width * heightfield.height;
	let spanCount = 0;
	for (let columnIndex = 0; columnIndex < numCols; ++columnIndex) {
		let span = heightfield.spans[columnIndex];
		while (span !== null) {
			if (span.area !== 0) spanCount++;
			span = span.next || null;
		}
	}
	return spanCount;
};
var buildCompactHeightfield = (ctx, walkableHeightVoxels, walkableClimbVoxels, heightfield) => {
	const xSize = heightfield.width;
	const zSize = heightfield.height;
	const spanCount = getHeightFieldSpanCount(heightfield);
	const compactHeightfield = {
		width: xSize,
		height: zSize,
		spanCount,
		walkableHeightVoxels,
		walkableClimbVoxels,
		borderSize: 0,
		maxDistance: 0,
		maxRegions: 0,
		bounds: clone(heightfield.bounds),
		cellSize: heightfield.cellSize,
		cellHeight: heightfield.cellHeight,
		cells: new Array(xSize * zSize),
		spans: new Array(spanCount),
		areas: new Array(spanCount),
		distances: new Array(spanCount).fill(0)
	};
	compactHeightfield.bounds[4] += walkableHeightVoxels * heightfield.cellHeight;
	for (let i = 0; i < xSize * zSize; i++) compactHeightfield.cells[i] = {
		index: 0,
		count: 0
	};
	for (let i = 0; i < spanCount; i++) {
		compactHeightfield.spans[i] = {
			y: 0,
			region: 0,
			con: 0,
			h: 0
		};
		compactHeightfield.areas[i] = 0;
	}
	let currentCellIndex = 0;
	const numColumns = xSize * zSize;
	for (let columnIndex = 0; columnIndex < numColumns; ++columnIndex) {
		let span = heightfield.spans[columnIndex];
		if (span === null) continue;
		const cell = compactHeightfield.cells[columnIndex];
		cell.index = currentCellIndex;
		cell.count = 0;
		while (span !== null) {
			if (span.area !== 0) {
				const bot = span.max;
				const top = span.next ? span.next.min : MAX_HEIGHT;
				compactHeightfield.spans[currentCellIndex].y = Math.min(Math.max(bot, 0), 65535);
				compactHeightfield.spans[currentCellIndex].h = Math.min(Math.max(top - bot, 0), 255);
				compactHeightfield.areas[currentCellIndex] = span.area;
				currentCellIndex++;
				cell.count++;
			}
			span = span.next || null;
		}
	}
	let maxLayerIndex = 0;
	const zStride = xSize;
	for (let z = 0; z < zSize; ++z) for (let x = 0; x < xSize; ++x) {
		const cell = compactHeightfield.cells[x + z * zStride];
		for (let i = cell.index; i < cell.index + cell.count; ++i) {
			const span = compactHeightfield.spans[i];
			for (let dir = 0; dir < 4; ++dir) {
				setCon(span, dir, 63);
				const neighborX = x + DIR_OFFSETS[dir][0];
				const neighborZ = z + DIR_OFFSETS[dir][1];
				if (neighborX < 0 || neighborZ < 0 || neighborX >= xSize || neighborZ >= zSize) continue;
				const neighborCell = compactHeightfield.cells[neighborX + neighborZ * zStride];
				for (let k = neighborCell.index; k < neighborCell.index + neighborCell.count; ++k) {
					const neighborSpan = compactHeightfield.spans[k];
					const bot = Math.max(span.y, neighborSpan.y);
					if (Math.min(span.y + span.h, neighborSpan.y + neighborSpan.h) - bot >= walkableHeightVoxels && Math.abs(neighborSpan.y - span.y) <= walkableClimbVoxels) {
						const layerIndex = k - neighborCell.index;
						if (layerIndex < 0 || layerIndex > 62) {
							maxLayerIndex = Math.max(maxLayerIndex, layerIndex);
							continue;
						}
						setCon(span, dir, layerIndex);
						break;
					}
				}
			}
		}
	}
	if (maxLayerIndex > 62) BuildContext.warn(ctx, `buildCompactHeightfield: Heightfield has too many layers ${maxLayerIndex} (max: 62)`);
	return compactHeightfield;
};
var MAX_DISTANCE = 255;
/**
* Computes a distance field for the compact heightfield.
* Each span gets a distance value representing how far it is from any boundary or obstacle.
* @returns A Uint8Array containing distance values for each span
*/
var computeDistanceToBoundary = (compactHeightfield) => {
	const xSize = compactHeightfield.width;
	const zSize = compactHeightfield.height;
	const zStride = xSize;
	const distanceToBoundary = new Uint8Array(compactHeightfield.spanCount);
	distanceToBoundary.fill(MAX_DISTANCE);
	for (let z = 0; z < zSize; ++z) for (let x = 0; x < xSize; ++x) {
		const cell = compactHeightfield.cells[x + z * zStride];
		for (let spanIndex = cell.index; spanIndex < cell.index + cell.count; ++spanIndex) {
			if (compactHeightfield.areas[spanIndex] === 0) {
				distanceToBoundary[spanIndex] = 0;
				continue;
			}
			const span = compactHeightfield.spans[spanIndex];
			let neighborCount = 0;
			for (let direction = 0; direction < 4; ++direction) {
				const neighborConnection = getCon(span, direction);
				if (neighborConnection === 63) break;
				const neighborX = x + DIR_OFFSETS[direction][0];
				const neighborZ = z + DIR_OFFSETS[direction][1];
				const neighborSpanIndex = compactHeightfield.cells[neighborX + neighborZ * zStride].index + neighborConnection;
				if (compactHeightfield.areas[neighborSpanIndex] === 0) break;
				neighborCount++;
			}
			if (neighborCount !== 4) distanceToBoundary[spanIndex] = 0;
		}
	}
	for (let z = 0; z < zSize; ++z) for (let x = 0; x < xSize; ++x) {
		const cell = compactHeightfield.cells[x + z * zStride];
		const maxSpanIndex = cell.index + cell.count;
		for (let spanIndex = cell.index; spanIndex < maxSpanIndex; ++spanIndex) {
			const span = compactHeightfield.spans[spanIndex];
			if (getCon(span, 0) !== 63) {
				const aX = x + DIR_OFFSETS[0][0];
				const aY = z + DIR_OFFSETS[0][1];
				const aIndex = compactHeightfield.cells[aX + aY * xSize].index + getCon(span, 0);
				const aSpan = compactHeightfield.spans[aIndex];
				let newDistance = Math.min(distanceToBoundary[aIndex] + 2, 255);
				if (newDistance < distanceToBoundary[spanIndex]) distanceToBoundary[spanIndex] = newDistance;
				if (getCon(aSpan, 3) !== 63) {
					const bX = aX + DIR_OFFSETS[3][0];
					const bY = aY + DIR_OFFSETS[3][1];
					const bIndex = compactHeightfield.cells[bX + bY * xSize].index + getCon(aSpan, 3);
					newDistance = Math.min(distanceToBoundary[bIndex] + 3, 255);
					if (newDistance < distanceToBoundary[spanIndex]) distanceToBoundary[spanIndex] = newDistance;
				}
			}
			if (getCon(span, 3) !== 63) {
				const aX = x + DIR_OFFSETS[3][0];
				const aY = z + DIR_OFFSETS[3][1];
				const aIndex = compactHeightfield.cells[aX + aY * xSize].index + getCon(span, 3);
				const aSpan = compactHeightfield.spans[aIndex];
				let newDistance = Math.min(distanceToBoundary[aIndex] + 2, 255);
				if (newDistance < distanceToBoundary[spanIndex]) distanceToBoundary[spanIndex] = newDistance;
				if (getCon(aSpan, 2) !== 63) {
					const bX = aX + DIR_OFFSETS[2][0];
					const bY = aY + DIR_OFFSETS[2][1];
					const bIndex = compactHeightfield.cells[bX + bY * xSize].index + getCon(aSpan, 2);
					newDistance = Math.min(distanceToBoundary[bIndex] + 3, 255);
					if (newDistance < distanceToBoundary[spanIndex]) distanceToBoundary[spanIndex] = newDistance;
				}
			}
		}
	}
	for (let z = zSize - 1; z >= 0; --z) for (let x = xSize - 1; x >= 0; --x) {
		const cell = compactHeightfield.cells[x + z * zStride];
		const maxSpanIndex = cell.index + cell.count;
		for (let spanIndex = cell.index; spanIndex < maxSpanIndex; ++spanIndex) {
			const span = compactHeightfield.spans[spanIndex];
			if (getCon(span, 2) !== 63) {
				const aX = x + DIR_OFFSETS[2][0];
				const aY = z + DIR_OFFSETS[2][1];
				const aIndex = compactHeightfield.cells[aX + aY * xSize].index + getCon(span, 2);
				const aSpan = compactHeightfield.spans[aIndex];
				let newDistance = Math.min(distanceToBoundary[aIndex] + 2, 255);
				if (newDistance < distanceToBoundary[spanIndex]) distanceToBoundary[spanIndex] = newDistance;
				if (getCon(aSpan, 1) !== 63) {
					const bX = aX + DIR_OFFSETS[1][0];
					const bY = aY + DIR_OFFSETS[1][1];
					const bIndex = compactHeightfield.cells[bX + bY * xSize].index + getCon(aSpan, 1);
					newDistance = Math.min(distanceToBoundary[bIndex] + 3, 255);
					if (newDistance < distanceToBoundary[spanIndex]) distanceToBoundary[spanIndex] = newDistance;
				}
			}
			if (getCon(span, 1) !== 63) {
				const aX = x + DIR_OFFSETS[1][0];
				const aY = z + DIR_OFFSETS[1][1];
				const aIndex = compactHeightfield.cells[aX + aY * xSize].index + getCon(span, 1);
				const aSpan = compactHeightfield.spans[aIndex];
				let newDistance = Math.min(distanceToBoundary[aIndex] + 2, 255);
				if (newDistance < distanceToBoundary[spanIndex]) distanceToBoundary[spanIndex] = newDistance;
				if (getCon(aSpan, 0) !== 63) {
					const bX = aX + DIR_OFFSETS[0][0];
					const bY = aY + DIR_OFFSETS[0][1];
					const bIndex = compactHeightfield.cells[bX + bY * xSize].index + getCon(aSpan, 0);
					newDistance = Math.min(distanceToBoundary[bIndex] + 3, 255);
					if (newDistance < distanceToBoundary[spanIndex]) distanceToBoundary[spanIndex] = newDistance;
				}
			}
		}
	}
	return distanceToBoundary;
};
var erodeWalkableArea = (walkableRadiusVoxels, compactHeightfield) => {
	const distanceToBoundary = computeDistanceToBoundary(compactHeightfield);
	const minBoundaryDistance = walkableRadiusVoxels * 2;
	for (let spanIndex = 0; spanIndex < compactHeightfield.spanCount; ++spanIndex) if (distanceToBoundary[spanIndex] < minBoundaryDistance) compactHeightfield.areas[spanIndex] = 0;
};
new Array(9);
var NB_STACKS = 8;
var EXPAND_ITERS = 8;
/**
* Calculate distance field using a two-pass distance transform algorithm
*/
var calculateDistanceField = (compactHeightfield, distances) => {
	const w = compactHeightfield.width;
	const h = compactHeightfield.height;
	distances.fill(65535);
	for (let y = 0; y < h; ++y) for (let x = 0; x < w; ++x) {
		const cell = compactHeightfield.cells[x + y * w];
		for (let i = cell.index; i < cell.index + cell.count; ++i) {
			const span = compactHeightfield.spans[i];
			const area = compactHeightfield.areas[i];
			let neighborCount = 0;
			for (let dir = 0; dir < 4; ++dir) if (getCon(span, dir) !== 63) {
				const ax = x + DIR_OFFSETS[dir][0];
				const ay = y + DIR_OFFSETS[dir][1];
				const ai = compactHeightfield.cells[ax + ay * w].index + getCon(span, dir);
				if (area === compactHeightfield.areas[ai]) neighborCount++;
			}
			if (neighborCount !== 4) distances[i] = 0;
		}
	}
	for (let y = 0; y < h; ++y) for (let x = 0; x < w; ++x) {
		const cell = compactHeightfield.cells[x + y * w];
		for (let i = cell.index; i < cell.index + cell.count; ++i) {
			const span = compactHeightfield.spans[i];
			if (getCon(span, 0) !== 63) {
				const ax = x + DIR_OFFSETS[0][0];
				const ay = y + DIR_OFFSETS[0][1];
				const ai = compactHeightfield.cells[ax + ay * w].index + getCon(span, 0);
				const aSpan = compactHeightfield.spans[ai];
				if (distances[ai] + 2 < distances[i]) distances[i] = distances[ai] + 2;
				if (getCon(aSpan, 3) !== 63) {
					const aax = ax + DIR_OFFSETS[3][0];
					const aay = ay + DIR_OFFSETS[3][1];
					const aai = compactHeightfield.cells[aax + aay * w].index + getCon(aSpan, 3);
					if (distances[aai] + 3 < distances[i]) distances[i] = distances[aai] + 3;
				}
			}
			if (getCon(span, 3) !== 63) {
				const ax = x + DIR_OFFSETS[3][0];
				const ay = y + DIR_OFFSETS[3][1];
				const ai = compactHeightfield.cells[ax + ay * w].index + getCon(span, 3);
				const aSpan = compactHeightfield.spans[ai];
				if (distances[ai] + 2 < distances[i]) distances[i] = distances[ai] + 2;
				if (getCon(aSpan, 2) !== 63) {
					const aax = ax + DIR_OFFSETS[2][0];
					const aay = ay + DIR_OFFSETS[2][1];
					const aai = compactHeightfield.cells[aax + aay * w].index + getCon(aSpan, 2);
					if (distances[aai] + 3 < distances[i]) distances[i] = distances[aai] + 3;
				}
			}
		}
	}
	for (let y = h - 1; y >= 0; --y) for (let x = w - 1; x >= 0; --x) {
		const cell = compactHeightfield.cells[x + y * w];
		for (let i = cell.index; i < cell.index + cell.count; ++i) {
			const span = compactHeightfield.spans[i];
			if (getCon(span, 2) !== 63) {
				const ax = x + DIR_OFFSETS[2][0];
				const ay = y + DIR_OFFSETS[2][1];
				const ai = compactHeightfield.cells[ax + ay * w].index + getCon(span, 2);
				const aSpan = compactHeightfield.spans[ai];
				if (distances[ai] + 2 < distances[i]) distances[i] = distances[ai] + 2;
				if (getCon(aSpan, 1) !== 63) {
					const aax = ax + DIR_OFFSETS[1][0];
					const aay = ay + DIR_OFFSETS[1][1];
					const aai = compactHeightfield.cells[aax + aay * w].index + getCon(aSpan, 1);
					if (distances[aai] + 3 < distances[i]) distances[i] = distances[aai] + 3;
				}
			}
			if (getCon(span, 1) !== 63) {
				const ax = x + DIR_OFFSETS[1][0];
				const ay = y + DIR_OFFSETS[1][1];
				const ai = compactHeightfield.cells[ax + ay * w].index + getCon(span, 1);
				const aSpan = compactHeightfield.spans[ai];
				if (distances[ai] + 2 < distances[i]) distances[i] = distances[ai] + 2;
				if (getCon(aSpan, 0) !== 63) {
					const aax = ax + DIR_OFFSETS[0][0];
					const aay = ay + DIR_OFFSETS[0][1];
					const aai = compactHeightfield.cells[aax + aay * w].index + getCon(aSpan, 0);
					if (distances[aai] + 3 < distances[i]) distances[i] = distances[aai] + 3;
				}
			}
		}
	}
	let maxDist = 0;
	for (let i = 0; i < compactHeightfield.spanCount; ++i) maxDist = Math.max(distances[i], maxDist);
	return maxDist;
};
/**
* Apply box blur filter to smooth distance values
*/
var boxBlur = (compactHeightfield, threshold, srcDistances, dstDistances) => {
	const w = compactHeightfield.width;
	const h = compactHeightfield.height;
	const scaledThreshold = threshold * 2;
	for (let y = 0; y < h; ++y) for (let x = 0; x < w; ++x) {
		const cell = compactHeightfield.cells[x + y * w];
		for (let i = cell.index; i < cell.index + cell.count; ++i) {
			const span = compactHeightfield.spans[i];
			const cd = srcDistances[i];
			if (cd <= scaledThreshold) {
				dstDistances[i] = cd;
				continue;
			}
			let d = cd;
			for (let dir = 0; dir < 4; ++dir) if (getCon(span, dir) !== 63) {
				const ax = x + DIR_OFFSETS[dir][0];
				const ay = y + DIR_OFFSETS[dir][1];
				const ai = compactHeightfield.cells[ax + ay * w].index + getCon(span, dir);
				d += srcDistances[ai];
				const aSpan = compactHeightfield.spans[ai];
				const dir2 = dir + 1 & 3;
				if (getCon(aSpan, dir2) !== 63) {
					const ax2 = ax + DIR_OFFSETS[dir2][0];
					const ay2 = ay + DIR_OFFSETS[dir2][1];
					const ai2 = compactHeightfield.cells[ax2 + ay2 * w].index + getCon(aSpan, dir2);
					d += srcDistances[ai2];
				} else d += cd;
			} else d += cd * 2;
			dstDistances[i] = Math.floor((d + 5) / 9);
		}
	}
};
var buildDistanceField = (compactHeightfield) => {
	const tempDistances = new Array(compactHeightfield.spanCount).fill(0);
	compactHeightfield.maxDistance = calculateDistanceField(compactHeightfield, compactHeightfield.distances);
	boxBlur(compactHeightfield, 1, compactHeightfield.distances, tempDistances);
	for (let i = 0; i < compactHeightfield.spanCount; i++) compactHeightfield.distances[i] = tempDistances[i];
};
var buildRegions = (ctx, compactHeightfield, borderSize, minRegionArea, mergeRegionArea) => {
	const w = compactHeightfield.width;
	const h = compactHeightfield.height;
	const srcReg = new Array(compactHeightfield.spanCount).fill(0);
	const srcDist = new Array(compactHeightfield.spanCount).fill(0);
	let regionId = 1;
	let level = compactHeightfield.maxDistance + 1 & -2;
	const lvlStacks = [];
	for (let i = 0; i < NB_STACKS; i++) lvlStacks[i] = [];
	const stack = [];
	if (borderSize > 0) {
		const bw = Math.min(w, borderSize);
		const bh = Math.min(h, borderSize);
		paintRectRegion(0, bw, 0, h, regionId | BORDER_REG, compactHeightfield, srcReg);
		regionId++;
		paintRectRegion(w - bw, w, 0, h, regionId | BORDER_REG, compactHeightfield, srcReg);
		regionId++;
		paintRectRegion(0, w, 0, bh, regionId | BORDER_REG, compactHeightfield, srcReg);
		regionId++;
		paintRectRegion(0, w, h - bh, h, regionId | BORDER_REG, compactHeightfield, srcReg);
		regionId++;
	}
	compactHeightfield.borderSize = borderSize;
	let sId = -1;
	while (level > 0) {
		level = level >= 2 ? level - 2 : 0;
		sId = sId + 1 & 7;
		if (sId === 0) sortCellsByLevel(level, compactHeightfield, srcReg, NB_STACKS, lvlStacks, 1);
		else appendStacks(lvlStacks[sId - 1], lvlStacks[sId], srcReg);
		expandRegions(EXPAND_ITERS, level, compactHeightfield, srcReg, srcDist, lvlStacks[sId], false);
		for (let j = 0; j < lvlStacks[sId].length; j++) {
			const current = lvlStacks[sId][j];
			const x = current.x;
			const y = current.y;
			const i = current.index;
			if (i >= 0 && srcReg[i] === 0) {
				if (floodRegion(x, y, i, level, regionId, compactHeightfield, srcReg, srcDist, stack)) {
					if (regionId === 65535) {
						BuildContext.error(ctx, "Region ID overflow");
						return false;
					}
					regionId++;
				}
			}
		}
	}
	expandRegions(64, 0, compactHeightfield, srcReg, srcDist, stack, true);
	const overlaps = [];
	compactHeightfield.maxRegions = regionId;
	if (!mergeAndFilterRegions(ctx, minRegionArea, mergeRegionArea, compactHeightfield, srcReg, overlaps));
	for (let i = 0; i < compactHeightfield.spanCount; i++) compactHeightfield.spans[i].region = srcReg[i];
	return true;
};
/**
* Paint a rectangular region with the given region ID
*/
var paintRectRegion = (minx, maxx, miny, maxy, regId, compactHeightfield, srcReg) => {
	const w = compactHeightfield.width;
	for (let y = miny; y < maxy; y++) for (let x = minx; x < maxx; x++) {
		const cell = compactHeightfield.cells[x + y * w];
		for (let i = cell.index; i < cell.index + cell.count; i++) if (compactHeightfield.areas[i] !== 0) srcReg[i] = regId;
	}
};
/**
* Sort cells by their distance level into stacks
*/
var sortCellsByLevel = (startLevel, compactHeightfield, srcReg, nbStacks, stacks, logLevelsPerStack) => {
	const w = compactHeightfield.width;
	const h = compactHeightfield.height;
	const adjustedStartLevel = startLevel >> logLevelsPerStack;
	for (let j = 0; j < nbStacks; j++) stacks[j].length = 0;
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
		const cell = compactHeightfield.cells[x + y * w];
		for (let i = cell.index; i < cell.index + cell.count; i++) {
			if (compactHeightfield.areas[i] === 0 || srcReg[i] !== 0) continue;
			let sId = adjustedStartLevel - (compactHeightfield.distances[i] >> logLevelsPerStack);
			if (sId >= nbStacks) continue;
			if (sId < 0) sId = 0;
			stacks[sId].push({
				x,
				y,
				index: i
			});
		}
	}
};
/**
* Append entries from source stack to destination stack
*/
var appendStacks = (srcStack, dstStack, srcReg) => {
	for (let j = 0; j < srcStack.length; j++) {
		const entry = srcStack[j];
		if (entry.index < 0 || srcReg[entry.index] !== 0) continue;
		dstStack.push(entry);
	}
};
/**
* Flood fill a region starting from a given point
*/
var floodRegion = (x, y, i, level, r, compactHeightfield, srcReg, srcDist, stack) => {
	const w = compactHeightfield.width;
	const area = compactHeightfield.areas[i];
	stack.length = 0;
	stack.push({
		x,
		y,
		index: i
	});
	srcReg[i] = r;
	srcDist[i] = 0;
	const lev = level >= 2 ? level - 2 : 0;
	let count = 0;
	while (stack.length > 0) {
		const current = stack.pop();
		const cx = current.x;
		const cy = current.y;
		const ci = current.index;
		const span = compactHeightfield.spans[ci];
		let ar = 0;
		for (let dir = 0; dir < 4; dir++) if (getCon(span, dir) !== 63) {
			const ax = cx + DIR_OFFSETS[dir][0];
			const ay = cy + DIR_OFFSETS[dir][1];
			const ai = compactHeightfield.cells[ax + ay * w].index + getCon(span, dir);
			if (compactHeightfield.areas[ai] !== area) continue;
			const nr = srcReg[ai];
			if (nr & 32768) continue;
			if (nr !== 0 && nr !== r) {
				ar = nr;
				break;
			}
			const aSpan = compactHeightfield.spans[ai];
			const dir2 = dir + 1 & 3;
			if (getCon(aSpan, dir2) !== 63) {
				const ax2 = ax + DIR_OFFSETS[dir2][0];
				const ay2 = ay + DIR_OFFSETS[dir2][1];
				const ai2 = compactHeightfield.cells[ax2 + ay2 * w].index + getCon(aSpan, dir2);
				if (compactHeightfield.areas[ai2] !== area) continue;
				const nr2 = srcReg[ai2];
				if (nr2 !== 0 && nr2 !== r) {
					ar = nr2;
					break;
				}
			}
		}
		if (ar !== 0) {
			srcReg[ci] = 0;
			continue;
		}
		count++;
		for (let dir = 0; dir < 4; dir++) if (getCon(span, dir) !== 63) {
			const ax = cx + DIR_OFFSETS[dir][0];
			const ay = cy + DIR_OFFSETS[dir][1];
			const ai = compactHeightfield.cells[ax + ay * w].index + getCon(span, dir);
			if (compactHeightfield.areas[ai] !== area) continue;
			if (compactHeightfield.distances[ai] >= lev && srcReg[ai] === 0) {
				srcReg[ai] = r;
				srcDist[ai] = 0;
				stack.push({
					x: ax,
					y: ay,
					index: ai
				});
			}
		}
	}
	return count > 0;
};
/**
* Expand regions iteratively
*/
var expandRegions = (maxIter, level, compactHeightfield, srcReg, srcDist, stack, fillStack) => {
	const w = compactHeightfield.width;
	const h = compactHeightfield.height;
	if (fillStack) {
		stack.length = 0;
		for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
			const cell = compactHeightfield.cells[x + y * w];
			for (let i = cell.index; i < cell.index + cell.count; i++) if (compactHeightfield.distances[i] >= level && srcReg[i] === 0 && compactHeightfield.areas[i] !== 0) stack.push({
				x,
				y,
				index: i
			});
		}
	} else for (let j = 0; j < stack.length; j++) if (srcReg[stack[j].index] !== 0) stack[j].index = -1;
	const dirtyEntries = [];
	let iter = 0;
	while (stack.length > 0) {
		let failed = 0;
		dirtyEntries.length = 0;
		for (let j = 0; j < stack.length; j++) {
			const x = stack[j].x;
			const y = stack[j].y;
			const i = stack[j].index;
			if (i < 0) {
				failed++;
				continue;
			}
			let r = srcReg[i];
			let d2 = 65535;
			const area = compactHeightfield.areas[i];
			const span = compactHeightfield.spans[i];
			for (let dir = 0; dir < 4; dir++) {
				if (getCon(span, dir) === 63) continue;
				const ax = x + DIR_OFFSETS[dir][0];
				const ay = y + DIR_OFFSETS[dir][1];
				const ai = compactHeightfield.cells[ax + ay * w].index + getCon(span, dir);
				if (compactHeightfield.areas[ai] !== area) continue;
				if (srcReg[ai] > 0 && (srcReg[ai] & 32768) === 0) {
					if (srcDist[ai] + 2 < d2) {
						r = srcReg[ai];
						d2 = srcDist[ai] + 2;
					}
				}
			}
			if (r) {
				stack[j].index = -1;
				dirtyEntries.push({
					index: i,
					region: r,
					distance2: d2
				});
			} else failed++;
		}
		for (let i = 0; i < dirtyEntries.length; i++) {
			const entry = dirtyEntries[i];
			srcReg[entry.index] = entry.region;
			srcDist[entry.index] = entry.distance2;
		}
		if (failed === stack.length) break;
		if (level > 0) {
			iter++;
			if (iter >= maxIter) break;
		}
	}
};
/**
* Merge and filter regions based on size criteria
*/
var mergeAndFilterRegions = (ctx, minRegionArea, mergeRegionSize, compactHeightfield, srcReg, overlaps) => {
	const w = compactHeightfield.width;
	const h = compactHeightfield.height;
	const nreg = compactHeightfield.maxRegions + 1;
	const regions = [];
	for (let i = 0; i < nreg; i++) regions.push({
		spanCount: 0,
		id: i,
		areaType: 0,
		remap: false,
		visited: false,
		overlap: false,
		connectsToBorder: false,
		ymin: 65535,
		ymax: 0,
		connections: [],
		floors: []
	});
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
		const cell = compactHeightfield.cells[x + y * w];
		for (let i = cell.index; i < cell.index + cell.count; i++) {
			const r = srcReg[i];
			if (r === 0 || r >= nreg) continue;
			const reg = regions[r];
			reg.spanCount++;
			for (let j = cell.index; j < cell.index + cell.count; j++) {
				if (i === j) continue;
				const floorId = srcReg[j];
				if (floorId === 0 || floorId >= nreg) continue;
				if (floorId === r) reg.overlap = true;
				addUniqueFloorRegion(reg, floorId);
			}
			if (reg.connections.length > 0) continue;
			reg.areaType = compactHeightfield.areas[i];
			let ndir = -1;
			for (let dir = 0; dir < 4; dir++) if (isSolidEdge(compactHeightfield, srcReg, x, y, i, dir)) {
				ndir = dir;
				break;
			}
			if (ndir !== -1) walkContour$1(ctx, x, y, i, ndir, compactHeightfield, srcReg, reg.connections);
		}
	}
	const stack = [];
	const trace = [];
	for (let i = 0; i < nreg; i++) {
		const reg = regions[i];
		if (reg.id === 0 || reg.id & 32768) continue;
		if (reg.spanCount === 0) continue;
		if (reg.visited) continue;
		let connectsToBorder = false;
		let spanCount = 0;
		stack.length = 0;
		trace.length = 0;
		reg.visited = true;
		stack.push(i);
		while (stack.length > 0) {
			const ri = stack.pop();
			const creg = regions[ri];
			spanCount += creg.spanCount;
			trace.push(ri);
			for (let j = 0; j < creg.connections.length; j++) {
				if (creg.connections[j] & 32768) {
					connectsToBorder = true;
					continue;
				}
				const neireg = regions[creg.connections[j]];
				if (neireg.visited) continue;
				if (neireg.id === 0 || neireg.id & 32768) continue;
				stack.push(neireg.id);
				neireg.visited = true;
			}
		}
		if (spanCount < minRegionArea && !connectsToBorder) for (let j = 0; j < trace.length; j++) {
			regions[trace[j]].spanCount = 0;
			regions[trace[j]].id = 0;
		}
	}
	let mergeCount = 0;
	do {
		mergeCount = 0;
		for (let i = 0; i < nreg; i++) {
			const reg = regions[i];
			if (reg.id === 0 || reg.id & 32768) continue;
			if (reg.overlap) continue;
			if (reg.spanCount === 0) continue;
			if (reg.spanCount > mergeRegionSize && isRegionConnectedToBorder(reg)) continue;
			let smallest = 268435455;
			let mergeId = reg.id;
			for (let j = 0; j < reg.connections.length; j++) {
				if (reg.connections[j] & 32768) continue;
				const mreg = regions[reg.connections[j]];
				if (mreg.id === 0 || mreg.id & 32768 || mreg.overlap) continue;
				if (mreg.spanCount < smallest && canMergeWithRegion(reg, mreg) && canMergeWithRegion(mreg, reg)) {
					smallest = mreg.spanCount;
					mergeId = mreg.id;
				}
			}
			if (mergeId !== reg.id) {
				const oldId = reg.id;
				const target = regions[mergeId];
				if (mergeRegions(target, reg)) {
					for (let j = 0; j < nreg; j++) {
						if (regions[j].id === 0 || regions[j].id & 32768) continue;
						if (regions[j].id === oldId) regions[j].id = mergeId;
						replaceNeighbor(regions[j], oldId, mergeId);
					}
					mergeCount++;
				}
			}
		}
	} while (mergeCount > 0);
	for (let i = 0; i < nreg; i++) {
		regions[i].remap = false;
		if (regions[i].id === 0) continue;
		if (regions[i].id & 32768) continue;
		regions[i].remap = true;
	}
	let regIdGen = 0;
	for (let i = 0; i < nreg; i++) {
		if (!regions[i].remap) continue;
		const oldId = regions[i].id;
		const newId = ++regIdGen;
		for (let j = i; j < nreg; j++) if (regions[j].id === oldId) {
			regions[j].id = newId;
			regions[j].remap = false;
		}
	}
	compactHeightfield.maxRegions = regIdGen;
	for (let i = 0; i < compactHeightfield.spanCount; i++) if ((srcReg[i] & 32768) === 0) srcReg[i] = regions[srcReg[i]].id;
	for (let i = 0; i < nreg; i++) if (regions[i].overlap) overlaps.push(regions[i].id);
	return true;
};
var addUniqueFloorRegion = (reg, n) => {
	for (let i = 0; i < reg.floors.length; i++) if (reg.floors[i] === n) return;
	reg.floors.push(n);
};
var isRegionConnectedToBorder = (reg) => {
	for (let i = 0; i < reg.connections.length; i++) if (reg.connections[i] === 0) return true;
	return false;
};
var canMergeWithRegion = (rega, regb) => {
	if (rega.areaType !== regb.areaType) return false;
	let n = 0;
	for (let i = 0; i < rega.connections.length; i++) if (rega.connections[i] === regb.id) n++;
	if (n > 1) return false;
	for (let i = 0; i < rega.floors.length; i++) if (rega.floors[i] === regb.id) return false;
	return true;
};
var mergeRegions = (rega, regb) => {
	const aid = rega.id;
	const bid = regb.id;
	const acon = Array.from(rega.connections);
	const bcon = regb.connections;
	let insa = -1;
	for (let i = 0; i < acon.length; i++) if (acon[i] === bid) {
		insa = i;
		break;
	}
	if (insa === -1) return false;
	let insb = -1;
	for (let i = 0; i < bcon.length; i++) if (bcon[i] === aid) {
		insb = i;
		break;
	}
	if (insb === -1) return false;
	rega.connections = [];
	for (let i = 0; i < acon.length - 1; i++) rega.connections.push(acon[(insa + 1 + i) % acon.length]);
	for (let i = 0; i < bcon.length - 1; i++) rega.connections.push(bcon[(insb + 1 + i) % bcon.length]);
	removeAdjacentNeighbors(rega);
	for (let j = 0; j < regb.floors.length; j++) addUniqueFloorRegion(rega, regb.floors[j]);
	rega.spanCount += regb.spanCount;
	regb.spanCount = 0;
	regb.connections = [];
	return true;
};
var removeAdjacentNeighbors = (reg) => {
	for (let i = 0; i < reg.connections.length && reg.connections.length > 1;) {
		const ni = (i + 1) % reg.connections.length;
		if (reg.connections[i] === reg.connections[ni]) {
			for (let j = i; j < reg.connections.length - 1; j++) reg.connections[j] = reg.connections[j + 1];
			reg.connections.pop();
		} else i++;
	}
};
var replaceNeighbor = (reg, oldId, newId) => {
	let neiChanged = false;
	for (let i = 0; i < reg.connections.length; i++) if (reg.connections[i] === oldId) {
		reg.connections[i] = newId;
		neiChanged = true;
	}
	for (let i = 0; i < reg.floors.length; i++) if (reg.floors[i] === oldId) reg.floors[i] = newId;
	if (neiChanged) removeAdjacentNeighbors(reg);
};
var isSolidEdge = (compactHeightfield, srcReg, x, y, i, dir) => {
	const span = compactHeightfield.spans[i];
	let r = 0;
	if (getCon(span, dir) !== 63) {
		const ax = x + DIR_OFFSETS[dir][0];
		const ay = y + DIR_OFFSETS[dir][1];
		r = srcReg[compactHeightfield.cells[ax + ay * compactHeightfield.width].index + getCon(span, dir)];
	}
	if (r === srcReg[i]) return false;
	return true;
};
var walkContour$1 = (ctx, x, y, i, dir, compactHeightfield, srcReg, cont) => {
	const startDir = dir;
	const starti = i;
	const ss = compactHeightfield.spans[i];
	let curReg = 0;
	if (getCon(ss, dir) !== 63) {
		const ax = x + DIR_OFFSETS[dir][0];
		const ay = y + DIR_OFFSETS[dir][1];
		curReg = srcReg[compactHeightfield.cells[ax + ay * compactHeightfield.width].index + getCon(ss, dir)];
	}
	cont.push(curReg);
	let iter = 0;
	let currentX = x;
	let currentY = y;
	let currentI = i;
	let currentDir = dir;
	while (++iter < 4e4) {
		const s = compactHeightfield.spans[currentI];
		if (isSolidEdge(compactHeightfield, srcReg, currentX, currentY, currentI, currentDir)) {
			let r = 0;
			if (getCon(s, currentDir) !== 63) {
				const ax = currentX + DIR_OFFSETS[currentDir][0];
				const ay = currentY + DIR_OFFSETS[currentDir][1];
				r = srcReg[compactHeightfield.cells[ax + ay * compactHeightfield.width].index + getCon(s, currentDir)];
			}
			if (r !== curReg) {
				curReg = r;
				cont.push(curReg);
			}
			currentDir = currentDir + 1 & 3;
		} else {
			let ni = -1;
			const nx = currentX + DIR_OFFSETS[currentDir][0];
			const ny = currentY + DIR_OFFSETS[currentDir][1];
			if (getCon(s, currentDir) !== 63) ni = compactHeightfield.cells[nx + ny * compactHeightfield.width].index + getCon(s, currentDir);
			if (ni === -1) {
				BuildContext.warn(ctx, `walkContour: encountered unexpected disconnected neighbour at (${currentX}, ${currentY})`);
				return;
			}
			currentX = nx;
			currentY = ny;
			currentI = ni;
			currentDir = currentDir + 3 & 3;
		}
		if (starti === currentI && startDir === currentDir) break;
	}
	if (cont.length > 1) for (let j = 0; j < cont.length;) {
		const nj = (j + 1) % cont.length;
		if (cont[j] === cont[nj]) {
			for (let k = j; k < cont.length - 1; k++) cont[k] = cont[k + 1];
			cont.pop();
		} else j++;
	}
};
var MAX_CONTOUR_WALK_ITERATIONS = 4e4;
var ContourBuildFlags;
(function(ContourBuildFlags) {
	/** tessellate solid (impassable) edges during contour simplification */
	ContourBuildFlags[ContourBuildFlags["CONTOUR_TESS_WALL_EDGES"] = 1] = "CONTOUR_TESS_WALL_EDGES";
	/** tessellate edges between areas during contour simplification */
	ContourBuildFlags[ContourBuildFlags["CONTOUR_TESS_AREA_EDGES"] = 2] = "CONTOUR_TESS_AREA_EDGES";
})(ContourBuildFlags || (ContourBuildFlags = {}));
var getCornerHeight = (x, y, i, dir, chf, isBorderVertex) => {
	const s = chf.spans[i];
	let ch = s.y;
	const dirp = dir + 1 & 3;
	const regs = new Array(4).fill(0);
	regs[0] = chf.spans[i].region | chf.areas[i] << 16;
	if (getCon(s, dir) !== 63) {
		const ax = x + getDirOffsetX(dir);
		const ay = y + getDirOffsetY(dir);
		const ai = chf.cells[ax + ay * chf.width].index + getCon(s, dir);
		const as = chf.spans[ai];
		ch = Math.max(ch, as.y);
		regs[1] = chf.spans[ai].region | chf.areas[ai] << 16;
		if (getCon(as, dirp) !== 63) {
			const ax2 = ax + getDirOffsetX(dirp);
			const ay2 = ay + getDirOffsetY(dirp);
			const ai2 = chf.cells[ax2 + ay2 * chf.width].index + getCon(as, dirp);
			const as2 = chf.spans[ai2];
			ch = Math.max(ch, as2.y);
			regs[2] = chf.spans[ai2].region | chf.areas[ai2] << 16;
		}
	}
	if (getCon(s, dirp) !== 63) {
		const ax = x + getDirOffsetX(dirp);
		const ay = y + getDirOffsetY(dirp);
		const ai = chf.cells[ax + ay * chf.width].index + getCon(s, dirp);
		const as = chf.spans[ai];
		ch = Math.max(ch, as.y);
		regs[3] = chf.spans[ai].region | chf.areas[ai] << 16;
		if (getCon(as, dir) !== 63) {
			const ax2 = ax + getDirOffsetX(dir);
			const ay2 = ay + getDirOffsetY(dir);
			const ai2 = chf.cells[ax2 + ay2 * chf.width].index + getCon(as, dir);
			const as2 = chf.spans[ai2];
			ch = Math.max(ch, as2.y);
			regs[2] = chf.spans[ai2].region | chf.areas[ai2] << 16;
		}
	}
	for (let j = 0; j < 4; ++j) {
		const a = j;
		const b = j + 1 & 3;
		const c = j + 2 & 3;
		const d = j + 3 & 3;
		const twoSameExts = (regs[a] & regs[b] & 32768) !== 0 && regs[a] === regs[b];
		const twoInts = ((regs[c] | regs[d]) & BORDER_REG) === 0;
		const intsSameArea = regs[c] >> 16 === regs[d] >> 16;
		const noZeros = regs[a] !== 0 && regs[b] !== 0 && regs[c] !== 0 && regs[d] !== 0;
		if (twoSameExts && twoInts && intsSameArea && noZeros) {
			isBorderVertex.value = true;
			break;
		}
	}
	return ch;
};
var walkContour = (ctx, x, y, i, chf, flags, points) => {
	let dir = 0;
	while ((flags[i] & 1 << dir) === 0) dir++;
	const startDir = dir;
	const starti = i;
	const area = chf.areas[i];
	let iter = 0;
	let currentX = x;
	let currentY = y;
	let currentI = i;
	while (++iter < MAX_CONTOUR_WALK_ITERATIONS) {
		if (flags[currentI] & 1 << dir) {
			const isBorderVertex = { value: false };
			let isAreaBorder = false;
			let px = currentX;
			const py = getCornerHeight(currentX, currentY, currentI, dir, chf, isBorderVertex);
			let pz = currentY;
			switch (dir) {
				case 0:
					pz++;
					break;
				case 1:
					px++;
					pz++;
					break;
				case 2: px++;
			}
			let r = 0;
			const s = chf.spans[currentI];
			if (getCon(s, dir) !== 63) {
				const ax = currentX + getDirOffsetX(dir);
				const ay = currentY + getDirOffsetY(dir);
				const ai = chf.cells[ax + ay * chf.width].index + getCon(s, dir);
				r = chf.spans[ai].region;
				if (area !== chf.areas[ai]) isAreaBorder = true;
			}
			if (isBorderVertex.value) r |= BORDER_VERTEX;
			if (isAreaBorder) r |= AREA_BORDER;
			points.push(px);
			points.push(py);
			points.push(pz);
			points.push(r);
			flags[currentI] &= ~(1 << dir);
			dir = dir + 1 & 3;
		} else {
			let ni = -1;
			const nx = currentX + getDirOffsetX(dir);
			const ny = currentY + getDirOffsetY(dir);
			const s = chf.spans[currentI];
			if (getCon(s, dir) !== 63) ni = chf.cells[nx + ny * chf.width].index + getCon(s, dir);
			if (ni === -1) {
				BuildContext.warn(ctx, `walkContour: encountered unexpected disconnected neighbour at (${currentX}, ${currentY})`);
				return;
			}
			currentX = nx;
			currentY = ny;
			currentI = ni;
			dir = dir + 3 & 3;
		}
		if (starti === currentI && startDir === dir) break;
	}
};
var distancePtSeg = (x, z, px, pz, qx, qz) => {
	const pqx = qx - px;
	const pqz = qz - pz;
	const dx = x - px;
	const dz = z - pz;
	const d = pqx * pqx + pqz * pqz;
	let t = pqx * dx + pqz * dz;
	if (d > 0) t /= d;
	if (t < 0) t = 0;
	else if (t > 1) t = 1;
	const finalDx = px + t * pqx - x;
	const finalDz = pz + t * pqz - z;
	return finalDx * finalDx + finalDz * finalDz;
};
var simplifyContour = (points, simplified, maxError, maxEdgeLen, buildFlags) => {
	let hasConnections = false;
	for (let i = 0; i < points.length; i += 4) if ((points[i + 3] & 65535) !== 0) {
		hasConnections = true;
		break;
	}
	if (hasConnections) for (let i = 0, ni = Math.floor(points.length / 4); i < ni; ++i) {
		const ii = (i + 1) % ni;
		const differentRegs = (points[i * 4 + 3] & CONTOUR_REG_MASK) !== (points[ii * 4 + 3] & CONTOUR_REG_MASK);
		const areaBorders = (points[i * 4 + 3] & AREA_BORDER) !== (points[ii * 4 + 3] & AREA_BORDER);
		if (differentRegs || areaBorders) {
			simplified.push(points[i * 4 + 0]);
			simplified.push(points[i * 4 + 1]);
			simplified.push(points[i * 4 + 2]);
			simplified.push(i);
		}
	}
	if (simplified.length === 0) {
		let llx = points[0];
		let lly = points[1];
		let llz = points[2];
		let lli = 0;
		let urx = points[0];
		let ury = points[1];
		let urz = points[2];
		let uri = 0;
		for (let i = 0; i < points.length; i += 4) {
			const x = points[i + 0];
			const y = points[i + 1];
			const z = points[i + 2];
			if (x < llx || x === llx && z < llz) {
				llx = x;
				lly = y;
				llz = z;
				lli = Math.floor(i / 4);
			}
			if (x > urx || x === urx && z > urz) {
				urx = x;
				ury = y;
				urz = z;
				uri = Math.floor(i / 4);
			}
		}
		simplified.push(llx);
		simplified.push(lly);
		simplified.push(llz);
		simplified.push(lli);
		simplified.push(urx);
		simplified.push(ury);
		simplified.push(urz);
		simplified.push(uri);
	}
	const pn = Math.floor(points.length / 4);
	for (let i = 0; i < Math.floor(simplified.length / 4);) {
		const ii = (i + 1) % Math.floor(simplified.length / 4);
		const ax = simplified[i * 4 + 0];
		const az = simplified[i * 4 + 2];
		const ai = simplified[i * 4 + 3];
		const bx = simplified[ii * 4 + 0];
		const bz = simplified[ii * 4 + 2];
		const bi = simplified[ii * 4 + 3];
		let maxd = 0;
		let maxi = -1;
		let ci;
		let cinc;
		let endi;
		let segAx = ax;
		let segAz = az;
		let segBx = bx;
		let segBz = bz;
		if (bx > ax || bx === ax && bz > az) {
			cinc = 1;
			ci = (ai + cinc) % pn;
			endi = bi;
		} else {
			cinc = pn - 1;
			ci = (bi + cinc) % pn;
			endi = ai;
			segAx = bx;
			segBx = ax;
			segAz = bz;
			segBz = az;
		}
		if ((points[ci * 4 + 3] & 65535) === 0 || points[ci * 4 + 3] & 131072) while (ci !== endi) {
			const d = distancePtSeg(points[ci * 4 + 0], points[ci * 4 + 2], segAx, segAz, segBx, segBz);
			if (d > maxd) {
				maxd = d;
				maxi = ci;
			}
			ci = (ci + cinc) % pn;
		}
		if (maxi !== -1 && maxd > maxError * maxError) {
			simplified.length = simplified.length + 4;
			const n = Math.floor(simplified.length / 4);
			for (let j = n - 1; j > i; --j) {
				simplified[j * 4 + 0] = simplified[(j - 1) * 4 + 0];
				simplified[j * 4 + 1] = simplified[(j - 1) * 4 + 1];
				simplified[j * 4 + 2] = simplified[(j - 1) * 4 + 2];
				simplified[j * 4 + 3] = simplified[(j - 1) * 4 + 3];
			}
			simplified[(i + 1) * 4 + 0] = points[maxi * 4 + 0];
			simplified[(i + 1) * 4 + 1] = points[maxi * 4 + 1];
			simplified[(i + 1) * 4 + 2] = points[maxi * 4 + 2];
			simplified[(i + 1) * 4 + 3] = maxi;
		} else ++i;
	}
	if (maxEdgeLen > 0 && (buildFlags & (ContourBuildFlags.CONTOUR_TESS_WALL_EDGES | ContourBuildFlags.CONTOUR_TESS_AREA_EDGES)) !== 0) for (let i = 0; i < Math.floor(simplified.length / 4);) {
		const ii = (i + 1) % Math.floor(simplified.length / 4);
		const ax = simplified[i * 4 + 0];
		const az = simplified[i * 4 + 2];
		const ai = simplified[i * 4 + 3];
		const bx = simplified[ii * 4 + 0];
		const bz = simplified[ii * 4 + 2];
		const bi = simplified[ii * 4 + 3];
		let maxi = -1;
		const ci = (ai + 1) % pn;
		let tess = false;
		if (buildFlags & ContourBuildFlags.CONTOUR_TESS_WALL_EDGES && (points[ci * 4 + 3] & 65535) === 0) tess = true;
		if (buildFlags & ContourBuildFlags.CONTOUR_TESS_AREA_EDGES && points[ci * 4 + 3] & 131072) tess = true;
		if (tess) {
			const dx = bx - ax;
			const dz = bz - az;
			if (dx * dx + dz * dz > maxEdgeLen * maxEdgeLen) {
				const n = bi < ai ? bi + pn - ai : bi - ai;
				if (n > 1) {
					if (bx > ax || bx === ax && bz > az) maxi = (ai + Math.floor(n / 2)) % pn;
					else maxi = (ai + Math.floor((n + 1) / 2)) % pn;
				}
			}
		}
		if (maxi !== -1) {
			simplified.length = simplified.length + 4;
			const n = Math.floor(simplified.length / 4);
			for (let j = n - 1; j > i; --j) {
				simplified[j * 4 + 0] = simplified[(j - 1) * 4 + 0];
				simplified[j * 4 + 1] = simplified[(j - 1) * 4 + 1];
				simplified[j * 4 + 2] = simplified[(j - 1) * 4 + 2];
				simplified[j * 4 + 3] = simplified[(j - 1) * 4 + 3];
			}
			simplified[(i + 1) * 4 + 0] = points[maxi * 4 + 0];
			simplified[(i + 1) * 4 + 1] = points[maxi * 4 + 1];
			simplified[(i + 1) * 4 + 2] = points[maxi * 4 + 2];
			simplified[(i + 1) * 4 + 3] = maxi;
		} else ++i;
	}
	for (let i = 0; i < Math.floor(simplified.length / 4); ++i) {
		const ai = (simplified[i * 4 + 3] + 1) % pn;
		const bi = simplified[i * 4 + 3];
		simplified[i * 4 + 3] = points[ai * 4 + 3] & 196607 | points[bi * 4 + 3] & BORDER_VERTEX;
	}
};
var calcAreaOfPolygon2D = (verts, nverts) => {
	let area = 0;
	for (let i = 0, j = nverts - 1; i < nverts; j = i++) {
		const vi = i * 4;
		const vj = j * 4;
		area += verts[vi] * verts[vj + 2] - verts[vj] * verts[vi + 2];
	}
	return Math.floor((area + 1) / 2);
};
var prev$2 = (i, n) => i - 1 >= 0 ? i - 1 : n - 1;
var next$2 = (i, n) => i + 1 < n ? i + 1 : 0;
var area2$1 = (a, b, c) => {
	return (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
};
var left$1 = (a, b, c) => {
	return area2$1(a, b, c) < 0;
};
var leftOn$1 = (a, b, c) => {
	return area2$1(a, b, c) <= 0;
};
var collinear$1 = (a, b, c) => {
	return area2$1(a, b, c) === 0;
};
var intersectProp$1 = (a, b, c, d) => {
	if (collinear$1(a, b, c) || collinear$1(a, b, d) || collinear$1(c, d, a) || collinear$1(c, d, b)) return false;
	return xorb$1(left$1(a, b, c), left$1(a, b, d)) && xorb$1(left$1(c, d, a), left$1(c, d, b));
};
var between$1 = (a, b, c) => {
	if (!collinear$1(a, b, c)) return false;
	if (a[0] !== b[0]) return a[0] <= c[0] && c[0] <= b[0] || a[0] >= c[0] && c[0] >= b[0];
	else return a[1] <= c[1] && c[1] <= b[1] || a[1] >= c[1] && c[1] >= b[1];
};
var intersect$1 = (a, b, c, d) => {
	if (intersectProp$1(a, b, c, d)) return true;
	else if (between$1(a, b, c) || between$1(a, b, d) || between$1(c, d, a) || between$1(c, d, b)) return true;
	else return false;
};
var _intersectSegContour_p0 = create$4();
var _intersectSegContour_p1 = create$4();
var intersectSegContour = (d0, d1, i, n, verts) => {
	for (let k = 0; k < n; k++) {
		const k1 = next$2(k, n);
		if (i === k || i === k1) continue;
		const p0 = set$2(_intersectSegContour_p0, verts[k * 4], verts[k * 4 + 2]);
		const p1 = set$2(_intersectSegContour_p1, verts[k1 * 4], verts[k1 * 4 + 2]);
		if (equals$1(d0, p0) || equals$1(d1, p0) || equals$1(d0, p1) || equals$1(d1, p1)) continue;
		if (intersect$1(d0, d1, p0, p1)) return true;
	}
	return false;
};
var _inCone_pi = create$4();
var _inCone_pi1 = create$4();
var _inCone_pin1 = create$4();
var inCone$1 = (i, n, verts, pj) => {
	const piIdx = i * 4;
	const pi1Idx = next$2(i, n) * 4;
	const pin1Idx = prev$2(i, n) * 4;
	const pi = set$2(_inCone_pi, verts[piIdx], verts[piIdx + 2]);
	const pi1 = set$2(_inCone_pi1, verts[pi1Idx], verts[pi1Idx + 2]);
	const pin1 = set$2(_inCone_pin1, verts[pin1Idx], verts[pin1Idx + 2]);
	if (leftOn$1(pin1, pi, pi1)) return left$1(pi, pj, pin1) && left$1(pj, pi, pi1);
	return !(leftOn$1(pi, pj, pi1) && leftOn$1(pj, pi, pin1));
};
var xorb$1 = (x, y) => {
	return !x !== !y;
};
var vequal = (verticesA, vertexAIdx, verticesB, vertexBIdx) => {
	const offsetA = vertexAIdx * 4;
	const offsetB = vertexBIdx * 4;
	return verticesA[offsetA] === verticesB[offsetB] && verticesA[offsetA + 2] === verticesB[offsetB + 2];
};
var removeDegenerateSegments = (simplified) => {
	let npts = Math.floor(simplified.length / 4);
	for (let i = npts - 1; i >= 0; --i) {
		const ni = next$2(i, npts);
		if (vequal(simplified, i, simplified, ni)) {
			for (let j = i; j < Math.floor(simplified.length / 4) - 1; ++j) {
				simplified[j * 4 + 0] = simplified[(j + 1) * 4 + 0];
				simplified[j * 4 + 1] = simplified[(j + 1) * 4 + 1];
				simplified[j * 4 + 2] = simplified[(j + 1) * 4 + 2];
				simplified[j * 4 + 3] = simplified[(j + 1) * 4 + 3];
			}
			simplified.splice(-4, 4);
			npts--;
		}
	}
};
var mergeContours = (ca, cb, ia, ib) => {
	const maxVerts = ca.nVertices + cb.nVertices + 2;
	const verts = new Array(maxVerts * 4);
	let nv = 0;
	for (let i = 0; i <= ca.nVertices; ++i) {
		const srcIndex = (ia + i) % ca.nVertices * 4;
		verts[nv * 4 + 0] = ca.vertices[srcIndex + 0];
		verts[nv * 4 + 1] = ca.vertices[srcIndex + 1];
		verts[nv * 4 + 2] = ca.vertices[srcIndex + 2];
		verts[nv * 4 + 3] = ca.vertices[srcIndex + 3];
		nv++;
	}
	for (let i = 0; i <= cb.nVertices; ++i) {
		const srcIndex = (ib + i) % cb.nVertices * 4;
		verts[nv * 4 + 0] = cb.vertices[srcIndex + 0];
		verts[nv * 4 + 1] = cb.vertices[srcIndex + 1];
		verts[nv * 4 + 2] = cb.vertices[srcIndex + 2];
		verts[nv * 4 + 3] = cb.vertices[srcIndex + 3];
		nv++;
	}
	ca.vertices = verts;
	ca.nVertices = nv;
	cb.vertices = [];
	cb.nVertices = 0;
	return true;
};
var findLeftMostVertex = (contour) => {
	let minx = contour.vertices[0];
	let minz = contour.vertices[2];
	let leftmost = 0;
	for (let i = 1; i < contour.nVertices; i++) {
		const x = contour.vertices[i * 4 + 0];
		const z = contour.vertices[i * 4 + 2];
		if (x < minx || x === minx && z < minz) {
			minx = x;
			minz = z;
			leftmost = i;
		}
	}
	return {
		minx,
		minz,
		leftmost
	};
};
var compareHoles = (a, b) => {
	if (a.minx === b.minx) {
		if (a.minz < b.minz) return -1;
		if (a.minz > b.minz) return 1;
	} else {
		if (a.minx < b.minx) return -1;
		if (a.minx > b.minx) return 1;
	}
	return 0;
};
var _mergeRegionHoles_corner = create$4();
var _mergeRegionHoles_pt = create$4();
var mergeRegionHoles = (ctx, region) => {
	for (let i = 0; i < region.holes.length; i++) {
		const result = findLeftMostVertex(region.holes[i].contour);
		region.holes[i].minx = result.minx;
		region.holes[i].minz = result.minz;
		region.holes[i].leftmost = result.leftmost;
	}
	region.holes.sort(compareHoles);
	let maxVerts = region.outline.nVertices;
	for (let i = 0; i < region.holes.length; i++) maxVerts += region.holes[i].contour.nVertices;
	const diags = new Array(maxVerts);
	for (let i = 0; i < maxVerts; i++) diags[i] = {
		vert: 0,
		dist: 0
	};
	const outline = region.outline;
	for (let i = 0; i < region.holes.length; i++) {
		const hole = region.holes[i].contour;
		let index = -1;
		let bestVertex = region.holes[i].leftmost;
		for (let iter = 0; iter < hole.nVertices; iter++) {
			let ndiags = 0;
			const corner = set$2(_mergeRegionHoles_corner, hole.vertices[bestVertex * 4 + 0], hole.vertices[bestVertex * 4 + 2]);
			for (let j = 0; j < outline.nVertices; j++) if (inCone$1(j, outline.nVertices, outline.vertices, corner)) {
				const dx = outline.vertices[j * 4 + 0] - corner[0];
				const dz = outline.vertices[j * 4 + 2] - corner[1];
				diags[ndiags].vert = j;
				diags[ndiags].dist = dx * dx + dz * dz;
				ndiags++;
			}
			if (ndiags > 1) {
				for (let a = 0; a < ndiags - 1; a++) for (let b = a + 1; b < ndiags; b++) if (diags[a].dist > diags[b].dist) {
					const temp = diags[a];
					diags[a] = diags[b];
					diags[b] = temp;
				}
			}
			index = -1;
			for (let j = 0; j < ndiags; j++) {
				const ptIdx = diags[j].vert * 4;
				const pt = set$2(_mergeRegionHoles_pt, outline.vertices[ptIdx], outline.vertices[ptIdx + 2]);
				let intersect = intersectSegContour(pt, corner, diags[j].vert, outline.nVertices, outline.vertices);
				for (let k = i; k < region.holes.length && !intersect; k++) intersect = intersect || intersectSegContour(pt, corner, -1, region.holes[k].contour.nVertices, region.holes[k].contour.vertices);
				if (!intersect) {
					index = diags[j].vert;
					break;
				}
			}
			if (index !== -1) break;
			bestVertex = (bestVertex + 1) % hole.nVertices;
		}
		if (index === -1) {
			BuildContext.warn(ctx, "mergeHoles: Failed to find merge points for outline and hole.");
			continue;
		}
		if (!mergeContours(region.outline, hole, index, bestVertex));
	}
};
var buildContours = (ctx, compactHeightfield, maxSimplificationError, maxEdgeLength, buildFlags) => {
	const width = compactHeightfield.width;
	const height = compactHeightfield.height;
	const borderSize = compactHeightfield.borderSize;
	const contourSet = {
		contours: [],
		bounds: clone(compactHeightfield.bounds),
		cellSize: compactHeightfield.cellSize,
		cellHeight: compactHeightfield.cellHeight,
		width: compactHeightfield.width - compactHeightfield.borderSize * 2,
		height: compactHeightfield.height - compactHeightfield.borderSize * 2,
		borderSize: compactHeightfield.borderSize,
		maxError: maxSimplificationError
	};
	if (borderSize > 0) {
		const pad = borderSize * compactHeightfield.cellSize;
		contourSet.bounds[0] += pad;
		contourSet.bounds[2] += pad;
		contourSet.bounds[3] -= pad;
		contourSet.bounds[5] -= pad;
	}
	const flags = new Array(compactHeightfield.spanCount).fill(0);
	for (let y = 0; y < height; ++y) for (let x = 0; x < width; ++x) {
		const c = compactHeightfield.cells[x + y * width];
		for (let i = c.index; i < c.index + c.count; ++i) {
			let res = 0;
			const s = compactHeightfield.spans[i];
			if (!compactHeightfield.spans[i].region || compactHeightfield.spans[i].region & 32768) {
				flags[i] = 0;
				continue;
			}
			for (let dir = 0; dir < 4; ++dir) {
				let r = 0;
				if (getCon(s, dir) !== 63) {
					const ax = x + getDirOffsetX(dir);
					const ay = y + getDirOffsetY(dir);
					const ai = compactHeightfield.cells[ax + ay * width].index + getCon(s, dir);
					r = compactHeightfield.spans[ai].region;
				}
				if (r === compactHeightfield.spans[i].region) res |= 1 << dir;
			}
			flags[i] = res ^ 15;
		}
	}
	const verts = [];
	const simplified = [];
	for (let y = 0; y < height; ++y) for (let x = 0; x < width; ++x) {
		const c = compactHeightfield.cells[x + y * width];
		for (let i = c.index; i < c.index + c.count; ++i) {
			if (flags[i] === 0 || flags[i] === 15) {
				flags[i] = 0;
				continue;
			}
			const region = compactHeightfield.spans[i].region;
			if (!region || region & 32768) continue;
			const area = compactHeightfield.areas[i];
			verts.length = 0;
			simplified.length = 0;
			walkContour(ctx, x, y, i, compactHeightfield, flags, verts);
			simplifyContour(verts, simplified, maxSimplificationError, maxEdgeLength, buildFlags);
			removeDegenerateSegments(simplified);
			if (Math.floor(simplified.length / 4) >= 3) {
				const contour = {
					nVertices: Math.floor(simplified.length / 4),
					vertices: simplified.slice(),
					nRawVertices: Math.floor(verts.length / 4),
					rawVertices: verts.slice(),
					reg: region,
					area
				};
				if (borderSize > 0) {
					for (let j = 0; j < contour.nVertices; ++j) {
						contour.vertices[j * 4 + 0] -= borderSize;
						contour.vertices[j * 4 + 2] -= borderSize;
					}
					for (let j = 0; j < contour.nRawVertices; ++j) {
						contour.rawVertices[j * 4 + 0] -= borderSize;
						contour.rawVertices[j * 4 + 2] -= borderSize;
					}
				}
				contourSet.contours.push(contour);
			}
		}
	}
	if (contourSet.contours.length > 0) {
		const winding = new Array(contourSet.contours.length);
		let nholes = 0;
		for (let i = 0; i < contourSet.contours.length; ++i) {
			const contour = contourSet.contours[i];
			winding[i] = calcAreaOfPolygon2D(contour.vertices, contour.nVertices) < 0 ? -1 : 1;
			if (winding[i] < 0) nholes++;
		}
		if (nholes > 0) {
			const nregions = compactHeightfield.maxRegions + 1;
			const regions = new Array(nregions);
			for (let i = 0; i < nregions; i++) regions[i] = {
				outline: null,
				holes: []
			};
			const holes = new Array(contourSet.contours.length);
			for (let i = 0; i < contourSet.contours.length; i++) holes[i] = {
				contour: contourSet.contours[i],
				minx: 0,
				minz: 0,
				leftmost: 0
			};
			for (let i = 0; i < contourSet.contours.length; ++i) {
				const contour = contourSet.contours[i];
				const region = regions[contour.reg];
				if (winding[i] > 0) {
					if (region.outline) BuildContext.error(ctx, `buildContours: Multiple outlines for region ${contour.reg}.`);
					region.outline = contour;
				} else region.holes.push(holes[i]);
			}
			for (let i = 0; i < nregions; i++) {
				const region = regions[i];
				if (region.holes.length === 0) continue;
				if (region.outline) mergeRegionHoles(ctx, region);
				else BuildContext.error(ctx, `buildContours: Bad outline for region ${i}, contour simplification is likely too aggressive.`);
			}
		}
	}
	return contourSet;
};
var SPAN_MAX_HEIGHT = 8191;
var MAX_HEIGHTFIELD_HEIGHT = 65535;
var calculateGridSize = (outGridSize, bounds, cellSize) => {
	outGridSize[0] = Math.floor((bounds[3] - bounds[0]) / cellSize + .5);
	outGridSize[1] = Math.floor((bounds[5] - bounds[2]) / cellSize + .5);
	return outGridSize;
};
var createHeightfield = (width, height, bounds, cellSize, cellHeight) => {
	const numSpans = width * height;
	return {
		width,
		height,
		spans: new Array(numSpans).fill(null),
		bounds,
		cellHeight,
		cellSize
	};
};
/**
* Adds a span to the heightfield. If the new span overlaps existing spans,
* it will merge the new span with the existing ones.
*/
var addHeightfieldSpan = (heightfield, x, z, min, max, areaID, flagMergeThreshold) => {
	const newSpan = {
		min,
		max,
		area: areaID,
		next: null
	};
	const columnIndex = x + z * heightfield.width;
	let previousSpan = null;
	let currentSpan = heightfield.spans[columnIndex];
	while (currentSpan !== null) {
		if (currentSpan.min > newSpan.max) break;
		if (currentSpan.max < newSpan.min) {
			previousSpan = currentSpan;
			currentSpan = currentSpan.next;
		} else {
			if (currentSpan.min < newSpan.min) newSpan.min = currentSpan.min;
			if (currentSpan.max > newSpan.max) newSpan.max = currentSpan.max;
			if (Math.abs(newSpan.max - currentSpan.max) <= flagMergeThreshold) newSpan.area = Math.max(newSpan.area, currentSpan.area);
			const next = currentSpan.next;
			if (previousSpan) previousSpan.next = next;
			else heightfield.spans[columnIndex] = next;
			currentSpan = next;
		}
	}
	if (previousSpan !== null) {
		newSpan.next = previousSpan.next;
		previousSpan.next = newSpan;
	} else {
		newSpan.next = heightfield.spans[columnIndex];
		heightfield.spans[columnIndex] = newSpan;
	}
	return true;
};
/**
* Divides a convex polygon of max 12 vertices into two convex polygons
* across a separating axis.
*/
var dividePoly = (out, inVerts, inVertsCount, outVerts1, outVerts2, axisOffset, axis) => {
	const inVertAxisDelta = _inVertAxisDelta;
	for (let inVert = 0; inVert < inVertsCount; ++inVert) inVertAxisDelta[inVert] = axisOffset - inVerts[inVert * 3 + axis];
	let poly1Vert = 0;
	let poly2Vert = 0;
	for (let inVertA = 0, inVertB = inVertsCount - 1; inVertA < inVertsCount; inVertB = inVertA, ++inVertA) if (!(inVertAxisDelta[inVertA] >= 0 === inVertAxisDelta[inVertB] >= 0)) {
		const s = inVertAxisDelta[inVertB] / (inVertAxisDelta[inVertB] - inVertAxisDelta[inVertA]);
		outVerts1[poly1Vert * 3 + 0] = inVerts[inVertB * 3 + 0] + (inVerts[inVertA * 3 + 0] - inVerts[inVertB * 3 + 0]) * s;
		outVerts1[poly1Vert * 3 + 1] = inVerts[inVertB * 3 + 1] + (inVerts[inVertA * 3 + 1] - inVerts[inVertB * 3 + 1]) * s;
		outVerts1[poly1Vert * 3 + 2] = inVerts[inVertB * 3 + 2] + (inVerts[inVertA * 3 + 2] - inVerts[inVertB * 3 + 2]) * s;
		outVerts2[poly2Vert * 3 + 0] = outVerts1[poly1Vert * 3 + 0];
		outVerts2[poly2Vert * 3 + 1] = outVerts1[poly1Vert * 3 + 1];
		outVerts2[poly2Vert * 3 + 2] = outVerts1[poly1Vert * 3 + 2];
		poly1Vert++;
		poly2Vert++;
		if (inVertAxisDelta[inVertA] > 0) {
			outVerts1[poly1Vert * 3 + 0] = inVerts[inVertA * 3 + 0];
			outVerts1[poly1Vert * 3 + 1] = inVerts[inVertA * 3 + 1];
			outVerts1[poly1Vert * 3 + 2] = inVerts[inVertA * 3 + 2];
			poly1Vert++;
		} else if (inVertAxisDelta[inVertA] < 0) {
			outVerts2[poly2Vert * 3 + 0] = inVerts[inVertA * 3 + 0];
			outVerts2[poly2Vert * 3 + 1] = inVerts[inVertA * 3 + 1];
			outVerts2[poly2Vert * 3 + 2] = inVerts[inVertA * 3 + 2];
			poly2Vert++;
		}
	} else {
		if (inVertAxisDelta[inVertA] >= 0) {
			outVerts1[poly1Vert * 3 + 0] = inVerts[inVertA * 3 + 0];
			outVerts1[poly1Vert * 3 + 1] = inVerts[inVertA * 3 + 1];
			outVerts1[poly1Vert * 3 + 2] = inVerts[inVertA * 3 + 2];
			poly1Vert++;
			if (inVertAxisDelta[inVertA] !== 0) continue;
		}
		outVerts2[poly2Vert * 3 + 0] = inVerts[inVertA * 3 + 0];
		outVerts2[poly2Vert * 3 + 1] = inVerts[inVertA * 3 + 1];
		outVerts2[poly2Vert * 3 + 2] = inVerts[inVertA * 3 + 2];
		poly2Vert++;
	}
	out.nv1 = poly1Vert;
	out.nv2 = poly2Vert;
};
var _triangleBounds = create$2();
var _rasterize_triMin = create$3();
var _rasterize_triMax = create$3();
var _inVerts = new Array(21);
var _inRow = new Array(21);
var _p1 = new Array(21);
var _p2 = new Array(21);
var _inVertAxisDelta = new Array(12);
var _dividePolyResult = {
	nv1: 0,
	nv2: 0
};
var _v0$1 = create$3();
var _v1$1 = create$3();
var _v2$1 = create$3();
/**
* Rasterize a single triangle to the heightfield
*/
var rasterizeTriangle = (v0, v1, v2, areaID, heightfield, flagMergeThreshold) => {
	copy(_rasterize_triMin, v0);
	min$1(_rasterize_triMin, _rasterize_triMin, v1);
	min$1(_rasterize_triMin, _rasterize_triMin, v2);
	copy(_rasterize_triMax, v0);
	max$1(_rasterize_triMax, _rasterize_triMax, v1);
	max$1(_rasterize_triMax, _rasterize_triMax, v2);
	set(_triangleBounds, _rasterize_triMin[0], _rasterize_triMin[1], _rasterize_triMin[2], _rasterize_triMax[0], _rasterize_triMax[1], _rasterize_triMax[2]);
	if (!intersectsBox3(_triangleBounds, heightfield.bounds)) return true;
	const w = heightfield.width;
	const h = heightfield.height;
	const by = heightfield.bounds[4] - heightfield.bounds[1];
	const cellSize = heightfield.cellSize;
	const cellHeight = heightfield.cellHeight;
	const inverseCellSize = 1 / cellSize;
	const inverseCellHeight = 1 / cellHeight;
	let z0 = Math.floor((_rasterize_triMin[2] - heightfield.bounds[2]) * inverseCellSize);
	let z1 = Math.floor((_rasterize_triMax[2] - heightfield.bounds[2]) * inverseCellSize);
	z0 = clamp(z0, -1, h - 1);
	z1 = clamp(z1, 0, h - 1);
	let inVerts = _inVerts;
	let inRow = _inRow;
	let p1 = _p1;
	let p2 = _p2;
	inVerts[0] = v0[0];
	inVerts[1] = v0[1];
	inVerts[2] = v0[2];
	inVerts[3] = v1[0];
	inVerts[4] = v1[1];
	inVerts[5] = v1[2];
	inVerts[6] = v2[0];
	inVerts[7] = v2[1];
	inVerts[8] = v2[2];
	let nvIn = 3;
	for (let z = z0; z <= z1; ++z) {
		const cellZ = heightfield.bounds[2] + z * cellSize;
		dividePoly(_dividePolyResult, inVerts, nvIn, inRow, p1, cellZ + cellSize, 2);
		const nvRow = _dividePolyResult.nv1;
		const nvIn2 = _dividePolyResult.nv2;
		const temp = inVerts;
		inVerts = p1;
		p1 = temp;
		nvIn = nvIn2;
		if (nvRow < 3) continue;
		if (z < 0) continue;
		let minX = inRow[0];
		let maxX = inRow[0];
		for (let vert = 1; vert < nvRow; ++vert) {
			if (minX > inRow[vert * 3]) minX = inRow[vert * 3];
			if (maxX < inRow[vert * 3]) maxX = inRow[vert * 3];
		}
		let x0 = Math.floor((minX - heightfield.bounds[0]) * inverseCellSize);
		let x1 = Math.floor((maxX - heightfield.bounds[0]) * inverseCellSize);
		if (x1 < 0 || x0 >= w) continue;
		x0 = clamp(x0, -1, w - 1);
		x1 = clamp(x1, 0, w - 1);
		let nv2 = nvRow;
		for (let x = x0; x <= x1; ++x) {
			const cx = heightfield.bounds[0] + x * cellSize;
			dividePoly(_dividePolyResult, inRow, nv2, p1, p2, cx + cellSize, 0);
			const nv = _dividePolyResult.nv1;
			const nv2New = _dividePolyResult.nv2;
			const temp = inRow;
			inRow = p2;
			p2 = temp;
			nv2 = nv2New;
			if (nv < 3) continue;
			if (x < 0) continue;
			let spanMin = p1[1];
			let spanMax = p1[1];
			for (let vert = 1; vert < nv; ++vert) {
				spanMin = Math.min(spanMin, p1[vert * 3 + 1]);
				spanMax = Math.max(spanMax, p1[vert * 3 + 1]);
			}
			spanMin -= heightfield.bounds[1];
			spanMax -= heightfield.bounds[1];
			if (spanMax < 0) continue;
			if (spanMin > by) continue;
			if (spanMin < 0) spanMin = 0;
			if (spanMax > by) spanMax = by;
			const spanMinCellIndex = clamp(Math.floor(spanMin * inverseCellHeight), 0, SPAN_MAX_HEIGHT);
			const spanMaxCellIndex = clamp(Math.ceil(spanMax * inverseCellHeight), spanMinCellIndex + 1, SPAN_MAX_HEIGHT);
			if (!addHeightfieldSpan(heightfield, x, z, spanMinCellIndex, spanMaxCellIndex, areaID, flagMergeThreshold));
		}
	}
	return true;
};
var rasterizeTriangles = (ctx, heightfield, vertices, indices, triAreaIds, flagMergeThreshold = 1) => {
	BuildContext.start(ctx, "RASTERIZE_TRIANGLES");
	const numTris = indices.length / 3;
	for (let triIndex = 0; triIndex < numTris; ++triIndex) {
		const i0 = indices[triIndex * 3 + 0];
		const i1 = indices[triIndex * 3 + 1];
		const i2 = indices[triIndex * 3 + 2];
		const v0 = fromBuffer(_v0$1, vertices, i0 * 3);
		const v1 = fromBuffer(_v1$1, vertices, i1 * 3);
		const v2 = fromBuffer(_v2$1, vertices, i2 * 3);
		const areaId = triAreaIds[triIndex];
		if (!rasterizeTriangle(v0, v1, v2, areaId, heightfield, flagMergeThreshold)) {
			BuildContext.error(ctx, "Failed to rasterize triangle");
			BuildContext.end(ctx, "RASTERIZE_TRIANGLES");
			return false;
		}
	}
	BuildContext.end(ctx, "RASTERIZE_TRIANGLES");
	return true;
};
var filterLowHangingWalkableObstacles = (heightfield, walkableClimb) => {
	const xSize = heightfield.width;
	const zSize = heightfield.height;
	for (let z = 0; z < zSize; ++z) for (let x = 0; x < xSize; ++x) {
		let previousSpan = null;
		let previousWasWalkable = false;
		let previousAreaID = 0;
		const columnIndex = x + z * xSize;
		let span = heightfield.spans[columnIndex];
		while (span !== null) {
			const walkable = span.area !== 0;
			if (!walkable && previousWasWalkable && previousSpan && span.max - previousSpan.max <= walkableClimb) span.area = previousAreaID;
			previousWasWalkable = walkable;
			previousAreaID = span.area;
			previousSpan = span;
			span = span.next;
		}
	}
};
var filterLedgeSpans = (heightfield, walkableHeight, walkableClimb) => {
	const xSize = heightfield.width;
	const zSize = heightfield.height;
	for (let z = 0; z < zSize; ++z) for (let x = 0; x < xSize; ++x) {
		const columnIndex = x + z * xSize;
		let span = heightfield.spans[columnIndex];
		while (span !== null) {
			if (span.area === 0) {
				span = span.next;
				continue;
			}
			const floor = span.max;
			const ceiling = span.next ? span.next.min : MAX_HEIGHTFIELD_HEIGHT;
			let lowestNeighborFloorDifference = MAX_HEIGHTFIELD_HEIGHT;
			let lowestTraversableNeighborFloor = span.max;
			let highestTraversableNeighborFloor = span.max;
			for (let direction = 0; direction < 4; ++direction) {
				const neighborX = x + getDirOffsetX(direction);
				const neighborZ = z + getDirOffsetY(direction);
				if (neighborX < 0 || neighborZ < 0 || neighborX >= xSize || neighborZ >= zSize) {
					lowestNeighborFloorDifference = -walkableClimb - 1;
					break;
				}
				const neighborColumnIndex = neighborX + neighborZ * xSize;
				let neighborSpan = heightfield.spans[neighborColumnIndex];
				let neighborCeiling = neighborSpan ? neighborSpan.min : MAX_HEIGHTFIELD_HEIGHT;
				if (Math.min(ceiling, neighborCeiling) - floor >= walkableHeight) {
					lowestNeighborFloorDifference = -walkableClimb - 1;
					break;
				}
				while (neighborSpan !== null) {
					const neighborFloor = neighborSpan.max;
					neighborCeiling = neighborSpan.next ? neighborSpan.next.min : MAX_HEIGHTFIELD_HEIGHT;
					if (Math.min(ceiling, neighborCeiling) - Math.max(floor, neighborFloor) < walkableHeight) {
						neighborSpan = neighborSpan.next;
						continue;
					}
					const neighborFloorDifference = neighborFloor - floor;
					lowestNeighborFloorDifference = Math.min(lowestNeighborFloorDifference, neighborFloorDifference);
					if (Math.abs(neighborFloorDifference) <= walkableClimb) {
						lowestTraversableNeighborFloor = Math.min(lowestTraversableNeighborFloor, neighborFloor);
						highestTraversableNeighborFloor = Math.max(highestTraversableNeighborFloor, neighborFloor);
					} else if (neighborFloorDifference < -walkableClimb) break;
					neighborSpan = neighborSpan.next;
				}
			}
			if (lowestNeighborFloorDifference < -walkableClimb) span.area = 0;
			else if (highestTraversableNeighborFloor - lowestTraversableNeighborFloor > walkableClimb) span.area = 0;
			span = span.next;
		}
	}
};
var filterWalkableLowHeightSpans = (heightfield, walkableHeight) => {
	const xSize = heightfield.width;
	const zSize = heightfield.height;
	for (let z = 0; z < zSize; ++z) for (let x = 0; x < xSize; ++x) {
		const columnIndex = x + z * xSize;
		let span = heightfield.spans[columnIndex];
		while (span !== null) {
			const floor = span.max;
			if ((span.next ? span.next.min : MAX_HEIGHTFIELD_HEIGHT) - floor < walkableHeight) span.area = 0;
			span = span.next;
		}
	}
};
new Array(24);
var _edge0 = create$3();
var _edge1 = create$3();
/**
* Calculates the normal vector of a triangle
* @param inV0 First vertex [x, y, z]
* @param inV1 Second vertex [x, y, z]
* @param inV2 Third vertex [x, y, z]
* @param outFaceNormal Output normal vector [x, y, z]
*/
var calcTriNormal = (inV0, inV1, inV2, outFaceNormal) => {
	subtract(_edge0, inV1, inV0);
	subtract(_edge1, inV2, inV0);
	cross(outFaceNormal, _edge0, _edge1);
	normalize(outFaceNormal, outFaceNormal);
};
var _triangleNormal = create$3();
var _v0 = create$3();
var _v1 = create$3();
var _v2 = create$3();
/**
* Marks triangles as walkable based on their slope angle
* @param inVertices Array of vertex coordinates [x0, y0, z0, x1, y1, z1, ...]
* @param inIndices Array of triangle indices [i0, i1, i2, i3, i4, i5, ...]
* @param outTriAreaIds Output array of triangle area IDs, with a length equal to inIndices.length / 3
* @param walkableSlopeAngle Maximum walkable slope angle in degrees (default: 45)
*/
var markWalkableTriangles = (inVertices, inIndices, outTriAreaIds, walkableSlopeAngle = 45) => {
	const walkableThr = Math.cos(walkableSlopeAngle / 180 * Math.PI);
	const numTris = inIndices.length / 3;
	for (let i = 0; i < numTris; ++i) {
		const triStartIndex = i * 3;
		const i0 = inIndices[triStartIndex];
		const i1 = inIndices[triStartIndex + 1];
		const i2 = inIndices[triStartIndex + 2];
		calcTriNormal(fromBuffer(_v0, inVertices, i0 * 3), fromBuffer(_v1, inVertices, i1 * 3), fromBuffer(_v2, inVertices, i2 * 3), _triangleNormal);
		if (_triangleNormal[1] > walkableThr) outTriAreaIds[i] = 1;
	}
};
var calculateMeshBounds = (outBounds, inVertices, inIndices) => {
	outBounds[0] = Number.POSITIVE_INFINITY;
	outBounds[1] = Number.POSITIVE_INFINITY;
	outBounds[2] = Number.POSITIVE_INFINITY;
	outBounds[3] = Number.NEGATIVE_INFINITY;
	outBounds[4] = Number.NEGATIVE_INFINITY;
	outBounds[5] = Number.NEGATIVE_INFINITY;
	const numTris = inIndices.length / 3;
	for (let i = 0; i < numTris; ++i) {
		const triStartIndex = i * 3;
		for (let j = 0; j < 3; ++j) {
			const index = inIndices[triStartIndex + j];
			const x = inVertices[index * 3];
			const y = inVertices[index * 3 + 1];
			const z = inVertices[index * 3 + 2];
			outBounds[0] = Math.min(outBounds[0], x);
			outBounds[1] = Math.min(outBounds[1], y);
			outBounds[2] = Math.min(outBounds[2], z);
			outBounds[3] = Math.max(outBounds[3], x);
			outBounds[4] = Math.max(outBounds[4], y);
			outBounds[5] = Math.max(outBounds[5], z);
		}
	}
	return outBounds;
};
var buildPolyNeighbours = (polys, vertices, borderSize, minX, minZ, maxX, maxZ) => {
	for (const poly of polys) poly.neis = new Array(poly.vertices.length).fill(-1);
	buildMeshAdjacency(polys, vertices.length / 3);
	if (borderSize > 0) findPortalEdges(polys, vertices, minX, minZ, maxX, maxZ);
	finalizePolyNeighbours(polys);
};
/**
* Finds polygon edge neighbours, populates the neis array for each polygon.
*/
var buildMeshAdjacency = (polys, vertexCount) => {
	const polygonCount = polys.length;
	const maxEdgeCount = polys.reduce((sum, poly) => sum + poly.vertices.length, 0);
	const firstEdge = new Array(vertexCount).fill(-1);
	const nextEdge = new Array(maxEdgeCount).fill(-1);
	let edgeCount = 0;
	const edges = [];
	for (let i = 0; i < vertexCount; i++) firstEdge[i] = -1;
	for (let i = 0; i < polygonCount; i++) {
		const poly = polys[i];
		for (let j = 0; j < poly.vertices.length; j++) {
			const v0 = poly.vertices[j];
			const v1 = poly.vertices[(j + 1) % poly.vertices.length];
			if (v0 < v1) {
				edges[edgeCount] = {
					vert: [v0, v1],
					poly: [i, i],
					polyEdge: [j, 0]
				};
				nextEdge[edgeCount] = firstEdge[v0];
				firstEdge[v0] = edgeCount;
				edgeCount++;
			}
		}
	}
	for (let i = 0; i < polygonCount; i++) {
		const poly = polys[i];
		for (let j = 0; j < poly.vertices.length; j++) {
			const v0 = poly.vertices[j];
			const v1 = poly.vertices[(j + 1) % poly.vertices.length];
			if (v0 > v1) for (let e = firstEdge[v1]; e !== -1; e = nextEdge[e]) {
				const edge = edges[e];
				if (edge.vert[1] === v0 && edge.poly[0] === edge.poly[1]) {
					edge.poly[1] = i;
					edge.polyEdge[1] = j;
					break;
				}
			}
		}
	}
	for (let i = 0; i < edgeCount; i++) {
		const e = edges[i];
		if (e.poly[0] !== e.poly[1]) {
			polys[e.poly[0]].neis[e.polyEdge[0]] = e.poly[1];
			polys[e.poly[1]].neis[e.polyEdge[1]] = e.poly[0];
		}
	}
};
var findPortalEdges = (polys, vertices, minX, minZ, maxX, maxZ) => {
	const va = [
		0,
		0,
		0
	];
	const vb = [
		0,
		0,
		0
	];
	for (let i = 0; i < polys.length; i++) {
		const poly = polys[i];
		for (let j = 0; j < poly.vertices.length; j++) {
			if (poly.neis[j] !== -1) continue;
			const nj = (j + 1) % poly.vertices.length;
			va[0] = vertices[poly.vertices[j] * 3];
			va[1] = vertices[poly.vertices[j] * 3 + 1];
			va[2] = vertices[poly.vertices[j] * 3 + 2];
			vb[0] = vertices[poly.vertices[nj] * 3];
			vb[1] = vertices[poly.vertices[nj] * 3 + 1];
			vb[2] = vertices[poly.vertices[nj] * 3 + 2];
			if (va[0] === minX && vb[0] === minX) poly.neis[j] = 32768;
			else if (va[2] === maxZ && vb[2] === maxZ) poly.neis[j] = 32769;
			else if (va[0] === maxX && vb[0] === maxX) poly.neis[j] = 32770;
			else if (va[2] === minZ && vb[2] === minZ) poly.neis[j] = 32771;
		}
	}
};
var finalizePolyNeighbours = (polys) => {
	for (const poly of polys) for (let i = 0; i < poly.neis.length; i++) {
		const neiValue = poly.neis[i];
		if (neiValue & 32768) {
			const dir = neiValue & 15;
			if (dir === 15) poly.neis[i] = 0;
			else if (dir === 0) poly.neis[i] = 32772;
			else if (dir === 1) poly.neis[i] = 32770;
			else if (dir === 2) poly.neis[i] = 32768;
			else if (dir === 3) poly.neis[i] = 32774;
			else poly.neis[i] = 0;
		} else poly.neis[i] = neiValue + 1;
	}
};
var polyMeshToTilePolys = (polyMesh) => {
	const vertices = polyMesh.vertices.slice();
	const nvp = polyMesh.maxVerticesPerPoly;
	const nPolys = polyMesh.nPolys;
	const polys = [];
	for (let i = 0; i < nPolys; i++) {
		const poly = {
			vertices: [],
			neis: [],
			flags: polyMesh.flags[i],
			area: polyMesh.areas[i]
		};
		const polyStart = i * nvp;
		for (let j = 0; j < nvp; j++) {
			const vertIndex = polyMesh.polys[polyStart + j];
			if (vertIndex === -1) break;
			poly.vertices.push(vertIndex);
		}
		polys.push(poly);
	}
	buildPolyNeighbours(polys, vertices, polyMesh.borderSize, 0, 0, polyMesh.localWidth, polyMesh.localHeight);
	for (let i = 0; i < vertices.length; i += 3) {
		vertices[i] = polyMesh.bounds[0] + vertices[i] * polyMesh.cellSize;
		vertices[i + 1] = polyMesh.bounds[1] + vertices[i + 1] * polyMesh.cellHeight;
		vertices[i + 2] = polyMesh.bounds[2] + vertices[i + 2] * polyMesh.cellSize;
	}
	return {
		vertices,
		polys
	};
};
/**
* Converts a given PolyMeshDetail to the tile detail mesh format.
* @param polys
* @param polyMeshDetail
* @returns
*/
var polyMeshDetailToTileDetailMesh = (polys, polyMeshDetail) => {
	const detailMeshes = [];
	const detailVertices = [];
	let vbase = 0;
	for (let i = 0; i < polys.length; i++) {
		const nPolyVertices = polys[i].vertices.length;
		const vb = polyMeshDetail.meshes[i * 4];
		const nDetailVertices = polyMeshDetail.meshes[i * 4 + 1];
		const trianglesBase = polyMeshDetail.meshes[i * 4 + 2];
		const trianglesCount = polyMeshDetail.meshes[i * 4 + 3];
		const nAdditionalDetailVertices = nDetailVertices - nPolyVertices;
		detailMeshes[i] = {
			verticesBase: vbase,
			verticesCount: nAdditionalDetailVertices,
			trianglesBase,
			trianglesCount
		};
		if (nAdditionalDetailVertices > 0) {
			for (let j = nPolyVertices; j < nDetailVertices; j++) {
				const detailVertIndex = (vb + j) * 3;
				detailVertices.push(polyMeshDetail.vertices[detailVertIndex], polyMeshDetail.vertices[detailVertIndex + 1], polyMeshDetail.vertices[detailVertIndex + 2]);
			}
			vbase += nAdditionalDetailVertices;
		}
	}
	return {
		detailMeshes,
		detailVertices,
		detailTriangles: polyMeshDetail.triangles
	};
};
var VERTEX_Y_TOLERANCE = 2;
var addVertex = (x, y, z, vertices, vflags, vertexMap) => {
	const keyXZ = `${x},${z}`;
	const bucket = vertexMap[keyXZ];
	if (bucket) for (let i = 0; i < bucket.length; i++) {
		const [entryY, idx] = bucket[i];
		if (Math.abs(entryY - y) <= VERTEX_Y_TOLERANCE) return idx;
	}
	const i = Math.floor(vertices.length / 3);
	vertices.push(x, y, z);
	const newEntry = [y, i];
	if (bucket) bucket.push(newEntry);
	else vertexMap[keyXZ] = [newEntry];
	vflags.push(0);
	return i;
};
var prev$1 = (i, n) => i - 1 >= 0 ? i - 1 : n - 1;
var next$1 = (i, n) => i + 1 < n ? i + 1 : 0;
var area2 = (vertexA, vertexB, vertexC) => {
	return (vertexB[0] - vertexA[0]) * (vertexC[2] - vertexA[2]) - (vertexC[0] - vertexA[0]) * (vertexB[2] - vertexA[2]);
};
var xorb = (x, y) => !x !== !y;
var left = (firstVertex, secondVertex, testVertex) => area2(firstVertex, secondVertex, testVertex) < 0;
var leftOn = (firstVertex, secondVertex, testVertex) => area2(firstVertex, secondVertex, testVertex) <= 0;
var collinear = (firstVertex, secondVertex, testVertex) => area2(firstVertex, secondVertex, testVertex) === 0;
var intersectProp = (segmentAStart, segmentAEnd, segmentBStart, segmentBEnd) => {
	if (collinear(segmentAStart, segmentAEnd, segmentBStart) || collinear(segmentAStart, segmentAEnd, segmentBEnd) || collinear(segmentBStart, segmentBEnd, segmentAStart) || collinear(segmentBStart, segmentBEnd, segmentAEnd)) return false;
	return xorb(left(segmentAStart, segmentAEnd, segmentBStart), left(segmentAStart, segmentAEnd, segmentBEnd)) && xorb(left(segmentBStart, segmentBEnd, segmentAStart), left(segmentBStart, segmentBEnd, segmentAEnd));
};
var between = (startVertex, endVertex, testVertex) => {
	if (!collinear(startVertex, endVertex, testVertex)) return false;
	if (startVertex[0] !== endVertex[0]) return startVertex[0] <= testVertex[0] && testVertex[0] <= endVertex[0] || startVertex[0] >= testVertex[0] && testVertex[0] >= endVertex[0];
	return startVertex[2] <= testVertex[2] && testVertex[2] <= endVertex[2] || startVertex[2] >= testVertex[2] && testVertex[2] >= endVertex[2];
};
var intersect = (segmentAStart, segmentAEnd, segmentBStart, segmentBEnd) => {
	if (intersectProp(segmentAStart, segmentAEnd, segmentBStart, segmentBEnd)) return true;
	return between(segmentAStart, segmentAEnd, segmentBStart) || between(segmentAStart, segmentAEnd, segmentBEnd) || between(segmentBStart, segmentBEnd, segmentAStart) || between(segmentBStart, segmentBEnd, segmentAEnd);
};
var vec3EqualXZ = (vertexA, vertexB) => vertexA[0] === vertexB[0] && vertexA[2] === vertexB[2];
var _diagonalStart = create$3();
var _diagonalEnd = create$3();
var _edgeStart = create$3();
var _edgeEnd = create$3();
var diagonalie = (startVertexIdx, endVertexIdx, polygonVertexCount, vertices, vertexIndices) => {
	const diagonalStart = fromBuffer(_diagonalStart, vertices, (vertexIndices[startVertexIdx] & 268435455) * 4);
	const diagonalEnd = fromBuffer(_diagonalEnd, vertices, (vertexIndices[endVertexIdx] & 268435455) * 4);
	for (let k = 0; k < polygonVertexCount; k++) {
		const k1 = next$1(k, polygonVertexCount);
		if (!(k === startVertexIdx || k1 === startVertexIdx || k === endVertexIdx || k1 === endVertexIdx)) {
			const edgeStart = fromBuffer(_edgeStart, vertices, (vertexIndices[k] & 268435455) * 4);
			const edgeEnd = fromBuffer(_edgeEnd, vertices, (vertexIndices[k1] & 268435455) * 4);
			if (vec3EqualXZ(diagonalStart, edgeStart) || vec3EqualXZ(diagonalEnd, edgeStart) || vec3EqualXZ(diagonalStart, edgeEnd) || vec3EqualXZ(diagonalEnd, edgeEnd)) continue;
			if (intersect(diagonalStart, diagonalEnd, edgeStart, edgeEnd)) return false;
		}
	}
	return true;
};
var _coneVertex = create$3();
var _testVertex = create$3();
var _nextVertex = create$3();
var _prevVertex = create$3();
var inCone = (coneVertexIdx, testVertexIdx, polygonVertexCount, vertices, vertexIndices) => {
	const coneVertex = fromBuffer(_coneVertex, vertices, (vertexIndices[coneVertexIdx] & 268435455) * 4);
	const testVertex = fromBuffer(_testVertex, vertices, (vertexIndices[testVertexIdx] & 268435455) * 4);
	const nextVertex = fromBuffer(_nextVertex, vertices, (vertexIndices[next$1(coneVertexIdx, polygonVertexCount)] & 268435455) * 4);
	const prevVertex = fromBuffer(_prevVertex, vertices, (vertexIndices[prev$1(coneVertexIdx, polygonVertexCount)] & 268435455) * 4);
	if (leftOn(prevVertex, coneVertex, nextVertex)) return left(coneVertex, testVertex, prevVertex) && left(testVertex, coneVertex, nextVertex);
	return !(leftOn(coneVertex, testVertex, nextVertex) && leftOn(testVertex, coneVertex, prevVertex));
};
var diagonal = (startVertexIdx, endVertexIdx, polygonVertexCount, vertices, vertexIndices) => {
	return inCone(startVertexIdx, endVertexIdx, polygonVertexCount, vertices, vertexIndices) && diagonalie(startVertexIdx, endVertexIdx, polygonVertexCount, vertices, vertexIndices);
};
var diagonalieLoose = (startVertexIdx, endVertexIdx, polygonVertexCount, vertices, vertexIndices) => {
	const diagonalStart = fromBuffer(_diagonalStart, vertices, (vertexIndices[startVertexIdx] & 268435455) * 4);
	const diagonalEnd = fromBuffer(_diagonalEnd, vertices, (vertexIndices[endVertexIdx] & 268435455) * 4);
	for (let k = 0; k < polygonVertexCount; k++) {
		const k1 = next$1(k, polygonVertexCount);
		if (!(k === startVertexIdx || k1 === startVertexIdx || k === endVertexIdx || k1 === endVertexIdx)) {
			const edgeStart = fromBuffer(_edgeStart, vertices, (vertexIndices[k] & 268435455) * 4);
			const edgeEnd = fromBuffer(_edgeEnd, vertices, (vertexIndices[k1] & 268435455) * 4);
			if (vec3EqualXZ(diagonalStart, edgeStart) || vec3EqualXZ(diagonalEnd, edgeStart) || vec3EqualXZ(diagonalStart, edgeEnd) || vec3EqualXZ(diagonalEnd, edgeEnd)) continue;
			if (intersectProp(diagonalStart, diagonalEnd, edgeStart, edgeEnd)) return false;
		}
	}
	return true;
};
var inConeLoose = (coneVertexIdx, testVertexIdx, polygonVertexCount, vertices, vertexIndices) => {
	const coneVertex = fromBuffer(_coneVertex, vertices, (vertexIndices[coneVertexIdx] & 268435455) * 4);
	const testVertex = fromBuffer(_testVertex, vertices, (vertexIndices[testVertexIdx] & 268435455) * 4);
	const nextVertex = fromBuffer(_nextVertex, vertices, (vertexIndices[next$1(coneVertexIdx, polygonVertexCount)] & 268435455) * 4);
	const prevVertex = fromBuffer(_prevVertex, vertices, (vertexIndices[prev$1(coneVertexIdx, polygonVertexCount)] & 268435455) * 4);
	if (leftOn(prevVertex, coneVertex, nextVertex)) return leftOn(coneVertex, testVertex, prevVertex) && leftOn(testVertex, coneVertex, nextVertex);
	return !(leftOn(coneVertex, testVertex, nextVertex) && leftOn(testVertex, coneVertex, prevVertex));
};
var diagonalLoose = (startVertexIdx, endVertexIdx, polygonVertexCount, vertices, vertexIndices) => {
	return inConeLoose(startVertexIdx, endVertexIdx, polygonVertexCount, vertices, vertexIndices) && diagonalieLoose(startVertexIdx, endVertexIdx, polygonVertexCount, vertices, vertexIndices);
};
var _triangulateP0 = create$3();
var _triangulateP2 = create$3();
var triangulate = (polygonVertexCount, vertices, vertexIndices, triangleIndices) => {
	let ntris = 0;
	let dst = 0;
	for (let i = 0; i < polygonVertexCount; i++) {
		const i1 = next$1(i, polygonVertexCount);
		const i2 = next$1(i1, polygonVertexCount);
		if (diagonal(i, i2, polygonVertexCount, vertices, vertexIndices)) vertexIndices[i1] |= 2147483648;
	}
	let nv = polygonVertexCount;
	while (nv > 3) {
		let minLen = -1;
		let mini = -1;
		for (let i = 0; i < nv; i++) {
			const i1 = next$1(i, nv);
			if (vertexIndices[i1] & 2147483648) {
				const p0 = fromBuffer(_triangulateP0, vertices, (vertexIndices[i] & 268435455) * 4);
				const p2 = fromBuffer(_triangulateP2, vertices, (vertexIndices[next$1(i1, nv)] & 268435455) * 4);
				const dx = p2[0] - p0[0];
				const dy = p2[2] - p0[2];
				const len = dx * dx + dy * dy;
				if (minLen < 0 || len < minLen) {
					minLen = len;
					mini = i;
				}
			}
		}
		if (mini === -1) {
			for (let i = 0; i < nv; i++) {
				const i2 = next$1(next$1(i, nv), nv);
				if (diagonalLoose(i, i2, nv, vertices, vertexIndices)) {
					const p0 = fromBuffer(_triangulateP0, vertices, (vertexIndices[i] & 268435455) * 4);
					const p2 = fromBuffer(_triangulateP2, vertices, (vertexIndices[next$1(i2, nv)] & 268435455) * 4);
					const dx = p2[0] - p0[0];
					const dy = p2[2] - p0[2];
					const len = dx * dx + dy * dy;
					if (minLen < 0 || len < minLen) {
						minLen = len;
						mini = i;
					}
				}
			}
			if (mini === -1) return -ntris;
		}
		const i = mini;
		let i1 = next$1(i, nv);
		const i2 = next$1(i1, nv);
		triangleIndices[dst++] = vertexIndices[i] & 268435455;
		triangleIndices[dst++] = vertexIndices[i1] & 268435455;
		triangleIndices[dst++] = vertexIndices[i2] & 268435455;
		ntris++;
		nv--;
		for (let k = i1; k < nv; k++) vertexIndices[k] = vertexIndices[k + 1];
		if (i1 >= nv) i1 = 0;
		const iPrev = prev$1(i1, nv);
		if (diagonal(prev$1(iPrev, nv), i1, nv, vertices, vertexIndices)) vertexIndices[iPrev] |= 2147483648;
		else vertexIndices[iPrev] &= 268435455;
		if (diagonal(iPrev, next$1(i1, nv), nv, vertices, vertexIndices)) vertexIndices[i1] |= 2147483648;
		else vertexIndices[i1] &= 268435455;
	}
	triangleIndices[dst++] = vertexIndices[0] & 268435455;
	triangleIndices[dst++] = vertexIndices[1] & 268435455;
	triangleIndices[dst++] = vertexIndices[2] & 268435455;
	ntris++;
	return ntris;
};
var countPolyVerts = (polygons, polyStartIdx, maxVerticesPerPoly) => {
	for (let i = 0; i < maxVerticesPerPoly; i++) if (polygons[polyStartIdx + i] === -1) return i;
	return maxVerticesPerPoly;
};
var uleft = (firstVertex, secondVertex, testVertex) => {
	return (secondVertex[0] - firstVertex[0]) * (testVertex[2] - firstVertex[2]) - (testVertex[0] - firstVertex[0]) * (secondVertex[2] - firstVertex[2]) < 0;
};
var getPolyMergeValue = (polygons, polyAStartIdx, polyBStartIdx, vertices, maxVerticesPerPoly) => {
	const numVertsA = countPolyVerts(polygons, polyAStartIdx, maxVerticesPerPoly);
	const numVertsB = countPolyVerts(polygons, polyBStartIdx, maxVerticesPerPoly);
	if (numVertsA + numVertsB - 2 > maxVerticesPerPoly) return {
		value: -1,
		ea: -1,
		eb: -1
	};
	let ea = -1;
	let eb = -1;
	for (let i = 0; i < numVertsA; i++) {
		let va0 = polygons[polyAStartIdx + i];
		let va1 = polygons[polyAStartIdx + (i + 1) % numVertsA];
		if (va0 > va1) [va0, va1] = [va1, va0];
		for (let j = 0; j < numVertsB; j++) {
			let vb0 = polygons[polyBStartIdx + j];
			let vb1 = polygons[polyBStartIdx + (j + 1) % numVertsB];
			if (vb0 > vb1) [vb0, vb1] = [vb1, vb0];
			if (va0 === vb0 && va1 === vb1) {
				ea = i;
				eb = j;
				break;
			}
		}
	}
	if (ea === -1 || eb === -1) return {
		value: -1,
		ea: -1,
		eb: -1
	};
	const va = polygons[polyAStartIdx + (ea + numVertsA - 1) % numVertsA];
	const vb = polygons[polyAStartIdx + ea];
	const vc = polygons[polyBStartIdx + (eb + 2) % numVertsB];
	if (!uleft([
		vertices[va * 3],
		0,
		vertices[va * 3 + 2]
	], [
		vertices[vb * 3],
		0,
		vertices[vb * 3 + 2]
	], [
		vertices[vc * 3],
		0,
		vertices[vc * 3 + 2]
	])) return {
		value: -1,
		ea: -1,
		eb: -1
	};
	const va2 = polygons[polyBStartIdx + (eb + numVertsB - 1) % numVertsB];
	const vb2 = polygons[polyBStartIdx + eb];
	const vc2 = polygons[polyAStartIdx + (ea + 2) % numVertsA];
	if (!uleft([
		vertices[va2 * 3],
		0,
		vertices[va2 * 3 + 2]
	], [
		vertices[vb2 * 3],
		0,
		vertices[vb2 * 3 + 2]
	], [
		vertices[vc2 * 3],
		0,
		vertices[vc2 * 3 + 2]
	])) return {
		value: -1,
		ea: -1,
		eb: -1
	};
	const vaEdge = polygons[polyAStartIdx + ea];
	const vbEdge = polygons[polyAStartIdx + (ea + 1) % numVertsA];
	const dx = vertices[vaEdge * 3] - vertices[vbEdge * 3];
	const dy = vertices[vaEdge * 3 + 2] - vertices[vbEdge * 3 + 2];
	return {
		value: dx * dx + dy * dy,
		ea,
		eb
	};
};
var mergePolyVerts = (polygons, polyAStartIdx, polyBStartIdx, edgeIdxA, edgeIdxB, tempStartIdx, maxVerticesPerPoly) => {
	const numVertsA = countPolyVerts(polygons, polyAStartIdx, maxVerticesPerPoly);
	const numVertsB = countPolyVerts(polygons, polyBStartIdx, maxVerticesPerPoly);
	for (let i = 0; i < maxVerticesPerPoly; i++) polygons[tempStartIdx + i] = -1;
	let n = 0;
	for (let i = 0; i < numVertsA - 1; i++) polygons[tempStartIdx + n++] = polygons[polyAStartIdx + (edgeIdxA + 1 + i) % numVertsA];
	for (let i = 0; i < numVertsB - 1; i++) polygons[tempStartIdx + n++] = polygons[polyBStartIdx + (edgeIdxB + 1 + i) % numVertsB];
	for (let i = 0; i < maxVerticesPerPoly; i++) polygons[polyAStartIdx + i] = polygons[tempStartIdx + i];
};
var buildPolyMesh = (ctx, contourSet, maxVerticesPerPoly) => {
	let maxVertsPerCont = 0;
	for (let i = 0; i < contourSet.contours.length; i++) {
		const contour = contourSet.contours[i];
		if (contour.nVertices < 3) continue;
		maxVertsPerCont = Math.max(maxVertsPerCont, contour.nVertices);
	}
	const mesh = {
		vertices: [],
		polys: [],
		regions: [],
		flags: [],
		areas: [],
		nVertices: 0,
		nPolys: 0,
		maxVerticesPerPoly,
		bounds: clone(contourSet.bounds),
		localWidth: contourSet.width,
		localHeight: contourSet.height,
		cellSize: contourSet.cellSize,
		cellHeight: contourSet.cellHeight,
		borderSize: contourSet.borderSize,
		maxEdgeError: contourSet.maxError
	};
	const vflags = [];
	const vertexMap = {};
	const indices = new Array(maxVertsPerCont);
	const tris = new Array(maxVertsPerCont * 3);
	const polys = new Array((maxVertsPerCont + 1) * maxVerticesPerPoly).fill(-1);
	const tmpPolyStart = maxVertsPerCont * maxVerticesPerPoly;
	for (let i = 0; i < contourSet.contours.length; i++) {
		const cont = contourSet.contours[i];
		if (cont.nVertices < 3) continue;
		for (let j = 0; j < cont.nVertices; j++) indices[j] = j;
		let ntris = triangulate(cont.nVertices, cont.vertices, indices, tris);
		if (ntris <= 0) {
			BuildContext.warn(ctx, `Bad triangulation for contour ${i}`);
			ntris = Math.abs(ntris);
		}
		for (let j = 0; j < cont.nVertices; j++) {
			const x = cont.vertices[j * 4];
			const y = cont.vertices[j * 4 + 1];
			const z = cont.vertices[j * 4 + 2];
			const flags = cont.vertices[j * 4 + 3];
			const idx = addVertex(x, y, z, mesh.vertices, vflags, vertexMap);
			indices[j] = idx;
			if (flags & 65536) vflags[idx] = 1;
		}
		let npolys = 0;
		polys.fill(-1, 0, maxVertsPerCont * maxVerticesPerPoly);
		for (let j = 0; j < ntris; j++) {
			const t = [
				tris[j * 3],
				tris[j * 3 + 1],
				tris[j * 3 + 2]
			];
			if (t[0] !== t[1] && t[0] !== t[2] && t[1] !== t[2]) {
				polys[npolys * maxVerticesPerPoly] = indices[t[0]];
				polys[npolys * maxVerticesPerPoly + 1] = indices[t[1]];
				polys[npolys * maxVerticesPerPoly + 2] = indices[t[2]];
				npolys++;
			}
		}
		if (npolys === 0) continue;
		if (maxVerticesPerPoly > 3) while (true) {
			let bestMergeVal = 0;
			let bestPa = 0;
			let bestPb = 0;
			let bestEa = 0;
			let bestEb = 0;
			for (let j = 0; j < npolys - 1; j++) for (let k = j + 1; k < npolys; k++) {
				const result = getPolyMergeValue(polys, j * maxVerticesPerPoly, k * maxVerticesPerPoly, mesh.vertices, maxVerticesPerPoly);
				if (result.value > bestMergeVal) {
					bestMergeVal = result.value;
					bestPa = j;
					bestPb = k;
					bestEa = result.ea;
					bestEb = result.eb;
				}
			}
			if (bestMergeVal > 0) {
				const paStart = bestPa * maxVerticesPerPoly;
				const pbStart = bestPb * maxVerticesPerPoly;
				mergePolyVerts(polys, paStart, pbStart, bestEa, bestEb, tmpPolyStart, maxVerticesPerPoly);
				for (let m = 0; m < maxVerticesPerPoly; m++) polys[pbStart + m] = polys[(npolys - 1) * maxVerticesPerPoly + m];
				npolys--;
			} else break;
		}
		for (let j = 0; j < npolys; j++) {
			const pStart = mesh.nPolys * maxVerticesPerPoly;
			const qStart = j * maxVerticesPerPoly;
			for (let k = 0; k < maxVerticesPerPoly; k++) mesh.polys[pStart + k] = polys[qStart + k];
			mesh.regions[mesh.nPolys] = cont.reg;
			mesh.areas[mesh.nPolys] = cont.area;
			mesh.nPolys++;
		}
	}
	mesh.nVertices = Math.floor(mesh.vertices.length / 3);
	for (let i = 0; i < mesh.nVertices; i++) if (vflags[i]) {
		if (!canRemoveVertex(mesh, i)) continue;
		if (removeVertex(ctx, mesh, i)) {
			for (let j = i; j < mesh.nVertices; j++) vflags[j] = vflags[j + 1];
			i--;
		} else BuildContext.error(ctx, `Failed to remove edge vertex ${i}`);
	}
	mesh.polys.length = mesh.nPolys * maxVerticesPerPoly;
	mesh.regions.length = mesh.nPolys;
	mesh.vertices.length = mesh.nVertices * 3;
	mesh.flags = new Array(mesh.nPolys).fill(0);
	return mesh;
};
var canRemoveVertex = (mesh, remVertexIdx) => {
	const nvp = mesh.maxVerticesPerPoly;
	let numTouchedVerts = 0;
	let numRemainingEdges = 0;
	for (let i = 0; i < mesh.nPolys; i++) {
		const polyStart = i * nvp;
		const nv = countPolyVerts(mesh.polys, polyStart, nvp);
		let numRemoved = 0;
		let numVerts = 0;
		for (let j = 0; j < nv; j++) {
			if (mesh.polys[polyStart + j] === remVertexIdx) {
				numTouchedVerts++;
				numRemoved++;
			}
			numVerts++;
		}
		if (numRemoved) numRemainingEdges += numVerts - (numRemoved + 1);
	}
	if (numRemainingEdges <= 2) return false;
	const maxEdges = numTouchedVerts * 2;
	const edges = new Array(maxEdges * 3);
	let nedges = 0;
	for (let i = 0; i < mesh.nPolys; i++) {
		const polyStart = i * nvp;
		const nv = countPolyVerts(mesh.polys, polyStart, nvp);
		for (let j = 0, k = nv - 1; j < nv; k = j++) if (mesh.polys[polyStart + j] === remVertexIdx || mesh.polys[polyStart + k] === remVertexIdx) {
			let a = mesh.polys[polyStart + j];
			let b = mesh.polys[polyStart + k];
			if (b === remVertexIdx) {
				const tmp = a;
				a = b;
				b = tmp;
			}
			let exists = false;
			for (let m = 0; m < nedges; m++) {
				const e = m * 3;
				if (edges[e + 1] === b) {
					edges[e + 2]++;
					exists = true;
					break;
				}
			}
			if (!exists) {
				const e = nedges * 3;
				edges[e] = a;
				edges[e + 1] = b;
				edges[e + 2] = 1;
				nedges++;
			}
		}
	}
	let numOpenEdges = 0;
	for (let i = 0; i < nedges; i++) if (edges[i * 3 + 2] < 2) numOpenEdges++;
	return numOpenEdges <= 2;
};
var pushFront = (v, arr, an) => {
	an.value++;
	for (let i = an.value - 1; i > 0; i--) arr[i] = arr[i - 1];
	arr[0] = v;
};
var pushBack = (v, arr, an) => {
	arr[an.value] = v;
	an.value++;
};
var removeVertex = (ctx, mesh, remVertexIdx) => {
	const nvp = mesh.maxVerticesPerPoly;
	let numRemovedVerts = 0;
	for (let i = 0; i < mesh.nPolys; i++) {
		const polyStart = i * nvp;
		const nv = countPolyVerts(mesh.polys, polyStart, nvp);
		for (let j = 0; j < nv; j++) if (mesh.polys[polyStart + j] === remVertexIdx) numRemovedVerts++;
	}
	const edges = new Array(numRemovedVerts * nvp * 4);
	let nedges = 0;
	const hole = new Array(numRemovedVerts * nvp);
	let nhole = 0;
	const hreg = new Array(numRemovedVerts * nvp);
	const harea = new Array(numRemovedVerts * nvp);
	for (let i = 0; i < mesh.nPolys; i++) {
		const polyStart = i * nvp;
		const nv = countPolyVerts(mesh.polys, polyStart, nvp);
		let hasRem = false;
		for (let j = 0; j < nv; j++) if (mesh.polys[polyStart + j] === remVertexIdx) {
			hasRem = true;
			break;
		}
		if (hasRem) {
			for (let j = 0, k = nv - 1; j < nv; k = j++) if (mesh.polys[polyStart + j] !== remVertexIdx && mesh.polys[polyStart + k] !== remVertexIdx) {
				const e = nedges * 4;
				edges[e] = mesh.polys[polyStart + k];
				edges[e + 1] = mesh.polys[polyStart + j];
				edges[e + 2] = mesh.regions[i];
				edges[e + 3] = mesh.areas[i];
				nedges++;
			}
			const lastPolyStart = (mesh.nPolys - 1) * nvp;
			if (polyStart !== lastPolyStart) for (let j = 0; j < nvp; j++) mesh.polys[polyStart + j] = mesh.polys[lastPolyStart + j];
			for (let j = 0; j < nvp; j++) mesh.polys[lastPolyStart + j] = -1;
			mesh.regions[i] = mesh.regions[mesh.nPolys - 1];
			mesh.areas[i] = mesh.areas[mesh.nPolys - 1];
			mesh.nPolys--;
			i--;
		}
	}
	for (let i = remVertexIdx; i < mesh.nVertices - 1; i++) {
		mesh.vertices[i * 3] = mesh.vertices[(i + 1) * 3];
		mesh.vertices[i * 3 + 1] = mesh.vertices[(i + 1) * 3 + 1];
		mesh.vertices[i * 3 + 2] = mesh.vertices[(i + 1) * 3 + 2];
	}
	mesh.nVertices--;
	for (let i = 0; i < mesh.nPolys; i++) {
		const polyStart = i * nvp;
		const nv = countPolyVerts(mesh.polys, polyStart, nvp);
		for (let j = 0; j < nv; j++) if (mesh.polys[polyStart + j] > remVertexIdx) mesh.polys[polyStart + j]--;
	}
	for (let i = 0; i < nedges; i++) {
		if (edges[i * 4] > remVertexIdx) edges[i * 4]--;
		if (edges[i * 4 + 1] > remVertexIdx) edges[i * 4 + 1]--;
	}
	if (nedges === 0) return true;
	const nholeRef = { value: 0 };
	const nhregRef = { value: 0 };
	const nhareaRef = { value: 0 };
	pushBack(edges[0], hole, nholeRef);
	pushBack(edges[2], hreg, nhregRef);
	pushBack(edges[3], harea, nhareaRef);
	nhole = nholeRef.value;
	while (nedges > 0) {
		let match = false;
		for (let i = 0; i < nedges; i++) {
			const ea = edges[i * 4];
			const eb = edges[i * 4 + 1];
			const r = edges[i * 4 + 2];
			const a = edges[i * 4 + 3];
			let add = false;
			if (hole[0] === eb) {
				pushFront(ea, hole, nholeRef);
				pushFront(r, hreg, nhregRef);
				pushFront(a, harea, nhareaRef);
				add = true;
			} else if (hole[nhole - 1] === ea) {
				pushBack(eb, hole, nholeRef);
				pushBack(r, hreg, nhregRef);
				pushBack(a, harea, nhareaRef);
				add = true;
			}
			if (add) {
				edges[i * 4] = edges[(nedges - 1) * 4];
				edges[i * 4 + 1] = edges[(nedges - 1) * 4 + 1];
				edges[i * 4 + 2] = edges[(nedges - 1) * 4 + 2];
				edges[i * 4 + 3] = edges[(nedges - 1) * 4 + 3];
				nedges--;
				match = true;
				i--;
			}
			nhole = nholeRef.value;
		}
		if (!match) break;
	}
	const tris = new Array(nhole * 3);
	const tverts = new Array(nhole * 4);
	const thole = new Array(nhole);
	for (let i = 0; i < nhole; i++) {
		const pi = hole[i];
		tverts[i * 4] = mesh.vertices[pi * 3];
		tverts[i * 4 + 1] = mesh.vertices[pi * 3 + 1];
		tverts[i * 4 + 2] = mesh.vertices[pi * 3 + 2];
		tverts[i * 4 + 3] = 0;
		thole[i] = i;
	}
	let ntris = triangulate(nhole, tverts, thole, tris);
	if (ntris < 0) {
		ntris = -ntris;
		BuildContext.warn(ctx, "removeVertex: triangulate() returned bad results");
	}
	const polys = new Array((ntris + 1) * nvp);
	const pregs = new Array(ntris);
	const pareas = new Array(ntris);
	polys.fill(-1);
	let npolys = 0;
	for (let j = 0; j < ntris; j++) {
		const t = [
			tris[j * 3],
			tris[j * 3 + 1],
			tris[j * 3 + 2]
		];
		if (t[0] !== t[1] && t[0] !== t[2] && t[1] !== t[2]) {
			polys[npolys * nvp] = hole[t[0]];
			polys[npolys * nvp + 1] = hole[t[1]];
			polys[npolys * nvp + 2] = hole[t[2]];
			if (hreg[t[0]] !== hreg[t[1]] || hreg[t[1]] !== hreg[t[2]]) pregs[npolys] = 0;
			else pregs[npolys] = hreg[t[0]];
			pareas[npolys] = harea[t[0]];
			npolys++;
		}
	}
	if (npolys === 0) return true;
	if (nvp > 3) while (true) {
		let bestMergeVal = 0;
		let bestPa = 0;
		let bestPb = 0;
		let bestEa = 0;
		let bestEb = 0;
		for (let j = 0; j < npolys - 1; j++) {
			const pjStart = j * nvp;
			for (let k = j + 1; k < npolys; k++) {
				const result = getPolyMergeValue(polys, pjStart, k * nvp, mesh.vertices, nvp);
				if (result.value > bestMergeVal) {
					bestMergeVal = result.value;
					bestPa = j;
					bestPb = k;
					bestEa = result.ea;
					bestEb = result.eb;
				}
			}
		}
		if (bestMergeVal > 0) {
			const paStart = bestPa * nvp;
			const pbStart = bestPb * nvp;
			mergePolyVerts(polys, paStart, pbStart, bestEa, bestEb, ntris * nvp, nvp);
			if (pregs[bestPa] !== pregs[bestPb]) pregs[bestPa] = 0;
			const lastStart = (npolys - 1) * nvp;
			if (pbStart !== lastStart) for (let m = 0; m < nvp; m++) polys[pbStart + m] = polys[lastStart + m];
			pregs[bestPb] = pregs[npolys - 1];
			pareas[bestPb] = pareas[npolys - 1];
			npolys--;
		} else break;
	}
	for (let i = 0; i < npolys; i++) {
		const meshPolyStart = mesh.nPolys * nvp;
		const polyStart = i * nvp;
		for (let j = 0; j < nvp; j++) mesh.polys[meshPolyStart + j] = -1;
		for (let j = 0; j < nvp; j++) mesh.polys[meshPolyStart + j] = polys[polyStart + j];
		mesh.regions[mesh.nPolys] = pregs[i];
		mesh.areas[mesh.nPolys] = pareas[i];
		mesh.nPolys++;
	}
	return true;
};
var UNSET_HEIGHT = 65535;
var MAX_VERTS = 127;
var MAX_TRIS = 255;
var MAX_VERTS_PER_EDGE = 32;
var RETRACT_SIZE = 256;
var EV_UNDEF = -1;
var EV_HULL = -2;
var getVec2XZ = (out, arr, index = 0) => {
	out[0] = arr[index];
	out[1] = arr[index + 2];
	return out;
};
var getJitterX = (i) => {
	return (i * 2376512323 & 65535) / 65535 * 2 - 1;
};
var getJitterY = (i) => {
	return (i * 3625334849 & 65535) / 65535 * 2 - 1;
};
var prev = (i, n) => i - 1 >= 0 ? i - 1 : n - 1;
var next = (i, n) => i + 1 < n ? i + 1 : 0;
var getHeight = (fx, fy, fz, _cs, ics, ch, radius, hp) => {
	let ix = Math.floor(fx * ics + .01);
	let iz = Math.floor(fz * ics + .01);
	ix = clamp(ix - hp.xmin, 0, hp.width - 1);
	iz = clamp(iz - hp.ymin, 0, hp.height - 1);
	let h = hp.data[ix + iz * hp.width];
	if (h === UNSET_HEIGHT) {
		let x = 1;
		let z = 0;
		let dx = 1;
		let dz = 0;
		const maxSize = radius * 2 + 1;
		const maxIter = maxSize * maxSize - 1;
		let nextRingIterStart = 8;
		let nextRingIters = 16;
		let dmin = Number.MAX_VALUE;
		for (let i = 0; i < maxIter; i++) {
			const nx = ix + x;
			const nz = iz + z;
			if (nx >= 0 && nz >= 0 && nx < hp.width && nz < hp.height) {
				const nh = hp.data[nx + nz * hp.width];
				if (nh !== UNSET_HEIGHT) {
					const d = Math.abs(nh * ch - fy);
					if (d < dmin) {
						h = nh;
						dmin = d;
					}
				}
			}
			if (i + 1 === nextRingIterStart) {
				if (h !== UNSET_HEIGHT) break;
				nextRingIterStart += nextRingIters;
				nextRingIters += 8;
			}
			if (x === z || x < 0 && x === -z || x > 0 && x === 1 - z) {
				const tmp = dx;
				dx = -dz;
				dz = tmp;
			}
			x += dx;
			z += dz;
		}
	}
	return h;
};
var findEdge = (edges, nedges, s, t) => {
	for (let i = 0; i < nedges; i++) {
		const e = i * 4;
		if (edges[e] === s && edges[e + 1] === t || edges[e] === t && edges[e + 1] === s) return i;
	}
	return EV_UNDEF;
};
var addEdge = (ctx, edges, nedges, maxEdges, s, t, l, r) => {
	if (nedges.value >= maxEdges) {
		BuildContext.error(ctx, `addEdge: Too many edges (${nedges.value}/${maxEdges}).`);
		return EV_UNDEF;
	}
	if (findEdge(edges, nedges.value, s, t) === EV_UNDEF) {
		const edgeIdx = nedges.value * 4;
		edges[edgeIdx] = s;
		edges[edgeIdx + 1] = t;
		edges[edgeIdx + 2] = l;
		edges[edgeIdx + 3] = r;
		return nedges.value++;
	}
	return EV_UNDEF;
};
var _completeFacetC = create$3();
var _completeFacetPointS = create$4();
var _completeFacetPointT = create$4();
var _completeFacetPointU = create$4();
var _completeFacetCircleCenter = create$4();
var _completeFacetDistanceCalc = create$4();
var _triangleV1 = create$4();
var _triangleV2 = create$4();
var _triangleV3 = create$4();
var _circumcircleResult = create$1();
var completeFacet = (ctx, points, nPoints, edges, nEdges, maxEdges, nFaces, e) => {
	const EPS_FACET = 1e-5;
	const edgeIdx = e * 4;
	let s;
	let t;
	if (edges[edgeIdx + 2] === EV_UNDEF) {
		s = edges[edgeIdx];
		t = edges[edgeIdx + 1];
	} else if (edges[edgeIdx + 3] === EV_UNDEF) {
		s = edges[edgeIdx + 1];
		t = edges[edgeIdx];
	} else return;
	let pt = nPoints;
	const c = set$1(_completeFacetC, 0, 0, 0);
	let r = -1;
	for (let u = 0; u < nPoints; ++u) {
		if (u === s || u === t) continue;
		getVec2XZ(_completeFacetPointS, points, s * 3);
		getVec2XZ(_completeFacetPointT, points, t * 3);
		getVec2XZ(_completeFacetPointU, points, u * 3);
		subtract$1(_completeFacetPointT, _completeFacetPointT, _completeFacetPointS);
		subtract$1(_completeFacetPointU, _completeFacetPointU, _completeFacetPointS);
		if (_completeFacetPointT[0] * _completeFacetPointU[1] - _completeFacetPointT[1] * _completeFacetPointU[0] > EPS_FACET) {
			if (r < 0) {
				pt = u;
				getVec2XZ(_triangleV1, points, s * 3);
				getVec2XZ(_triangleV2, points, t * 3);
				getVec2XZ(_triangleV3, points, u * 3);
				circumcircle(_circumcircleResult, _triangleV1, _triangleV2, _triangleV3);
				c[0] = _circumcircleResult.center[0];
				c[1] = 0;
				c[2] = _circumcircleResult.center[1];
				r = _circumcircleResult.radius;
				continue;
			}
			getVec2XZ(_completeFacetCircleCenter, c, 0);
			getVec2XZ(_completeFacetDistanceCalc, points, u * 3);
			const d = distance$1(_completeFacetCircleCenter, _completeFacetDistanceCalc);
			if (d > r * 1.001) continue;
			if (d >= r * .999) {
				if (overlapEdges(points, edges, nEdges.value, s, u)) continue;
				if (overlapEdges(points, edges, nEdges.value, t, u)) continue;
			}
			pt = u;
			getVec2XZ(_triangleV1, points, s * 3);
			getVec2XZ(_triangleV2, points, t * 3);
			getVec2XZ(_triangleV3, points, u * 3);
			circumcircle(_circumcircleResult, _triangleV1, _triangleV2, _triangleV3);
			c[0] = _circumcircleResult.center[0];
			c[1] = 0;
			c[2] = _circumcircleResult.center[1];
			r = _circumcircleResult.radius;
		}
	}
	if (pt < nPoints) {
		updateLeftFace(edges, e, s, t, nFaces.value);
		let newE = findEdge(edges, nEdges.value, pt, s);
		if (newE === EV_UNDEF) addEdge(ctx, edges, nEdges, maxEdges, pt, s, nFaces.value, EV_UNDEF);
		else updateLeftFace(edges, newE, pt, s, nFaces.value);
		newE = findEdge(edges, nEdges.value, t, pt);
		if (newE === EV_UNDEF) addEdge(ctx, edges, nEdges, maxEdges, t, pt, nFaces.value, EV_UNDEF);
		else updateLeftFace(edges, newE, t, pt, nFaces.value);
		nFaces.value++;
	} else updateLeftFace(edges, e, s, t, EV_HULL);
};
var updateLeftFace = (edges, edgeIdx, s, t, f) => {
	const e = edgeIdx * 4;
	if (edges[e] === s && edges[e + 1] === t && edges[e + 2] === EV_UNDEF) edges[e + 2] = f;
	else if (edges[e + 1] === s && edges[e] === t && edges[e + 3] === EV_UNDEF) edges[e + 3] = f;
};
var _overlapEdgesS0 = create$4();
var _overlapEdgesT0 = create$4();
var _overlapEdgesS1 = create$4();
var _overlapEdgesT1 = create$4();
var overlapEdges = (pts, edges, nedges, s1, t1) => {
	for (let i = 0; i < nedges; ++i) {
		const s0 = edges[i * 4];
		const t0 = edges[i * 4 + 1];
		if (s0 === s1 || s0 === t1 || t0 === s1 || t0 === t1) continue;
		getVec2XZ(_overlapEdgesS0, pts, s0 * 3);
		getVec2XZ(_overlapEdgesT0, pts, t0 * 3);
		getVec2XZ(_overlapEdgesS1, pts, s1 * 3);
		getVec2XZ(_overlapEdgesT1, pts, t1 * 3);
		if (overlapSegSeg2d(_overlapEdgesS0, _overlapEdgesT0, _overlapEdgesS1, _overlapEdgesT1)) return true;
	}
	return false;
};
var delaunayHull = (ctx, npts, pts, nhull, hull, tris, edges) => {
	const nfaces = { value: 0 };
	const nedges = { value: 0 };
	const maxEdges = npts * 10;
	edges.length = maxEdges * 4;
	for (let i = 0, j = nhull - 1; i < nhull; j = i++) addEdge(ctx, edges, nedges, maxEdges, hull[j], hull[i], EV_HULL, EV_UNDEF);
	let currentEdge = 0;
	while (currentEdge < nedges.value) {
		if (edges[currentEdge * 4 + 2] === EV_UNDEF) completeFacet(ctx, pts, npts, edges, nedges, maxEdges, nfaces, currentEdge);
		if (edges[currentEdge * 4 + 3] === EV_UNDEF) completeFacet(ctx, pts, npts, edges, nedges, maxEdges, nfaces, currentEdge);
		currentEdge++;
	}
	tris.length = nfaces.value * 4;
	for (let i = 0; i < nfaces.value * 4; ++i) tris[i] = -1;
	for (let i = 0; i < nedges.value; ++i) {
		const e = i * 4;
		if (edges[e + 3] >= 0) {
			const t = edges[e + 3] * 4;
			if (tris[t] === -1) {
				tris[t] = edges[e];
				tris[t + 1] = edges[e + 1];
			} else if (tris[t] === edges[e + 1]) tris[t + 2] = edges[e];
			else if (tris[t + 1] === edges[e]) tris[t + 2] = edges[e + 1];
		}
		if (edges[e + 2] >= 0) {
			const t = edges[e + 2] * 4;
			if (tris[t] === -1) {
				tris[t] = edges[e + 1];
				tris[t + 1] = edges[e];
			} else if (tris[t] === edges[e]) tris[t + 2] = edges[e + 1];
			else if (tris[t + 1] === edges[e + 1]) tris[t + 2] = edges[e];
		}
	}
	for (let i = 0; i < tris.length / 4; ++i) {
		const t = i * 4;
		if (tris[t] === -1 || tris[t + 1] === -1 || tris[t + 2] === -1) {
			BuildContext.warn(ctx, `delaunayHull: Removing dangling face ${i} [${tris[t]},${tris[t + 1]},${tris[t + 2]}].`);
			tris[t] = tris[tris.length - 4];
			tris[t + 1] = tris[tris.length - 3];
			tris[t + 2] = tris[tris.length - 2];
			tris[t + 3] = tris[tris.length - 1];
			tris.length -= 4;
			--i;
		}
	}
};
var triangulateHull = (verts, nhull, hull, nin, tris) => {
	let start = 0;
	let left = 1;
	let right = nhull - 1;
	let dmin = Number.MAX_VALUE;
	for (let i = 0; i < nhull; i++) {
		if (hull[i] >= nin) continue;
		const pi = prev(i, nhull);
		const ni = next(i, nhull);
		const pv = hull[pi] * 3;
		const cv = hull[i] * 3;
		const nv = hull[ni] * 3;
		getVec2XZ(_triangulateHullPrev, verts, pv);
		getVec2XZ(_triangulateHullCurrent, verts, cv);
		getVec2XZ(_triangulateHullNext, verts, nv);
		const d = distance$1(_triangulateHullPrev, _triangulateHullCurrent) + distance$1(_triangulateHullCurrent, _triangulateHullNext) + distance$1(_triangulateHullNext, _triangulateHullPrev);
		if (d < dmin) {
			start = i;
			left = ni;
			right = pi;
			dmin = d;
		}
	}
	tris.push(hull[start]);
	tris.push(hull[left]);
	tris.push(hull[right]);
	tris.push(0);
	while (next(left, nhull) !== right) {
		const nleft = next(left, nhull);
		const nright = prev(right, nhull);
		const cvleft = hull[left] * 3;
		const nvleft = hull[nleft] * 3;
		const cvright = hull[right] * 3;
		const nvright = hull[nright] * 3;
		getVec2XZ(_triangulateHullPrev, verts, cvleft);
		getVec2XZ(_triangulateHullCurrent, verts, nvleft);
		getVec2XZ(_triangulateHullNext, verts, cvright);
		getVec2XZ(_triangulateHullRight, verts, nvright);
		if (distance$1(_triangulateHullPrev, _triangulateHullCurrent) + distance$1(_triangulateHullCurrent, _triangulateHullNext) < distance$1(_triangulateHullNext, _triangulateHullRight) + distance$1(_triangulateHullPrev, _triangulateHullRight)) {
			tris.push(hull[left]);
			tris.push(hull[nleft]);
			tris.push(hull[right]);
			tris.push(0);
			left = nleft;
		} else {
			tris.push(hull[left]);
			tris.push(hull[nright]);
			tris.push(hull[right]);
			tris.push(0);
			right = nright;
		}
	}
};
var onHull = (a, b, nhull, hull) => {
	if (a >= nhull || b >= nhull) return false;
	for (let j = nhull - 1, i = 0; i < nhull; j = i++) if (a === hull[j] && b === hull[i]) return true;
	return false;
};
var setTriFlags = (tris, nhull, hull) => {
	for (let i = 0; i < tris.length; i += 4) {
		const a = tris[i];
		const b = tris[i + 1];
		const c = tris[i + 2];
		let flags = 0;
		flags |= (onHull(a, b, nhull, hull) ? 1 : 0) << 0;
		flags |= (onHull(b, c, nhull, hull) ? 1 : 0) << 2;
		flags |= (onHull(c, a, nhull, hull) ? 1 : 0) << 4;
		tris[i + 3] = flags;
	}
};
var SEED_ARRAY_WITH_POLY_CENTER_OFFSET = [
	[0, 0],
	[-1, -1],
	[0, -1],
	[1, -1],
	[1, 0],
	[1, 1],
	[0, 1],
	[-1, 1],
	[-1, 0]
];
var seedArrayWithPolyCenter = (ctx, chf, poly, polyStart, nPolys, verts, bs, hp, array) => {
	const offset = SEED_ARRAY_WITH_POLY_CENTER_OFFSET;
	let startCellX = 0;
	let startCellY = 0;
	let startSpanIndex = -1;
	let dmin = UNSET_HEIGHT;
	for (let j = 0; j < nPolys && dmin > 0; ++j) for (let k = 0; k < 9 && dmin > 0; ++k) {
		const ax = verts[poly[polyStart + j] * 3] + offset[k][0];
		const ay = verts[poly[polyStart + j] * 3 + 1];
		const az = verts[poly[polyStart + j] * 3 + 2] + offset[k][1];
		if (ax < hp.xmin || ax >= hp.xmin + hp.width || az < hp.ymin || az >= hp.ymin + hp.height) continue;
		const c = chf.cells[ax + bs + (az + bs) * chf.width];
		for (let i = c.index, ni = c.index + c.count; i < ni && dmin > 0; ++i) {
			const s = chf.spans[i];
			const d = Math.abs(ay - s.y);
			if (d < dmin) {
				startCellX = ax;
				startCellY = az;
				startSpanIndex = i;
				dmin = d;
			}
		}
	}
	let pcx = 0;
	let pcy = 0;
	for (let j = 0; j < nPolys; ++j) {
		pcx += verts[poly[polyStart + j] * 3];
		pcy += verts[poly[polyStart + j] * 3 + 2];
	}
	pcx = Math.floor(pcx / nPolys);
	pcy = Math.floor(pcy / nPolys);
	array.length = 0;
	array.push(startCellX, startCellY, startSpanIndex);
	const dirs = [
		0,
		1,
		2,
		3
	];
	hp.data.fill(0);
	let cx = -1;
	let cy = -1;
	let ci = -1;
	while (true) {
		if (array.length < 3) {
			BuildContext.warn(ctx, "Walk towards polygon center failed to reach center");
			break;
		}
		ci = array.pop();
		cy = array.pop();
		cx = array.pop();
		if (cx === pcx && cy === pcy) break;
		let directDir;
		if (cx === pcx) directDir = getDirForOffset(0, pcy > cy ? 1 : -1);
		else directDir = getDirForOffset(pcx > cx ? 1 : -1, 0);
		let temp = dirs[directDir];
		dirs[directDir] = dirs[3];
		dirs[3] = temp;
		const cs = chf.spans[ci];
		for (let i = 0; i < 4; i++) {
			const dir = dirs[i];
			if (getCon(cs, dir) === 63) continue;
			const newX = cx + getDirOffsetX(dir);
			const newY = cy + getDirOffsetY(dir);
			const hpx = newX - hp.xmin;
			const hpy = newY - hp.ymin;
			if (hpx < 0 || hpx >= hp.width || hpy < 0 || hpy >= hp.height) continue;
			if (hp.data[hpx + hpy * hp.width] !== 0) continue;
			hp.data[hpx + hpy * hp.width] = 1;
			array.push(newX, newY, chf.cells[newX + bs + (newY + bs) * chf.width].index + getCon(cs, dir));
		}
		temp = dirs[directDir];
		dirs[directDir] = dirs[3];
		dirs[3] = temp;
	}
	array.length = 0;
	array.push(cx + bs, cy + bs, ci);
	hp.data.fill(UNSET_HEIGHT);
	const cs = chf.spans[ci];
	hp.data[cx - hp.xmin + (cy - hp.ymin) * hp.width] = cs.y;
};
var getHeightData = (ctx, chf, poly, polyStart, nPolys, verts, bs, hp, queue, region) => {
	queue.length = 0;
	hp.data.fill(UNSET_HEIGHT);
	let empty = true;
	if (region !== 0) for (let hy = 0; hy < hp.height; hy++) {
		const y = hp.ymin + hy + bs;
		for (let hx = 0; hx < hp.width; hx++) {
			const x = hp.xmin + hx + bs;
			const c = chf.cells[x + y * chf.width];
			for (let i = c.index, ni = c.index + c.count; i < ni; ++i) {
				const s = chf.spans[i];
				if (s.region === region) {
					hp.data[hx + hy * hp.width] = s.y;
					empty = false;
					let border = false;
					for (let dir = 0; dir < 4; ++dir) if (getCon(s, dir) !== 63) {
						const ax = x + getDirOffsetX(dir);
						const ay = y + getDirOffsetY(dir);
						const ai = chf.cells[ax + ay * chf.width].index + getCon(s, dir);
						if (chf.spans[ai].region !== region) {
							border = true;
							break;
						}
					}
					if (border) queue.push(x, y, i);
					break;
				}
			}
		}
	}
	if (empty) seedArrayWithPolyCenter(ctx, chf, poly, polyStart, nPolys, verts, bs, hp, queue);
	let head = 0;
	while (head * 3 < queue.length) {
		const cx = queue[head * 3];
		const cy = queue[head * 3 + 1];
		const ci = queue[head * 3 + 2];
		head++;
		if (head >= RETRACT_SIZE) {
			head = 0;
			queue.splice(0, RETRACT_SIZE * 3);
		}
		const cs = chf.spans[ci];
		for (let dir = 0; dir < 4; ++dir) {
			if (getCon(cs, dir) === 63) continue;
			const ax = cx + getDirOffsetX(dir);
			const ay = cy + getDirOffsetY(dir);
			const hx = ax - hp.xmin - bs;
			const hy = ay - hp.ymin - bs;
			if (hx < 0 || hx >= hp.width || hy < 0 || hy >= hp.height) continue;
			if (hp.data[hx + hy * hp.width] !== UNSET_HEIGHT) continue;
			const ai = chf.cells[ax + ay * chf.width].index + getCon(cs, dir);
			const as = chf.spans[ai];
			hp.data[hx + hy * hp.width] = as.y;
			queue.push(ax, ay, ai);
		}
	}
};
var _buildPolyDetail_vj = create$3();
var _buildPolyDetail_vi = create$3();
var _buildPolyDetail_pt = create$3();
var _buildPolyDetail_va = create$3();
var _buildPolyDetail_vb = create$3();
var _buildPolyDetailSamplePt = create$3();
var _buildPolyDetailGridPt = create$3();
var _bmin$1 = create$3();
var _bmax$1 = create$3();
var buildPolyDetail = (ctx, inVerts, nin, sampleDist, sampleMaxError, heightSearchRadius, chf, hp, verts, tris, edges, samples) => {
	const edge = new Array(99);
	const hull = new Array(MAX_VERTS);
	let nhull = 0;
	let nverts = nin;
	for (let i = 0; i < nin; ++i) {
		verts[i * 3] = inVerts[i * 3];
		verts[i * 3 + 1] = inVerts[i * 3 + 1];
		verts[i * 3 + 2] = inVerts[i * 3 + 2];
	}
	edges.length = 0;
	tris.length = 0;
	const cs = chf.cellSize;
	const ics = 1 / cs;
	const minExtent = polyMinExtent(verts, nverts);
	if (sampleDist > 0) for (let i = 0, j = nin - 1; i < nin; j = i++) {
		let vjStart = j * 3;
		let viStart = i * 3;
		let swapped = false;
		if (Math.abs(inVerts[vjStart] - inVerts[viStart]) < 1e-6) {
			if (inVerts[vjStart + 2] > inVerts[viStart + 2]) {
				const tmp = viStart;
				viStart = vjStart;
				vjStart = tmp;
				swapped = true;
			}
		} else if (inVerts[vjStart] > inVerts[viStart]) {
			const tmp = viStart;
			viStart = vjStart;
			vjStart = tmp;
			swapped = true;
		}
		const vj = fromBuffer(_buildPolyDetail_vj, inVerts, vjStart);
		const vi = fromBuffer(_buildPolyDetail_vi, inVerts, viStart);
		const dx = vi[0] - vj[0];
		const dy = vi[1] - vj[1];
		const dz = vi[2] - vj[2];
		const d = Math.sqrt(dx * dx + dz * dz);
		let nn = 1 + Math.floor(d / sampleDist);
		if (nn >= MAX_VERTS_PER_EDGE) nn = 31;
		if (nverts + nn >= MAX_VERTS) nn = 126 - nverts;
		for (let k = 0; k <= nn; ++k) {
			const u = k / nn;
			const pos = k * 3;
			edge[pos] = vj[0] + dx * u;
			edge[pos + 1] = vj[1] + dy * u;
			edge[pos + 2] = vj[2] + dz * u;
			edge[pos + 1] = getHeight(edge[pos], edge[pos + 1], edge[pos + 2], cs, ics, chf.cellHeight, heightSearchRadius, hp) * chf.cellHeight;
		}
		const idx = new Array(MAX_VERTS_PER_EDGE).fill(0);
		idx[0] = 0;
		idx[1] = nn;
		let nidx = 2;
		for (let k = 0; k < nidx - 1;) {
			const a = idx[k];
			const b = idx[k + 1];
			const vaStart = a * 3;
			const vbStart = b * 3;
			let maxd = 0;
			let maxi = -1;
			for (let m = a + 1; m < b; ++m) {
				const dev = distancePtSeg$1(fromBuffer(_buildPolyDetail_pt, edge, m * 3), fromBuffer(_buildPolyDetail_va, edge, vaStart), fromBuffer(_buildPolyDetail_vb, edge, vbStart));
				if (dev > maxd) {
					maxd = dev;
					maxi = m;
				}
			}
			if (maxi !== -1 && maxd > sampleMaxError * sampleMaxError) {
				for (let m = nidx; m > k; --m) idx[m] = idx[m - 1];
				idx[k + 1] = maxi;
				nidx++;
			} else ++k;
		}
		hull[nhull++] = j;
		if (swapped) for (let k = nidx - 2; k > 0; --k) {
			verts[nverts * 3] = edge[idx[k] * 3];
			verts[nverts * 3 + 1] = edge[idx[k] * 3 + 1];
			verts[nverts * 3 + 2] = edge[idx[k] * 3 + 2];
			hull[nhull++] = nverts;
			nverts++;
		}
		else for (let k = 1; k < nidx - 1; ++k) {
			verts[nverts * 3] = edge[idx[k] * 3];
			verts[nverts * 3 + 1] = edge[idx[k] * 3 + 1];
			verts[nverts * 3 + 2] = edge[idx[k] * 3 + 2];
			hull[nhull++] = nverts;
			nverts++;
		}
	}
	if (minExtent < sampleDist * 2) {
		triangulateHull(verts, nhull, hull, nin, tris);
		setTriFlags(tris, nhull, hull);
		return true;
	}
	triangulateHull(verts, nhull, hull, nin, tris);
	if (tris.length === 0) {
		BuildContext.warn(ctx, `buildPolyDetail: Could not triangulate polygon (${nverts} verts).`);
		return true;
	}
	if (sampleDist > 0) {
		const bmin = set$1(_bmin$1, inVerts[0], inVerts[1], inVerts[2]);
		const bmax = set$1(_bmax$1, inVerts[0], inVerts[1], inVerts[2]);
		for (let i = 1; i < nin; ++i) {
			bmin[0] = Math.min(bmin[0], inVerts[i * 3]);
			bmin[1] = Math.min(bmin[1], inVerts[i * 3 + 1]);
			bmin[2] = Math.min(bmin[2], inVerts[i * 3 + 2]);
			bmax[0] = Math.max(bmax[0], inVerts[i * 3]);
			bmax[1] = Math.max(bmax[1], inVerts[i * 3 + 1]);
			bmax[2] = Math.max(bmax[2], inVerts[i * 3 + 2]);
		}
		const x0 = Math.floor(bmin[0] / sampleDist);
		const x1 = Math.ceil(bmax[0] / sampleDist);
		const z0 = Math.floor(bmin[2] / sampleDist);
		const z1 = Math.ceil(bmax[2] / sampleDist);
		samples.length = 0;
		for (let z = z0; z < z1; ++z) for (let x = x0; x < x1; ++x) {
			const pt = [
				x * sampleDist,
				(bmax[1] + bmin[1]) * .5,
				z * sampleDist
			];
			set$1(_buildPolyDetailGridPt, pt[0], pt[1], pt[2]);
			if (distToPoly(nin, inVerts, _buildPolyDetailGridPt) > -sampleDist / 2) continue;
			samples.push(x);
			samples.push(getHeight(pt[0], pt[1], pt[2], cs, ics, chf.cellHeight, heightSearchRadius, hp));
			samples.push(z);
			samples.push(0);
		}
		const nsamples = samples.length / 4;
		for (let iter = 0; iter < nsamples; ++iter) {
			if (nverts >= MAX_VERTS) break;
			const bestpt = [
				0,
				0,
				0
			];
			let bestd = 0;
			let besti = -1;
			for (let i = 0; i < nsamples; ++i) {
				const s = i * 4;
				if (samples[s + 3]) continue;
				const pt = [
					samples[s] * sampleDist + getJitterX(i) * cs * .1,
					samples[s + 1] * chf.cellHeight,
					samples[s + 2] * sampleDist + getJitterY(i) * cs * .1
				];
				set$1(_buildPolyDetailSamplePt, pt[0], pt[1], pt[2]);
				const d = distToTriMesh(_buildPolyDetailSamplePt, verts, tris, tris.length / 4);
				if (d < 0) continue;
				if (d > bestd) {
					bestd = d;
					besti = i;
					bestpt[0] = pt[0];
					bestpt[1] = pt[1];
					bestpt[2] = pt[2];
				}
			}
			if (bestd <= sampleMaxError || besti === -1) break;
			samples[besti * 4 + 3] = 1;
			verts.push(bestpt[0], bestpt[1], bestpt[2]);
			nverts++;
			edges.length = 0;
			tris.length = 0;
			delaunayHull(ctx, nverts, verts, nhull, hull, tris, edges);
		}
	}
	const ntris = tris.length / 4;
	if (ntris > MAX_TRIS) {
		tris.length = 1020;
		BuildContext.warn(ctx, `buildPolyMeshDetail: Shrinking triangle count from ${ntris} to max ${MAX_TRIS}.`);
	}
	setTriFlags(tris, nhull, hull);
	return true;
};
var _triangulateHullPrev = create$4();
var _triangulateHullCurrent = create$4();
var _triangulateHullNext = create$4();
var _triangulateHullRight = create$4();
var buildPolyMeshDetail = (ctx, polyMesh, compactHeightfield, sampleDist, sampleMaxError) => {
	if (polyMesh.nVertices === 0 || polyMesh.nPolys === 0) return {
		meshes: [],
		vertices: [],
		triangles: [],
		nMeshes: 0,
		nVertices: 0,
		nTriangles: 0
	};
	const nvp = polyMesh.maxVerticesPerPoly;
	const cs = polyMesh.cellSize;
	const ch = polyMesh.cellHeight;
	const orig = [
		polyMesh.bounds[0],
		polyMesh.bounds[1],
		polyMesh.bounds[2]
	];
	const borderSize = polyMesh.borderSize;
	const heightSearchRadius = Math.max(1, Math.ceil(polyMesh.maxEdgeError));
	const hp = {
		data: [],
		xmin: 0,
		ymin: 0,
		width: 0,
		height: 0
	};
	let maxhw = 0;
	let maxhh = 0;
	const bounds = new Array(polyMesh.nPolys * 4);
	const poly = new Array(nvp * 3);
	for (let i = 0; i < polyMesh.nPolys; ++i) {
		const p = i * nvp;
		let xmin = compactHeightfield.width;
		let xmax = 0;
		let ymin = compactHeightfield.height;
		let ymax = 0;
		for (let j = 0; j < nvp; ++j) {
			if (polyMesh.polys[p + j] === -1) break;
			const v = polyMesh.polys[p + j] * 3;
			xmin = Math.min(xmin, polyMesh.vertices[v]);
			xmax = Math.max(xmax, polyMesh.vertices[v]);
			ymin = Math.min(ymin, polyMesh.vertices[v + 2]);
			ymax = Math.max(ymax, polyMesh.vertices[v + 2]);
		}
		bounds[i * 4] = Math.max(0, xmin - 1);
		bounds[i * 4 + 1] = Math.min(compactHeightfield.width, xmax + 1);
		bounds[i * 4 + 2] = Math.max(0, ymin - 1);
		bounds[i * 4 + 3] = Math.min(compactHeightfield.height, ymax + 1);
		if (bounds[i * 4] >= bounds[i * 4 + 1] || bounds[i * 4 + 2] >= bounds[i * 4 + 3]) continue;
		maxhw = Math.max(maxhw, bounds[i * 4 + 1] - bounds[i * 4]);
		maxhh = Math.max(maxhh, bounds[i * 4 + 3] - bounds[i * 4 + 2]);
	}
	hp.data = new Array(maxhw * maxhh);
	const dmesh = {
		meshes: new Array(polyMesh.nPolys * 4),
		vertices: [],
		triangles: [],
		nMeshes: polyMesh.nPolys,
		nVertices: 0,
		nTriangles: 0
	};
	for (let i = 0; i < polyMesh.nPolys; ++i) {
		const p = i * nvp;
		const edges = [];
		const tris = [];
		const arr = [];
		const samples = [];
		const verts = [];
		let npoly = 0;
		for (let j = 0; j < nvp; ++j) {
			if (polyMesh.polys[p + j] === -1) break;
			const v = polyMesh.polys[p + j] * 3;
			poly[j * 3] = polyMesh.vertices[v] * cs;
			poly[j * 3 + 1] = polyMesh.vertices[v + 1] * ch;
			poly[j * 3 + 2] = polyMesh.vertices[v + 2] * cs;
			npoly++;
		}
		hp.xmin = bounds[i * 4];
		hp.ymin = bounds[i * 4 + 2];
		hp.width = bounds[i * 4 + 1] - bounds[i * 4];
		hp.height = bounds[i * 4 + 3] - bounds[i * 4 + 2];
		getHeightData(ctx, compactHeightfield, polyMesh.polys, p, npoly, polyMesh.vertices, borderSize, hp, arr, polyMesh.regions[i]);
		if (!buildPolyDetail(ctx, poly, npoly, sampleDist, sampleMaxError, heightSearchRadius, compactHeightfield, hp, verts, tris, edges, samples)) {
			BuildContext.error(ctx, `buildPolyMeshDetail: Failed to build detail mesh for poly ${i}.`);
			continue;
		}
		for (let i = 0; i < verts.length; i += 3) {
			verts[i] += orig[0];
			verts[i + 1] += orig[1] + compactHeightfield.cellHeight;
			verts[i + 2] += orig[2];
		}
		for (let j = 0; j < npoly; ++j) {
			poly[j * 3] += orig[0];
			poly[j * 3 + 1] += orig[1];
			poly[j * 3 + 2] += orig[2];
		}
		const ntris = tris.length / 4;
		dmesh.meshes[i * 4] = dmesh.nVertices;
		dmesh.meshes[i * 4 + 1] = verts.length / 3;
		dmesh.meshes[i * 4 + 2] = dmesh.nTriangles;
		dmesh.meshes[i * 4 + 3] = ntris;
		for (let i = 0; i < verts.length; i += 3) {
			dmesh.vertices.push(verts[i], verts[i + 1], verts[i + 2]);
			dmesh.nVertices++;
		}
		for (let i = 0; i < tris.length; i += 4) {
			dmesh.triangles.push(tris[i], tris[i + 1], tris[i + 2], tris[i + 3]);
			dmesh.nTriangles++;
		}
	}
	return dmesh;
};
var createIndexPool = () => {
	return {
		free: [],
		counter: 0
	};
};
var requestIndex = (indexPool) => {
	if (indexPool.free.length > 0) return indexPool.free.pop();
	return indexPool.counter++;
};
var releaseIndex = (indexPool, index) => {
	indexPool.free.push(index);
};
var compareItemX = (a, b) => {
	if (a.bounds[0] < b.bounds[0]) return -1;
	if (a.bounds[0] > b.bounds[0]) return 1;
	return 0;
};
var compareItemY = (a, b) => {
	if (a.bounds[1] < b.bounds[1]) return -1;
	if (a.bounds[1] > b.bounds[1]) return 1;
	return 0;
};
var compareItemZ = (a, b) => {
	if (a.bounds[2] < b.bounds[2]) return -1;
	if (a.bounds[2] > b.bounds[2]) return 1;
	return 0;
};
var calcExtends = (items, imin, imax) => {
	const bounds = [
		items[imin].bounds[0],
		items[imin].bounds[1],
		items[imin].bounds[2],
		items[imin].bounds[3],
		items[imin].bounds[4],
		items[imin].bounds[5]
	];
	for (let i = imin + 1; i < imax; ++i) {
		const it = items[i];
		if (it.bounds[0] < bounds[0]) bounds[0] = it.bounds[0];
		if (it.bounds[1] < bounds[1]) bounds[1] = it.bounds[1];
		if (it.bounds[2] < bounds[2]) bounds[2] = it.bounds[2];
		if (it.bounds[3] > bounds[3]) bounds[3] = it.bounds[3];
		if (it.bounds[4] > bounds[4]) bounds[4] = it.bounds[4];
		if (it.bounds[5] > bounds[5]) bounds[5] = it.bounds[5];
	}
	return bounds;
};
var longestAxis = (x, y, z) => {
	let axis = 0;
	let maxVal = x;
	if (y > maxVal) {
		axis = 1;
		maxVal = y;
	}
	if (z > maxVal) axis = 2;
	return axis;
};
var subdivide = (items, imin, imax, curNode, nodes) => {
	const inum = imax - imin;
	const icur = curNode.value;
	const node = {
		bounds: [
			0,
			0,
			0,
			0,
			0,
			0
		],
		i: 0
	};
	nodes[curNode.value++] = node;
	if (inum === 1) {
		node.bounds[0] = items[imin].bounds[0];
		node.bounds[1] = items[imin].bounds[1];
		node.bounds[2] = items[imin].bounds[2];
		node.bounds[3] = items[imin].bounds[3];
		node.bounds[4] = items[imin].bounds[4];
		node.bounds[5] = items[imin].bounds[5];
		node.i = items[imin].i;
	} else {
		const extents = calcExtends(items, imin, imax);
		node.bounds[0] = extents[0];
		node.bounds[1] = extents[1];
		node.bounds[2] = extents[2];
		node.bounds[3] = extents[3];
		node.bounds[4] = extents[4];
		node.bounds[5] = extents[5];
		const axis = longestAxis(node.bounds[3] - node.bounds[0], node.bounds[4] - node.bounds[1], node.bounds[5] - node.bounds[2]);
		if (axis === 0) {
			const segment = items.slice(imin, imax);
			segment.sort(compareItemX);
			for (let i = 0; i < segment.length; i++) items[imin + i] = segment[i];
		} else if (axis === 1) {
			const segment = items.slice(imin, imax);
			segment.sort(compareItemY);
			for (let i = 0; i < segment.length; i++) items[imin + i] = segment[i];
		} else {
			const segment = items.slice(imin, imax);
			segment.sort(compareItemZ);
			for (let i = 0; i < segment.length; i++) items[imin + i] = segment[i];
		}
		const isplit = imin + Math.floor(inum / 2);
		subdivide(items, imin, isplit, curNode, nodes);
		subdivide(items, isplit, imax, curNode, nodes);
		node.i = -(curNode.value - icur);
	}
};
/**
* Builds a bounding volume tree for the given nav mesh tile.
* @param navMeshTile the nav mesh tile to build the BV tree for
* @returns
*/
var buildNavMeshBvTree = (params) => {
	const quantFactor = 1 / params.cellSize;
	if (params.polys.length === 0) return {
		nodes: [],
		quantFactor
	};
	const items = new Array(params.polys.length);
	for (let i = 0; i < params.polys.length; i++) {
		const item = {
			bounds: [
				0,
				0,
				0,
				0,
				0,
				0
			],
			i
		};
		const poly = params.polys[i];
		const nvp = poly.vertices.length;
		if (nvp > 0) {
			const firstVertIndex = poly.vertices[0] * 3;
			item.bounds[0] = item.bounds[3] = params.vertices[firstVertIndex];
			item.bounds[1] = item.bounds[4] = params.vertices[firstVertIndex + 1];
			item.bounds[2] = item.bounds[5] = params.vertices[firstVertIndex + 2];
			for (let j = 1; j < nvp; j++) {
				const vertexIndex = poly.vertices[j];
				if (vertexIndex === -1) break;
				const vertIndex = vertexIndex * 3;
				const x = params.vertices[vertIndex];
				const y = params.vertices[vertIndex + 1];
				const z = params.vertices[vertIndex + 2];
				if (x < item.bounds[0]) item.bounds[0] = x;
				if (y < item.bounds[1]) item.bounds[1] = y;
				if (z < item.bounds[2]) item.bounds[2] = z;
				if (x > item.bounds[3]) item.bounds[3] = x;
				if (y > item.bounds[4]) item.bounds[4] = y;
				if (z > item.bounds[5]) item.bounds[5] = z;
			}
			if (params.detailMeshes.length > 0 && params.detailVertices.length > 0) {
				const detailMesh = params.detailMeshes[i];
				const vb = detailMesh.verticesBase;
				const ndv = detailMesh.verticesCount;
				for (let j = 0; j < ndv; j++) {
					const vertIndex = (vb + j) * 3;
					const x = params.detailVertices[vertIndex];
					const y = params.detailVertices[vertIndex + 1];
					const z = params.detailVertices[vertIndex + 2];
					if (x < item.bounds[0]) item.bounds[0] = x;
					if (y < item.bounds[1]) item.bounds[1] = y;
					if (z < item.bounds[2]) item.bounds[2] = z;
					if (x > item.bounds[3]) item.bounds[3] = x;
					if (y > item.bounds[4]) item.bounds[4] = y;
					if (z > item.bounds[5]) item.bounds[5] = z;
				}
			}
			item.bounds[0] = (item.bounds[0] - params.bounds[0]) * quantFactor;
			item.bounds[1] = (item.bounds[1] - params.bounds[1]) * quantFactor;
			item.bounds[2] = (item.bounds[2] - params.bounds[2]) * quantFactor;
			item.bounds[3] = (item.bounds[3] - params.bounds[0]) * quantFactor;
			item.bounds[4] = (item.bounds[4] - params.bounds[1]) * quantFactor;
			item.bounds[5] = (item.bounds[5] - params.bounds[2]) * quantFactor;
		}
		items[i] = item;
	}
	const curNode = { value: 0 };
	const nPolys = params.polys.length;
	const nodes = new Array(nPolys * 2);
	subdivide(items, 0, nPolys, curNode, nodes);
	return {
		nodes: nodes.slice(0, curNode.value),
		quantFactor
	};
};
var OffMeshConnectionDirection;
(function(OffMeshConnectionDirection) {
	OffMeshConnectionDirection[OffMeshConnectionDirection["START_TO_END"] = 0] = "START_TO_END";
	OffMeshConnectionDirection[OffMeshConnectionDirection["BIDIRECTIONAL"] = 1] = "BIDIRECTIONAL";
})(OffMeshConnectionDirection || (OffMeshConnectionDirection = {}));
var NodeType;
(function(NodeType) {
	/** the node is a standard ground convex polygon that is part of the surface of the mesh */
	NodeType[NodeType["POLY"] = 0] = "POLY";
	/** the node is an off-mesh connection */
	NodeType[NodeType["OFFMESH"] = 1] = "OFFMESH";
})(NodeType || (NodeType = {}));
var TYPE_BITS = 1;
var SEQUENCE_BITS = 20;
var TYPE_MASK = 1;
var NODE_INDEX_MASK = 2147483647;
var NODE_INDEX_SHIFT = TYPE_BITS;
var SEQUENCE_SHIFT = 32;
var SEQUENCE_MASK = (1 << SEQUENCE_BITS) - 1;
var MAX_SEQUENCE = SEQUENCE_MASK;
/** Serializes a node reference from its components */
var serNodeRef = (type, nodeIndex, sequence) => {
	const t = type & TYPE_MASK;
	const n = nodeIndex & NODE_INDEX_MASK;
	const s = sequence & SEQUENCE_MASK;
	return t + n * 2 + s * 2 ** SEQUENCE_SHIFT;
};
/** Gets the node type from a node reference */
var getNodeRefType = (ref) => {
	return ref & TYPE_MASK;
};
/** Gets the node index from a node reference */
var getNodeRefIndex = (ref) => {
	return ref >>> NODE_INDEX_SHIFT & NODE_INDEX_MASK;
};
/** Gets the sequence number from a node reference */
var getNodeRefSequence = (ref) => {
	return Math.floor(ref / 2 ** SEQUENCE_SHIFT) & SEQUENCE_MASK;
};
/**
* Creates a new empty navigation mesh.
* @returns The created navigation mesh
*/
var createNavMesh = () => {
	return {
		origin: [
			0,
			0,
			0
		],
		tileWidth: 0,
		tileHeight: 0,
		links: [],
		nodes: [],
		tiles: {},
		tilePositionToTileId: {},
		tileColumnToTileIds: {},
		offMeshConnections: {},
		offMeshConnectionAttachments: {},
		tilePositionToSequenceCounter: {},
		offMeshConnectionSequenceCounter: 0,
		nodeIndexPool: createIndexPool(),
		tileIndexPool: createIndexPool(),
		offMeshConnectionIndexPool: createIndexPool(),
		linkIndexPool: createIndexPool()
	};
};
/**
* Gets a navigation mesh node by its reference.
* Note that navmesh nodes are pooled and may be reused on removing then adding tiles, so do not store node objects.
* @param navMesh the navigation mesh
* @param nodeRef the node reference
* @returns the navigation mesh node
*/
var getNodeByRef = (navMesh, nodeRef) => {
	const nodeIndex = getNodeRefIndex(nodeRef);
	return navMesh.nodes[nodeIndex];
};
/**
* Gets a navigation mesh node by its tile and polygon index.
* @param navMesh the navigation mesh
* @param tile the navigation mesh tile
* @param polyIndex the polygon index
* @returns the navigation mesh node
*/
var getNodeByTileAndPoly = (navMesh, tile, polyIndex) => {
	const navMeshNodeIndex = tile.polyNodes[polyIndex];
	return navMesh.nodes[navMeshNodeIndex];
};
/**
* Checks if a navigation mesh node reference is valid.
* @param navMesh the navigation mesh
* @param nodeRef the node reference
* @returns true if the node reference is valid, false otherwise
*/
var isValidNodeRef = (navMesh, nodeRef) => {
	if (nodeRef === -1) return false;
	const nodeType = getNodeRefType(nodeRef);
	if (nodeType === NodeType.POLY) {
		const node = getNodeByRef(navMesh, nodeRef);
		if (!node) return false;
		const tile = navMesh.tiles[node.tileId];
		if (!tile) return false;
		const sequence = getNodeRefSequence(nodeRef);
		if (tile.sequence !== sequence) return false;
		if (node.polyIndex < 0 || node.polyIndex >= tile.polys.length) return false;
		if (!tile.polys[node.polyIndex]) return false;
		return true;
	}
	if (nodeType === NodeType.OFFMESH) {
		const node = getNodeByRef(navMesh, nodeRef);
		if (!node) return false;
		const offMeshConnection = navMesh.offMeshConnections[node.offMeshConnectionId];
		if (!offMeshConnection) return false;
		const sequence = getNodeRefSequence(nodeRef);
		if (offMeshConnection.sequence !== sequence) return false;
		if (!isOffMeshConnectionConnected(navMesh, offMeshConnection.id)) return false;
		return true;
	}
	return false;
};
/**
* Gets all tiles at the given x and y position.
* @param navMesh the navigation mesh
* @param x the x position
* @param y the y position
* @returns the navigation mesh tiles
*/
var getTilesAt = (navMesh, x, y) => {
	const tileColumnHash = getTileColumnHash(x, y);
	const tileIds = navMesh.tileColumnToTileIds[tileColumnHash];
	if (!tileIds) return [];
	const tiles = [];
	for (const tileId of tileIds) tiles.push(navMesh.tiles[tileId]);
	return tiles;
};
var getNeighbourTilesAt = (navMesh, x, y, side) => {
	let nx = x;
	let ny = y;
	switch (side) {
		case 0:
			nx++;
			break;
		case 1:
			nx++;
			ny++;
			break;
		case 2:
			ny++;
			break;
		case 3:
			nx--;
			ny++;
			break;
		case 4:
			nx--;
			break;
		case 5:
			nx--;
			ny--;
			break;
		case 6:
			ny--;
			break;
		case 7:
			nx++;
			ny--;
	}
	return getTilesAt(navMesh, nx, ny);
};
var getTilePositionHash = (x, y, layer) => {
	return `${x},${y},${layer}`;
};
var getTileColumnHash = (x, y) => {
	return `${x},${y}`;
};
/**
* Returns the tile x and y position in the nav mesh from a world space position.
* @param outTilePosition the output tile position
* @param navMesh the navigation mesh
* @param worldPosition the world space position
*/
var worldToTilePosition = (outTilePosition, navMesh, worldPosition) => {
	outTilePosition[0] = Math.floor((worldPosition[0] - navMesh.origin[0]) / navMesh.tileWidth);
	outTilePosition[1] = Math.floor((worldPosition[2] - navMesh.origin[2]) / navMesh.tileHeight);
	return outTilePosition;
};
/**
* Gets the tile and polygon from a polygon reference
* @param ref The polygon reference
* @param navMesh The navigation mesh
* @returns Object containing tile and poly, or null if not found
*/
var getTileAndPolyByRef = (ref, navMesh) => {
	const result = {
		success: false,
		tile: null,
		poly: null,
		polyIndex: -1
	};
	if (getNodeRefType(ref) !== NodeType.POLY) return result;
	const { tileId, polyIndex } = getNodeByRef(navMesh, ref);
	const tile = navMesh.tiles[tileId];
	if (!tile) return result;
	if (polyIndex >= tile.polys.length) return result;
	result.poly = tile.polys[polyIndex];
	result.tile = tile;
	result.polyIndex = polyIndex;
	result.success = true;
	return result;
};
var _getDetailMeshHeight_closest = create$3();
/**
* Gets the height at a position inside a polygon using the detail mesh.
* Assumes the position is already known to be inside the polygon (in XZ).
* Falls back to closest point on detail edges if triangle checks fail.
* @param tile The tile containing the polygon
* @param poly The polygon
* @param polyIndex The index of the polygon in the tile
* @param pos The position to get height for
* @returns The height at the position
*/
var getDetailMeshHeight = (tile, poly, polyIndex, pos) => {
	const detailMesh = tile.detailMeshes[polyIndex];
	if (detailMesh) for (let j = 0; j < detailMesh.trianglesCount; ++j) {
		const t = (detailMesh.trianglesBase + j) * 4;
		const detailTriangles = tile.detailTriangles;
		const v = _getPolyHeight_triangle;
		for (let k = 0; k < 3; ++k) {
			const vertIndex = detailTriangles[t + k];
			if (vertIndex < poly.vertices.length) {
				const polyVertIndex = poly.vertices[vertIndex] * 3;
				v[k][0] = tile.vertices[polyVertIndex + 0];
				v[k][1] = tile.vertices[polyVertIndex + 1];
				v[k][2] = tile.vertices[polyVertIndex + 2];
			} else {
				const detailVertIndex = (detailMesh.verticesBase + (vertIndex - poly.vertices.length)) * 3;
				v[k][0] = tile.detailVertices[detailVertIndex + 0];
				v[k][1] = tile.detailVertices[detailVertIndex + 1];
				v[k][2] = tile.detailVertices[detailVertIndex + 2];
			}
		}
		const height = closestHeightPointTriangle(pos, v[0], v[1], v[2]);
		if (!Number.isNaN(height)) return height;
	}
	getClosestPointOnDetailEdges(_getDetailMeshHeight_closest, tile, poly, polyIndex, pos, false);
	return _getDetailMeshHeight_closest[1];
};
var _getPolyHeight_triangle = [
	create$3(),
	create$3(),
	create$3()
];
var _getPolyHeight_vertices = [];
var createGetPolyHeightResult = () => ({
	success: false,
	height: 0
});
/**
* Gets the height of a polygon at a given point using detail mesh if available.
* @param result The result object to populate
* @param tile The tile containing the polygon
* @param poly The polygon
* @param polyIndex The index of the polygon in the tile
* @param pos The position to get height for
* @returns The result object with success flag and height
*/
var getPolyHeight = (result, tile, poly, polyIndex, pos) => {
	result.success = false;
	result.height = 0;
	const nv = poly.vertices.length;
	const vertices = _getPolyHeight_vertices;
	for (let i = 0; i < nv; ++i) {
		const start = poly.vertices[i] * 3;
		vertices[i * 3] = tile.vertices[start];
		vertices[i * 3 + 1] = tile.vertices[start + 1];
		vertices[i * 3 + 2] = tile.vertices[start + 2];
	}
	if (!pointInPoly(pos, vertices, nv)) return result;
	result.height = getDetailMeshHeight(tile, poly, polyIndex, pos);
	result.success = true;
	return result;
};
/**
* Get flags for edge in detail triangle.
* @param[in]	triFlags		The flags for the triangle (last component of detail vertices above).
* @param[in]	edgeIndex		The index of the first vertex of the edge. For instance, if 0,
*								returns flags for edge AB.
* @returns The edge flags
*/
var getDetailTriEdgeFlags = (triFlags, edgeIndex) => {
	return triFlags >> edgeIndex * 2 & 3;
};
var _closestPointOnDetailEdges_triangleVertices = [
	create$3(),
	create$3(),
	create$3()
];
var _closestPointOnDetailEdges_pmin = create$3();
var _closestPointOnDetailEdges_pmax = create$3();
var _closestPointOnDetailEdges_distancePtSegSqr2dResult = createDistancePtSegSqr2dResult();
/**
* Gets the closest point on detail mesh edges to a given point
* @param tile The tile containing the detail mesh
* @param poly The polygon
* @param pos The position to find closest point for
* @param outClosestPoint Output parameter for the closest point
* @param onlyBoundary If true, only consider boundary edges
* @returns The squared distance to the closest point
*  closest point
*/
var getClosestPointOnDetailEdges = (outClosestPoint, tile, poly, polyIndex, pos, onlyBoundary) => {
	const detailMesh = tile.detailMeshes[polyIndex];
	let dmin = Number.MAX_VALUE;
	let tmin = 0;
	const pmin = set$1(_closestPointOnDetailEdges_pmin, 0, 0, 0);
	const pmax = set$1(_closestPointOnDetailEdges_pmax, 0, 0, 0);
	for (let i = 0; i < detailMesh.trianglesCount; i++) {
		const t = (detailMesh.trianglesBase + i) * 4;
		const detailTriangles = tile.detailTriangles;
		if (onlyBoundary) {
			if ((detailTriangles[t + 3] & 21) === 0) continue;
		}
		const triangleVertices = _closestPointOnDetailEdges_triangleVertices;
		for (let j = 0; j < 3; ++j) {
			const vertexIndex = detailTriangles[t + j];
			if (vertexIndex < poly.vertices.length) fromBuffer(triangleVertices[j], tile.vertices, poly.vertices[vertexIndex] * 3);
			else {
				const detailIndex = (detailMesh.verticesBase + (vertexIndex - poly.vertices.length)) * 3;
				fromBuffer(triangleVertices[j], tile.detailVertices, detailIndex);
			}
		}
		for (let k = 0, j = 2; k < 3; j = k++) {
			const triFlags = detailTriangles[t + 3];
			if ((getDetailTriEdgeFlags(triFlags, j) & 1) === 0 && (onlyBoundary || detailTriangles[t + j] < detailTriangles[t + k])) continue;
			const result = distancePtSegSqr2d(_closestPointOnDetailEdges_distancePtSegSqr2dResult, pos, triangleVertices[j], triangleVertices[k]);
			if (result.distSqr < dmin) {
				dmin = result.distSqr;
				tmin = result.t;
				copy(pmin, triangleVertices[j]);
				copy(pmax, triangleVertices[k]);
			}
		}
	}
	if (pmin && pmax) lerp(outClosestPoint, pmin, pmax, tmin);
	return dmin;
};
var createGetClosestPointOnPolyResult = () => {
	return {
		success: false,
		isOverPoly: false,
		position: [
			0,
			0,
			0
		]
	};
};
var _getClosestPointOnPoly_getPolyHeightResult = createGetPolyHeightResult();
/**
* Gets the closest point on a polygon to a given point
* @param result the result object to populate
* @param navMesh the navigation mesh
* @param nodeRef the polygon node reference
* @param position the point to find the closest point to
* @returns the result object
*/
var getClosestPointOnPoly = (result, navMesh, nodeRef, position) => {
	result.success = false;
	result.isOverPoly = false;
	copy(result.position, position);
	const tileAndPoly = getTileAndPolyByRef(nodeRef, navMesh);
	if (!tileAndPoly.success) return result;
	result.success = true;
	const { tile, poly, polyIndex } = tileAndPoly;
	const polyHeight = getPolyHeight(_getClosestPointOnPoly_getPolyHeightResult, tile, poly, polyIndex, position);
	if (polyHeight.success) {
		copy(result.position, position);
		result.position[1] = polyHeight.height;
		result.isOverPoly = true;
		return result;
	}
	getClosestPointOnDetailEdges(result.position, tile, poly, polyIndex, position, true);
	return result;
};
var _closestPointOnPolyBoundary_lineStart = create$3();
var _closestPointOnPolyBoundary_lineEnd = create$3();
var _closestPointOnPolyBoundary_vertices = [];
var _closestPointOnPolyBoundary_distancePtSegSqr2dResult = createDistancePtSegSqr2dResult();
/**
* Gets the closest point on the boundary of a polygon to a given point.
* If the point is inside the polygon (in XZ), the Y coordinate is adjusted to the polygon surface.
* @param out the output closest point
* @param navMesh the navigation mesh
* @param nodeRef the polygon node reference
* @param point the point to find the closest point to
* @returns whether the operation was successful
*/
var getClosestPointOnPolyBoundary = (out, navMesh, nodeRef, point) => {
	const tileAndPoly = getTileAndPolyByRef(nodeRef, navMesh);
	if (!tileAndPoly.success || !finite(point) || !out) return false;
	const { tile, poly, polyIndex } = tileAndPoly;
	const lineStart = _closestPointOnPolyBoundary_lineStart;
	const lineEnd = _closestPointOnPolyBoundary_lineEnd;
	const verticesCount = poly.vertices.length;
	const vertices = _closestPointOnPolyBoundary_vertices;
	for (let i = 0; i < verticesCount; ++i) {
		const vIndex = poly.vertices[i] * 3;
		vertices[i * 3] = tile.vertices[vIndex];
		vertices[i * 3 + 1] = tile.vertices[vIndex + 1];
		vertices[i * 3 + 2] = tile.vertices[vIndex + 2];
	}
	if (pointInPoly(point, vertices, verticesCount)) {
		out[0] = point[0];
		out[2] = point[2];
		out[1] = getDetailMeshHeight(tile, poly, polyIndex, point);
		return true;
	}
	let dmin = Number.MAX_VALUE;
	let imin = 0;
	for (let i = 0; i < verticesCount; ++i) {
		const j = (i + 1) % verticesCount;
		const vaIndex = i * 3;
		const vbIndex = j * 3;
		lineStart[0] = vertices[vaIndex + 0];
		lineStart[1] = vertices[vaIndex + 1];
		lineStart[2] = vertices[vaIndex + 2];
		lineEnd[0] = vertices[vbIndex + 0];
		lineEnd[1] = vertices[vbIndex + 1];
		lineEnd[2] = vertices[vbIndex + 2];
		distancePtSegSqr2d(_closestPointOnPolyBoundary_distancePtSegSqr2dResult, point, lineStart, lineEnd);
		if (_closestPointOnPolyBoundary_distancePtSegSqr2dResult.distSqr < dmin) {
			dmin = _closestPointOnPolyBoundary_distancePtSegSqr2dResult.distSqr;
			imin = i;
		}
	}
	const j = (imin + 1) % verticesCount;
	const vaIndex = imin * 3;
	const vbIndex = j * 3;
	const va0 = vertices[vaIndex + 0];
	const va1 = vertices[vaIndex + 1];
	const va2 = vertices[vaIndex + 2];
	const vb0 = vertices[vbIndex + 0];
	const vb1 = vertices[vbIndex + 1];
	const vb2 = vertices[vbIndex + 2];
	const pqx = vb0 - va0;
	const pqz = vb2 - va2;
	const dx = point[0] - va0;
	const dz = point[2] - va2;
	const denom = pqx * pqx + pqz * pqz;
	let t = denom > 0 ? (pqx * dx + pqz * dz) / denom : 0;
	if (t < 0) t = 0;
	else if (t > 1) t = 1;
	out[0] = va0 + (vb0 - va0) * t;
	out[1] = va1 + (vb1 - va1) * t;
	out[2] = va2 + (vb2 - va2) * t;
	return true;
};
var createFindNearestPolyResult = () => {
	return {
		success: false,
		nodeRef: -1,
		position: [
			0,
			0,
			0
		]
	};
};
var _findNearestPoly_closestPointResult = createGetClosestPointOnPolyResult();
var _findNearestPoly_diff = create$3();
var _findNearestPoly_bounds = create$2();
var findNearestPoly = (result, navMesh, center, halfExtents, queryFilter) => {
	result.success = false;
	result.nodeRef = 0;
	copy(result.position, center);
	const bounds = _findNearestPoly_bounds;
	bounds[0] = center[0] - halfExtents[0];
	bounds[1] = center[1] - halfExtents[1];
	bounds[2] = center[2] - halfExtents[2];
	bounds[3] = center[0] + halfExtents[0];
	bounds[4] = center[1] + halfExtents[1];
	bounds[5] = center[2] + halfExtents[2];
	const polys = queryPolygons(navMesh, bounds, queryFilter);
	let nearestDistSqr = Number.MAX_VALUE;
	for (const ref of polys) {
		const closestPoint = getClosestPointOnPoly(_findNearestPoly_closestPointResult, navMesh, ref, center);
		if (!closestPoint.success) continue;
		const { tileId } = getNodeByRef(navMesh, ref);
		const tile = navMesh.tiles[tileId];
		if (!tile) continue;
		sub(_findNearestPoly_diff, center, closestPoint.position);
		let distSqr;
		if (closestPoint.isOverPoly) {
			const heightDiff = Math.abs(_findNearestPoly_diff[1]) - tile.walkableClimb;
			distSqr = heightDiff > 0 ? heightDiff * heightDiff : 0;
		} else distSqr = squaredLength(_findNearestPoly_diff);
		if (distSqr < nearestDistSqr) {
			nearestDistSqr = distSqr;
			result.nodeRef = ref;
			copy(result.position, closestPoint.position);
			result.success = true;
		}
	}
	return result;
};
var _queryPolygonsInTile_bmax = create$3();
var _queryPolygonsInTile_bmin = create$3();
var queryPolygonsInTile = (out, navMesh, tile, bounds, filter) => {
	let nodeIndex = 0;
	const endIndex = tile.bvTree.nodes.length;
	const qfac = tile.bvTree.quantFactor;
	const tbminX = tile.bounds[0], tbminY = tile.bounds[1], tbminZ = tile.bounds[2];
	const tbmaxX = tile.bounds[3], tbmaxY = tile.bounds[4], tbmaxZ = tile.bounds[5];
	const minx = Math.max(Math.min(bounds[0], tbmaxX), tbminX) - tbminX;
	const miny = Math.max(Math.min(bounds[1], tbmaxY), tbminY) - tbminY;
	const minz = Math.max(Math.min(bounds[2], tbmaxZ), tbminZ) - tbminZ;
	const maxx = Math.max(Math.min(bounds[3], tbmaxX), tbminX) - tbminX;
	const maxy = Math.max(Math.min(bounds[4], tbmaxY), tbminY) - tbminY;
	const maxz = Math.max(Math.min(bounds[5], tbmaxZ), tbminZ) - tbminZ;
	_queryPolygonsInTile_bmin[0] = Math.floor(qfac * minx) & 65534;
	_queryPolygonsInTile_bmin[1] = Math.floor(qfac * miny) & 65534;
	_queryPolygonsInTile_bmin[2] = Math.floor(qfac * minz) & 65534;
	_queryPolygonsInTile_bmax[0] = Math.floor(qfac * maxx + 1) | 1;
	_queryPolygonsInTile_bmax[1] = Math.floor(qfac * maxy + 1) | 1;
	_queryPolygonsInTile_bmax[2] = Math.floor(qfac * maxz + 1) | 1;
	while (nodeIndex < endIndex) {
		const bvNode = tile.bvTree.nodes[nodeIndex];
		const nodeBounds = bvNode.bounds;
		const overlap = _queryPolygonsInTile_bmin[0] <= nodeBounds[3] && _queryPolygonsInTile_bmax[0] >= nodeBounds[0] && _queryPolygonsInTile_bmin[1] <= nodeBounds[4] && _queryPolygonsInTile_bmax[1] >= nodeBounds[1] && _queryPolygonsInTile_bmin[2] <= nodeBounds[5] && _queryPolygonsInTile_bmax[2] >= nodeBounds[2];
		const isLeafNode = bvNode.i >= 0;
		if (isLeafNode && overlap) {
			const polyIndex = bvNode.i;
			const node = getNodeByTileAndPoly(navMesh, tile, polyIndex);
			if (filter.passFilter(node.ref, navMesh)) out.push(node.ref);
		}
		if (overlap || isLeafNode) nodeIndex++;
		else {
			const escapeIndex = -bvNode.i;
			nodeIndex += escapeIndex;
		}
	}
};
var _queryPolygons_minTile = create$4();
var _queryPolygons_maxTile = create$4();
var _queryPolygons_minPos = create$3();
var _queryPolygons_maxPos = create$3();
var queryPolygons = (navMesh, bounds, filter) => {
	const result = [];
	min(_queryPolygons_minPos, bounds);
	max(_queryPolygons_maxPos, bounds);
	const minTile = worldToTilePosition(_queryPolygons_minTile, navMesh, _queryPolygons_minPos);
	const maxTile = worldToTilePosition(_queryPolygons_maxTile, navMesh, _queryPolygons_maxPos);
	if (!finite$1(minTile) || !finite$1(maxTile)) return result;
	for (let x = minTile[0]; x <= maxTile[0]; x++) for (let y = minTile[1]; y <= maxTile[1]; y++) {
		const tiles = getTilesAt(navMesh, x, y);
		for (const tile of tiles) queryPolygonsInTile(result, navMesh, tile, bounds, filter);
	}
	return result;
};
var allocateNode = (navMesh) => {
	const nodeIndex = requestIndex(navMesh.nodeIndexPool);
	let node = navMesh.nodes[nodeIndex];
	if (!node) node = navMesh.nodes[nodeIndex] = {
		allocated: true,
		index: nodeIndex,
		ref: 0,
		area: 0,
		flags: 0,
		links: [],
		type: 0,
		tileId: -1,
		polyIndex: -1,
		offMeshConnectionId: -1
	};
	node.allocated = true;
	return node;
};
var releaseNode = (navMesh, index) => {
	const node = navMesh.nodes[index];
	node.allocated = false;
	node.links.length = 0;
	node.ref = 0;
	node.type = 0;
	node.area = -1;
	node.flags = -1;
	node.tileId = -1;
	node.polyIndex = -1;
	node.offMeshConnectionId = -1;
	releaseIndex(navMesh.nodeIndexPool, index);
};
/**
* Allocates a link and returns it's index
*/
var allocateLink = (navMesh) => {
	const linkIndex = requestIndex(navMesh.linkIndexPool);
	let link = navMesh.links[linkIndex];
	if (!link) link = navMesh.links[linkIndex] = {
		allocated: true,
		index: linkIndex,
		fromNodeIndex: -1,
		fromNodeRef: -1,
		toNodeIndex: -1,
		toNodeRef: -1,
		edge: 0,
		side: 0,
		bmin: 0,
		bmax: 0
	};
	link.allocated = true;
	return linkIndex;
};
/**
* Releases a link
*/
var releaseLink = (navMesh, index) => {
	const link = navMesh.links[index];
	link.allocated = false;
	link.fromNodeIndex = -1;
	link.fromNodeRef = -1;
	link.toNodeIndex = -1;
	link.toNodeRef = -1;
	link.edge = 0;
	link.side = 0;
	link.bmin = 0;
	link.bmax = 0;
	releaseIndex(navMesh.linkIndexPool, index);
};
var connectInternalLinks = (navMesh, tile) => {
	for (let polyIndex = 0; polyIndex < tile.polys.length; polyIndex++) {
		const poly = tile.polys[polyIndex];
		const node = getNodeByTileAndPoly(navMesh, tile, polyIndex);
		for (let edgeIndex = 0; edgeIndex < poly.vertices.length; edgeIndex++) {
			const neiValue = poly.neis[edgeIndex];
			if (neiValue === 0 || neiValue & 32768) continue;
			const neighborPolyIndex = neiValue - 1;
			if (neighborPolyIndex >= 0 && neighborPolyIndex < tile.polys.length) {
				const linkIndex = allocateLink(navMesh);
				const link = navMesh.links[linkIndex];
				const neighbourNode = getNodeByTileAndPoly(navMesh, tile, neighborPolyIndex);
				link.fromNodeIndex = node.index;
				link.fromNodeRef = node.ref;
				link.toNodeIndex = neighbourNode.index;
				link.toNodeRef = neighbourNode.ref;
				link.edge = edgeIndex;
				link.side = 255;
				link.bmin = 0;
				link.bmax = 0;
				node.links.push(linkIndex);
			}
		}
	}
};
var oppositeTile = (side) => side + 4 & 7;
var getSlabCoord = (v, side) => {
	if (side === 0 || side === 4) return v[0];
	if (side === 2 || side === 6) return v[2];
	return 0;
};
var calcSlabEndPoints = (va, vb, bmin, bmax, side) => {
	if (side === 0 || side === 4) {
		if (va[2] < vb[2]) {
			bmin[0] = va[2];
			bmin[1] = va[1];
			bmax[0] = vb[2];
			bmax[1] = vb[1];
		} else {
			bmin[0] = vb[2];
			bmin[1] = vb[1];
			bmax[0] = va[2];
			bmax[1] = va[1];
		}
	} else if (side === 2 || side === 6) {
		if (va[0] < vb[0]) {
			bmin[0] = va[0];
			bmin[1] = va[1];
			bmax[0] = vb[0];
			bmax[1] = vb[1];
		} else {
			bmin[0] = vb[0];
			bmin[1] = vb[1];
			bmax[0] = va[0];
			bmax[1] = va[1];
		}
	}
};
var overlapSlabs = (amin, amax, bmin, bmax, px, py) => {
	const minx = Math.max(amin[0] + px, bmin[0] + px);
	const maxx = Math.min(amax[0] - px, bmax[0] - px);
	if (minx > maxx) return false;
	const ad = (amax[1] - amin[1]) / (amax[0] - amin[0]);
	const ak = amin[1] - ad * amin[0];
	const bd = (bmax[1] - bmin[1]) / (bmax[0] - bmin[0]);
	const bk = bmin[1] - bd * bmin[0];
	const aminy = ad * minx + ak;
	const amaxy = ad * maxx + ak;
	const bminy = bd * minx + bk;
	const bmaxy = bd * maxx + bk;
	const dmin = bminy - aminy;
	const dmax = bmaxy - amaxy;
	if (dmin * dmax < 0) return true;
	const thr = py * 2 * (py * 2);
	if (dmin * dmin <= thr || dmax * dmax <= thr) return true;
	return false;
};
var _amin = create$3();
var _amax = create$3();
var _bmin = create$3();
var _bmax = create$3();
/**
* Find connecting external polys between edge va->vb in target tile on opposite side.
* Returns array of { ref, tmin, tmax } describing overlapping intervals along the edge.
* @param va vertex A
* @param vb vertex B
* @param target target tile
* @param side portal side
* @returns array of connecting polygons
*/
var findConnectingPolys = (navMesh, va, vb, target, side) => {
	if (!target) return [];
	calcSlabEndPoints(va, vb, _amin, _amax, side);
	const apos = getSlabCoord(va, side);
	const results = [];
	for (let i = 0; i < target.polys.length; i++) {
		const poly = target.polys[i];
		const nv = poly.vertices.length;
		for (let j = 0; j < nv; j++) {
			const nei = poly.neis[j];
			if ((nei & 32768) === 0) continue;
			if ((nei & 255) !== side) continue;
			const vcIndex = poly.vertices[j];
			const vdIndex = poly.vertices[(j + 1) % nv];
			const vc = [
				target.vertices[vcIndex * 3],
				target.vertices[vcIndex * 3 + 1],
				target.vertices[vcIndex * 3 + 2]
			];
			const vd = [
				target.vertices[vdIndex * 3],
				target.vertices[vdIndex * 3 + 1],
				target.vertices[vdIndex * 3 + 2]
			];
			const bpos = getSlabCoord(vc, side);
			if (Math.abs(apos - bpos) > .01) continue;
			calcSlabEndPoints(vc, vd, _bmin, _bmax, side);
			if (!overlapSlabs(_amin, _amax, _bmin, _bmax, .01, target.walkableClimb)) continue;
			const polyRef = getNodeByTileAndPoly(navMesh, target, i).ref;
			results.push({
				nodeRef: polyRef,
				umin: Math.max(_amin[0], _bmin[0]),
				umax: Math.min(_amax[0], _bmax[0])
			});
			break;
		}
	}
	return results;
};
var _va = create$3();
var _vb = create$3();
var connectExternalLinks = (navMesh, tile, target, side) => {
	for (let polyIndex = 0; polyIndex < tile.polys.length; polyIndex++) {
		const poly = tile.polys[polyIndex];
		const node = getNodeByTileAndPoly(navMesh, tile, polyIndex);
		const nv = poly.vertices.length;
		for (let j = 0; j < nv; j++) {
			if ((poly.neis[j] & 32768) === 0) continue;
			const dir = poly.neis[j] & 255;
			if (side !== -1 && dir !== side) continue;
			const va = fromBuffer(_va, tile.vertices, poly.vertices[j] * 3);
			const vb = fromBuffer(_vb, tile.vertices, poly.vertices[(j + 1) % nv] * 3);
			const overlaps = findConnectingPolys(navMesh, va, vb, target, oppositeTile(dir));
			for (const o of overlaps) {
				let tmin;
				let tmax;
				if (dir === 0 || dir === 4) {
					tmin = (o.umin - va[2]) / (vb[2] - va[2]);
					tmax = (o.umax - va[2]) / (vb[2] - va[2]);
				} else {
					tmin = (o.umin - va[0]) / (vb[0] - va[0]);
					tmax = (o.umax - va[0]) / (vb[0] - va[0]);
				}
				if (tmin > tmax) {
					const tmp = tmin;
					tmin = tmax;
					tmax = tmp;
				}
				tmin = Math.max(0, Math.min(1, tmin));
				tmax = Math.max(0, Math.min(1, tmax));
				const linkIndex = allocateLink(navMesh);
				const link = navMesh.links[linkIndex];
				link.fromNodeIndex = node.index;
				link.fromNodeRef = node.ref;
				link.toNodeIndex = getNodeRefIndex(o.nodeRef);
				link.toNodeRef = o.nodeRef;
				link.edge = j;
				link.side = dir;
				link.bmin = Math.round(tmin * 255);
				link.bmax = Math.round(tmax * 255);
				node.links.push(linkIndex);
			}
		}
	}
};
/**
* Disconnect external links from tile to target tile
*/
var disconnectExternalLinks = (navMesh, tile, target) => {
	const targetId = target.id;
	for (let polyIndex = 0; polyIndex < tile.polys.length; polyIndex++) {
		const node = getNodeByTileAndPoly(navMesh, tile, polyIndex);
		const filteredLinks = [];
		for (let k = 0; k < node.links.length; k++) {
			const linkIndex = node.links[k];
			const link = navMesh.links[linkIndex];
			if (getNodeByRef(navMesh, link.toNodeRef).tileId === targetId) releaseLink(navMesh, linkIndex);
			else filteredLinks.push(linkIndex);
		}
		node.links = filteredLinks;
	}
};
var createOffMeshLink = (navMesh, from, to, edge) => {
	const linkIndex = allocateLink(navMesh);
	const link = navMesh.links[linkIndex];
	link.fromNodeIndex = from.index;
	link.fromNodeRef = from.ref;
	link.toNodeIndex = to.index;
	link.toNodeRef = to.ref;
	link.edge = edge;
	link.side = 0;
	link.bmin = 0;
	link.bmax = 0;
	from.links.push(linkIndex);
};
var _connectOffMeshConnection_nearestPolyStart = createFindNearestPolyResult();
var _connectOffMeshConnection_nearestPolyEnd = createFindNearestPolyResult();
var _connectOffMeshConnection_halfExtents = create$3();
var connectOffMeshConnection = (navMesh, offMeshConnection) => {
	const radiusHalfExtents = set$1(_connectOffMeshConnection_halfExtents, offMeshConnection.radius, offMeshConnection.radius, offMeshConnection.radius);
	const startTilePolyResult = findNearestPoly(_connectOffMeshConnection_nearestPolyStart, navMesh, offMeshConnection.start, radiusHalfExtents, DEFAULT_QUERY_FILTER);
	const endTilePolyResult = findNearestPoly(_connectOffMeshConnection_nearestPolyEnd, navMesh, offMeshConnection.end, radiusHalfExtents, DEFAULT_QUERY_FILTER);
	if (!startTilePolyResult.success || !endTilePolyResult.success) return false;
	const startNodeRef = startTilePolyResult.nodeRef;
	const startNode = getNodeByRef(navMesh, startNodeRef);
	const endNodeRef = endTilePolyResult.nodeRef;
	const endNode = getNodeByRef(navMesh, endNodeRef);
	const offMeshConnectionState = {
		offMeshNode: -1,
		startPolyNode: startNodeRef,
		endPolyNode: endNodeRef
	};
	navMesh.offMeshConnectionAttachments[offMeshConnection.id] = offMeshConnectionState;
	const offMeshNode = allocateNode(navMesh);
	const offMeshNodeRef = serNodeRef(NodeType.OFFMESH, offMeshNode.index, offMeshConnection.sequence);
	offMeshNode.type = NodeType.OFFMESH;
	offMeshNode.ref = offMeshNodeRef;
	offMeshNode.area = offMeshConnection.area;
	offMeshNode.flags = offMeshConnection.flags;
	offMeshNode.offMeshConnectionId = offMeshConnection.id;
	offMeshConnectionState.offMeshNode = offMeshNodeRef;
	createOffMeshLink(navMesh, startNode, offMeshNode, 0);
	createOffMeshLink(navMesh, offMeshNode, endNode, 1);
	if (offMeshConnection.direction === OffMeshConnectionDirection.BIDIRECTIONAL) {
		createOffMeshLink(navMesh, endNode, offMeshNode, 1);
		createOffMeshLink(navMesh, offMeshNode, startNode, 0);
	}
	return true;
};
var disconnectOffMeshConnection = (navMesh, offMeshConnection) => {
	const offMeshConnectionState = navMesh.offMeshConnectionAttachments[offMeshConnection.id];
	if (!offMeshConnectionState) return false;
	const offMeshConnectionNodeRef = offMeshConnectionState.offMeshNode;
	const startPolyNode = offMeshConnectionState.startPolyNode;
	const endPolyNode = offMeshConnectionState.endPolyNode;
	const startNode = getNodeByRef(navMesh, startPolyNode);
	if (startNode) for (let i = startNode.links.length - 1; i >= 0; i--) {
		const linkId = startNode.links[i];
		if (navMesh.links[linkId].toNodeRef === offMeshConnectionNodeRef) {
			releaseLink(navMesh, linkId);
			startNode.links.splice(i, 1);
		}
	}
	const endNode = getNodeByRef(navMesh, endPolyNode);
	if (endNode) for (let i = endNode.links.length - 1; i >= 0; i--) {
		const linkId = endNode.links[i];
		if (navMesh.links[linkId].toNodeRef === offMeshConnectionNodeRef) {
			releaseLink(navMesh, linkId);
			endNode.links.splice(i, 1);
		}
	}
	const offMeshNode = getNodeByRef(navMesh, offMeshConnectionNodeRef);
	if (offMeshNode) for (let i = offMeshNode.links.length - 1; i >= 0; i--) {
		const linkId = offMeshNode.links[i];
		releaseLink(navMesh, linkId);
	}
	releaseNode(navMesh, getNodeRefIndex(offMeshConnectionNodeRef));
	delete navMesh.offMeshConnectionAttachments[offMeshConnection.id];
	return true;
};
/**
* Reconnects an off mesh connection. This must be called if any properties of an off mesh connection are changed, for example the start or end positions.
* @param navMesh the navmesh
* @param offMeshConnection the off mesh connectionion to reconnect
* @returns whether the off mesh connection was successfully reconnected
*/
var reconnectOffMeshConnection = (navMesh, offMeshConnection) => {
	disconnectOffMeshConnection(navMesh, offMeshConnection);
	return connectOffMeshConnection(navMesh, offMeshConnection);
};
var updateOffMeshConnections = (navMesh) => {
	for (const id in navMesh.offMeshConnections) {
		const offMeshConnection = navMesh.offMeshConnections[id];
		if (!isOffMeshConnectionConnected(navMesh, offMeshConnection.id)) reconnectOffMeshConnection(navMesh, offMeshConnection);
	}
};
/**
* Builds a navmesh tile from the given parameters
* This builds a BV-tree for the tile, and initializes runtime tile properties
* @param params the parameters to build the tile from
* @returns the built navmesh tile
*/
var buildTile = (params) => {
	const bvTree = buildNavMeshBvTree(params);
	return {
		...params,
		id: -1,
		sequence: -1,
		bvTree,
		polyNodes: []
	};
};
/**
* Adds a tile to the navmesh.
* If a tile already exists at the same position, it will be removed first.
* @param navMesh the navmesh to add the tile to
* @param tile the tile to add
*/
var addTile = (navMesh, tile) => {
	const tilePositionHash = getTilePositionHash(tile.tileX, tile.tileY, tile.tileLayer);
	if (navMesh.tilePositionToTileId[tilePositionHash] !== void 0) removeTile(navMesh, tile.tileX, tile.tileY, tile.tileLayer);
	let sequence = navMesh.tilePositionToSequenceCounter[tilePositionHash];
	if (sequence === void 0) sequence = 0;
	else sequence = (sequence + 1) % MAX_SEQUENCE;
	navMesh.tilePositionToSequenceCounter[tilePositionHash] = sequence;
	tile.id = requestIndex(navMesh.tileIndexPool);
	tile.sequence = sequence;
	navMesh.tiles[tile.id] = tile;
	navMesh.tilePositionToTileId[tilePositionHash] = tile.id;
	const tileColumnHash = getTileColumnHash(tile.tileX, tile.tileY);
	if (!navMesh.tileColumnToTileIds[tileColumnHash]) navMesh.tileColumnToTileIds[tileColumnHash] = [];
	navMesh.tileColumnToTileIds[tileColumnHash].push(tile.id);
	for (let i = 0; i < tile.polys.length; i++) {
		const node = allocateNode(navMesh);
		node.ref = serNodeRef(NodeType.POLY, node.index, tile.sequence);
		node.type = NodeType.POLY;
		node.area = tile.polys[i].area;
		node.flags = tile.polys[i].flags;
		node.tileId = tile.id;
		node.polyIndex = i;
		node.links.length = 0;
		tile.polyNodes.push(node.index);
	}
	connectInternalLinks(navMesh, tile);
	const tilesAtCurrentPosition = getTilesAt(navMesh, tile.tileX, tile.tileY);
	for (const tileAtCurrentPosition of tilesAtCurrentPosition) {
		if (tileAtCurrentPosition.id === tile.id) continue;
		connectExternalLinks(navMesh, tileAtCurrentPosition, tile, -1);
		connectExternalLinks(navMesh, tile, tileAtCurrentPosition, -1);
	}
	for (let side = 0; side < 8; side++) {
		const neighbourTiles = getNeighbourTilesAt(navMesh, tile.tileX, tile.tileY, side);
		for (const neighbourTile of neighbourTiles) {
			connectExternalLinks(navMesh, tile, neighbourTile, side);
			connectExternalLinks(navMesh, neighbourTile, tile, oppositeTile(side));
		}
	}
	updateOffMeshConnections(navMesh);
};
/**
* Removes the tile at the given location
* @param navMesh the navmesh to remove the tile from
* @param x the x coordinate of the tile
* @param y the y coordinate of the tile
* @param layer the layer of the tile
* @returns true if the tile was removed, otherwise false
*/
var removeTile = (navMesh, x, y, layer) => {
	const tileHash = getTilePositionHash(x, y, layer);
	const tileId = navMesh.tilePositionToTileId[tileHash];
	const tile = navMesh.tiles[tileId];
	if (!tile) return false;
	const tilesAtCurrentPosition = getTilesAt(navMesh, x, y);
	for (const tileAtCurrentPosition of tilesAtCurrentPosition) {
		if (tileAtCurrentPosition.id === tileId) continue;
		disconnectExternalLinks(navMesh, tileAtCurrentPosition, tile);
		disconnectExternalLinks(navMesh, tile, tileAtCurrentPosition);
	}
	for (let side = 0; side < 8; side++) {
		const neighbourTiles = getNeighbourTilesAt(navMesh, x, y, side);
		for (const neighbourTile of neighbourTiles) {
			disconnectExternalLinks(navMesh, neighbourTile, tile);
			disconnectExternalLinks(navMesh, tile, neighbourTile);
		}
	}
	for (let polyIndex = 0; polyIndex < tile.polys.length; polyIndex++) {
		const node = getNodeByTileAndPoly(navMesh, tile, polyIndex);
		for (const link of node.links) releaseLink(navMesh, link);
	}
	for (let i = 0; i < tile.polyNodes.length; i++) releaseNode(navMesh, tile.polyNodes[i]);
	tile.polyNodes.length = 0;
	delete navMesh.tiles[tileId];
	delete navMesh.tilePositionToTileId[tileHash];
	const tileColumnHash = getTileColumnHash(x, y);
	const tileColumn = navMesh.tileColumnToTileIds[tileColumnHash];
	if (tileColumn) {
		const tileIndexInColumn = tileColumn.indexOf(tileId);
		if (tileIndexInColumn !== -1) tileColumn.splice(tileIndexInColumn, 1);
		if (tileColumn.length === 0) delete navMesh.tileColumnToTileIds[tileColumnHash];
	}
	releaseIndex(navMesh.tileIndexPool, tileId);
	updateOffMeshConnections(navMesh);
	return true;
};
/**
* Adds a new off mesh connection to the NavMesh, and returns it's ID
* @param navMesh the navmesh to add the off mesh connection to
* @param offMeshConnectionParams the parameters of the off mesh connection to add
* @returns the ID of the added off mesh connection
*/
var addOffMeshConnection = (navMesh, offMeshConnectionParams) => {
	const id = requestIndex(navMesh.offMeshConnectionIndexPool);
	const sequence = navMesh.offMeshConnectionSequenceCounter;
	navMesh.offMeshConnectionSequenceCounter = (navMesh.offMeshConnectionSequenceCounter + 1) % MAX_SEQUENCE;
	const offMeshConnection = {
		...offMeshConnectionParams,
		id,
		sequence
	};
	navMesh.offMeshConnections[id] = offMeshConnection;
	connectOffMeshConnection(navMesh, offMeshConnection);
	return id;
};
/**
* Removes an off mesh connection from the NavMesh
* @param navMesh the navmesh to remove the off mesh connection from
* @param offMeshConnectionId the ID of the off mesh connection to remove
*/
var removeOffMeshConnection = (navMesh, offMeshConnectionId) => {
	const offMeshConnection = navMesh.offMeshConnections[offMeshConnectionId];
	if (!offMeshConnection) return;
	releaseIndex(navMesh.offMeshConnectionIndexPool, offMeshConnection.id);
	disconnectOffMeshConnection(navMesh, offMeshConnection);
	delete navMesh.offMeshConnections[offMeshConnection.id];
};
/**
* Returns whether the off mesh connection with the given ID is currently connected to the navmesh.
* An off mesh connection may be disconnected if the start or end positions have no valid polygons nearby to connect to.
* @param navMesh the navmesh
* @param offMeshConnectionId the ID of the off mesh connection
* @returns whether the off mesh connection is connected
*/
var isOffMeshConnectionConnected = (navMesh, offMeshConnectionId) => {
	const offMeshConnectionState = navMesh.offMeshConnectionAttachments[offMeshConnectionId];
	if (!offMeshConnectionState) return false;
	const { startPolyNode, endPolyNode } = offMeshConnectionState;
	return isValidNodeRef(navMesh, startPolyNode) && isValidNodeRef(navMesh, endPolyNode);
};
var createDefaultQueryFilter = () => {
	return {
		includeFlags: 4294967295,
		excludeFlags: 0,
		getCost(pa, pb, _navMesh, _prevRef, _curRef, _nextRef) {
			return distance(pa, pb);
		},
		passFilter(nodeRef, navMesh) {
			const { flags } = getNodeByRef(navMesh, nodeRef);
			return (flags & this.includeFlags) !== 0 && (flags & this.excludeFlags) === 0;
		}
	};
};
var DEFAULT_QUERY_FILTER = createDefaultQueryFilter();
var getSearchNode = (pool, nodeRef, state) => {
	const nodes = pool[nodeRef];
	if (!nodes) return void 0;
	for (let i = 0; i < nodes.length; i++) if (nodes[i].state === state) return nodes[i];
};
var addSearchNode = (pool, node) => {
	if (!pool[node.nodeRef]) pool[node.nodeRef] = [];
	pool[node.nodeRef].push(node);
};
var bubbleUpQueue = (queue, i, node) => {
	let parent = Math.floor((i - 1) / 2);
	while (i > 0 && queue[parent].total > node.total) {
		queue[i] = queue[parent];
		i = parent;
		parent = Math.floor((i - 1) / 2);
	}
	queue[i] = node;
};
var trickleDownQueue = (queue, i, node) => {
	const count = queue.length;
	let child = 2 * i + 1;
	while (child < count) {
		if (child + 1 < count && queue[child + 1].total < queue[child].total) child++;
		if (node.total <= queue[child].total) break;
		queue[i] = queue[child];
		i = child;
		child = i * 2 + 1;
	}
	queue[i] = node;
};
var pushNodeToQueue = (queue, node) => {
	queue.push(node);
	bubbleUpQueue(queue, queue.length - 1, node);
};
var popNodeFromQueue = (queue) => {
	if (queue.length === 0) return;
	const node = queue[0];
	const lastNode = queue.pop();
	if (queue.length > 0 && lastNode !== void 0) {
		queue[0] = lastNode;
		trickleDownQueue(queue, 0, lastNode);
	}
	return node;
};
var reindexNodeInQueue = (queue, node) => {
	for (let i = 0; i < queue.length; i++) if (queue[i].nodeRef === node.nodeRef && queue[i].state === node.state) {
		queue[i] = node;
		bubbleUpQueue(queue, i, node);
		return;
	}
};
var _getPortalPoints_start = create$3();
var _getPortalPoints_end = create$3();
/**
* Retrieves the left and right points of the portal edge between two adjacent polygons.
* Or if one of the polygons is an off-mesh connection, returns the connection endpoint for both left and right.
*/
var getPortalPoints = (navMesh, fromNodeRef, toNodeRef, outLeft, outRight) => {
	let toLink;
	const fromNode = getNodeByRef(navMesh, fromNodeRef);
	for (const linkIndex of fromNode.links) {
		const link = navMesh.links[linkIndex];
		if (link.toNodeRef === toNodeRef) {
			toLink = link;
			break;
		}
	}
	if (!toLink) return false;
	const fromNodeType = getNodeRefType(fromNodeRef);
	const toNodeType = getNodeRefType(toNodeRef);
	if (fromNodeType === NodeType.POLY && toNodeType === NodeType.POLY) {
		const { tileId: fromTileId, polyIndex: fromPolyIndex } = getNodeByRef(navMesh, fromNodeRef);
		const fromTile = navMesh.tiles[fromTileId];
		const fromPoly = fromTile.polys[fromPolyIndex];
		const v0Index = fromPoly.vertices[toLink.edge];
		const v1Index = fromPoly.vertices[(toLink.edge + 1) % fromPoly.vertices.length];
		const v0Offset = v0Index * 3;
		const v1Offset = v1Index * 3;
		if (toLink.side !== 255 && (toLink.bmin !== 0 || toLink.bmax !== 255)) {
			const s = 1 / 255;
			const tmin = toLink.bmin * s;
			const tmax = toLink.bmax * s;
			fromBuffer(_getPortalPoints_start, fromTile.vertices, v0Offset);
			fromBuffer(_getPortalPoints_end, fromTile.vertices, v1Offset);
			lerp(outLeft, _getPortalPoints_start, _getPortalPoints_end, tmin);
			lerp(outRight, _getPortalPoints_start, _getPortalPoints_end, tmax);
		} else {
			fromBuffer(outLeft, fromTile.vertices, v0Offset);
			fromBuffer(outRight, fromTile.vertices, v1Offset);
		}
		return true;
	}
	if (fromNodeType === NodeType.POLY && toNodeType === NodeType.OFFMESH) {
		const toNode = getNodeByRef(navMesh, toNodeRef);
		const offMeshConnection = navMesh.offMeshConnections[toNode.offMeshConnectionId];
		if (!offMeshConnection) return false;
		const position = toLink && toLink.edge === 0 ? offMeshConnection.start : offMeshConnection.end;
		copy(outLeft, position);
		copy(outRight, position);
		return true;
	}
	if (fromNodeType === NodeType.OFFMESH && toNodeType === NodeType.POLY) {
		const offMeshConnection = navMesh.offMeshConnections[fromNode.offMeshConnectionId];
		if (!offMeshConnection) return false;
		const position = toLink && toLink.edge === 0 ? offMeshConnection.start : offMeshConnection.end;
		copy(outLeft, position);
		copy(outRight, position);
		return true;
	}
	return false;
};
var _edgeMidPointPortalLeft = create$3();
var _edgeMidPointPortalRight = create$3();
var getEdgeMidPoint = (navMesh, fromNodeRef, toNodeRef, outMidPoint) => {
	if (!getPortalPoints(navMesh, fromNodeRef, toNodeRef, _edgeMidPointPortalLeft, _edgeMidPointPortalRight)) return false;
	outMidPoint[0] = (_edgeMidPointPortalLeft[0] + _edgeMidPointPortalRight[0]) * .5;
	outMidPoint[1] = (_edgeMidPointPortalLeft[1] + _edgeMidPointPortalRight[1]) * .5;
	outMidPoint[2] = (_edgeMidPointPortalLeft[2] + _edgeMidPointPortalRight[2]) * .5;
	return true;
};
var FindNodePathResultFlags;
(function(FindNodePathResultFlags) {
	FindNodePathResultFlags[FindNodePathResultFlags["NONE"] = 0] = "NONE";
	FindNodePathResultFlags[FindNodePathResultFlags["SUCCESS"] = 1] = "SUCCESS";
	FindNodePathResultFlags[FindNodePathResultFlags["COMPLETE_PATH"] = 2] = "COMPLETE_PATH";
	FindNodePathResultFlags[FindNodePathResultFlags["PARTIAL_PATH"] = 4] = "PARTIAL_PATH";
	FindNodePathResultFlags[FindNodePathResultFlags["INVALID_INPUT"] = 8] = "INVALID_INPUT";
})(FindNodePathResultFlags || (FindNodePathResultFlags = {}));
var HEURISTIC_SCALE = .999;
/**
* Find a path between two nodes.
*
* If the end node cannot be reached through the navigation graph,
* the last node in the path will be the nearest the end node.
*
* The start and end positions are used to calculate traversal costs.
* (The y-values impact the result.)
*
* @param startNodeRef The reference ID of the starting node.
* @param endNodeRef The reference ID of the ending node.
* @param startPosition The starting position in world space.
* @param endPosition The ending position in world space.
* @param filter The query filter.
* @param options Optional configuration for the pathfinding operation.
* @returns The result of the pathfinding operation.
*/
var findNodePath = (navMesh, startNodeRef, endNodeRef, startPosition, endPosition, filter, options) => {
	const raycastDistance = options?.raycastDistance ?? 0;
	const nodes = {};
	const openList = [];
	if (!isValidNodeRef(navMesh, startNodeRef) || !isValidNodeRef(navMesh, endNodeRef) || !finite(startPosition) || !finite(endPosition)) return {
		flags: FindNodePathResultFlags.NONE | FindNodePathResultFlags.INVALID_INPUT,
		success: false,
		path: [],
		nodes,
		openList
	};
	if (startNodeRef === endNodeRef) return {
		flags: FindNodePathResultFlags.SUCCESS | FindNodePathResultFlags.COMPLETE_PATH,
		success: true,
		path: [startNodeRef],
		nodes,
		openList
	};
	const getCost = filter.getCost;
	const startNode = {
		cost: 0,
		total: distance(startPosition, endPosition) * HEURISTIC_SCALE,
		parentNodeRef: null,
		parentState: null,
		nodeRef: startNodeRef,
		state: 0,
		flags: 1,
		position: [
			startPosition[0],
			startPosition[1],
			startPosition[2]
		]
	};
	addSearchNode(nodes, startNode);
	pushNodeToQueue(openList, startNode);
	let lastBestNode = startNode;
	let lastBestNodeCost = startNode.total;
	while (openList.length > 0) {
		const bestSearchNode = popNodeFromQueue(openList);
		bestSearchNode.flags &= -2;
		bestSearchNode.flags |= 2;
		const bestNodeRef = bestSearchNode.nodeRef;
		const bestNodeIsPoly = getNodeRefType(bestNodeRef) === NodeType.POLY;
		if (bestNodeRef === endNodeRef) {
			lastBestNode = bestSearchNode;
			break;
		}
		const bestNode = getNodeByRef(navMesh, bestNodeRef);
		const parentNodeRef = bestSearchNode.parentNodeRef ?? void 0;
		for (const linkIndex of bestNode.links) {
			const link = navMesh.links[linkIndex];
			const neighbourNodeRef = link.toNodeRef;
			if (neighbourNodeRef === parentNodeRef) continue;
			if (filter.passFilter(neighbourNodeRef, navMesh) === false) continue;
			let state = 0;
			if (link.side !== 255) state = link.side >> 1;
			let neighbourSearchNode = getSearchNode(nodes, neighbourNodeRef, state);
			if (!neighbourSearchNode) {
				neighbourSearchNode = {
					cost: 0,
					total: 0,
					parentNodeRef: null,
					parentState: null,
					nodeRef: neighbourNodeRef,
					state,
					flags: 0,
					position: [
						0,
						0,
						0
					]
				};
				addSearchNode(nodes, neighbourSearchNode);
				getEdgeMidPoint(navMesh, bestNodeRef, neighbourNodeRef, neighbourSearchNode.position);
			}
			let cost = 0;
			let heuristic = 0;
			let foundShortcut = false;
			if (raycastDistance > 0 && bestNodeIsPoly && parentNodeRef !== void 0 && getNodeRefType(parentNodeRef) === NodeType.POLY && bestSearchNode.parentState !== null) {
				const grandparentNode = getSearchNode(nodes, parentNodeRef, bestSearchNode.parentState);
				if (grandparentNode) {
					if (distance(grandparentNode.position, neighbourSearchNode.position) < raycastDistance) {
						const rayResult = raycastWithCosts(navMesh, grandparentNode.nodeRef, grandparentNode.position, neighbourSearchNode.position, filter, grandparentNode.parentNodeRef ?? 0);
						if (rayResult.t >= 1) {
							foundShortcut = true;
							cost = grandparentNode.cost + rayResult.pathCost;
						}
					}
				}
			}
			if (!foundShortcut) {
				const curCost = getCost(bestSearchNode.position, neighbourSearchNode.position, navMesh, parentNodeRef, bestNodeRef, neighbourNodeRef);
				cost = bestSearchNode.cost + curCost;
			}
			if (neighbourNodeRef === endNodeRef) {
				const endCost = getCost(neighbourSearchNode.position, endPosition, navMesh, bestNodeRef, neighbourNodeRef, void 0);
				cost = cost + endCost;
				heuristic = 0;
			} else heuristic = distance(neighbourSearchNode.position, endPosition) * HEURISTIC_SCALE;
			const total = cost + heuristic;
			if (neighbourSearchNode.flags & 1 && total >= neighbourSearchNode.total) continue;
			if (neighbourSearchNode.flags & 2 && total >= neighbourSearchNode.total) continue;
			if (foundShortcut) {
				neighbourSearchNode.parentNodeRef = bestSearchNode.parentNodeRef;
				neighbourSearchNode.parentState = bestSearchNode.parentState;
			} else {
				neighbourSearchNode.parentNodeRef = bestSearchNode.nodeRef;
				neighbourSearchNode.parentState = bestSearchNode.state;
			}
			neighbourSearchNode.nodeRef = neighbourNodeRef;
			neighbourSearchNode.flags = neighbourSearchNode.flags & -3;
			neighbourSearchNode.cost = cost;
			neighbourSearchNode.total = total;
			if (neighbourSearchNode.flags & 1) reindexNodeInQueue(openList, neighbourSearchNode);
			else {
				neighbourSearchNode.flags |= 1;
				pushNodeToQueue(openList, neighbourSearchNode);
			}
			if (heuristic < lastBestNodeCost) {
				lastBestNode = neighbourSearchNode;
				lastBestNodeCost = heuristic;
			}
		}
	}
	const path = [];
	let currentNode = lastBestNode;
	while (currentNode) {
		path.push(currentNode.nodeRef);
		if (currentNode.parentNodeRef !== null && currentNode.parentState !== null) currentNode = getSearchNode(nodes, currentNode.parentNodeRef, currentNode.parentState) ?? null;
		else currentNode = null;
	}
	path.reverse();
	if (lastBestNode.nodeRef !== endNodeRef) return {
		flags: FindNodePathResultFlags.PARTIAL_PATH,
		success: true,
		path,
		nodes,
		openList
	};
	return {
		flags: FindNodePathResultFlags.SUCCESS | FindNodePathResultFlags.COMPLETE_PATH,
		success: true,
		path,
		nodes,
		openList
	};
};
var SlicedFindNodePathStatusFlags;
(function(SlicedFindNodePathStatusFlags) {
	SlicedFindNodePathStatusFlags[SlicedFindNodePathStatusFlags["NOT_INITIALIZED"] = 0] = "NOT_INITIALIZED";
	SlicedFindNodePathStatusFlags[SlicedFindNodePathStatusFlags["IN_PROGRESS"] = 1] = "IN_PROGRESS";
	SlicedFindNodePathStatusFlags[SlicedFindNodePathStatusFlags["SUCCESS"] = 2] = "SUCCESS";
	SlicedFindNodePathStatusFlags[SlicedFindNodePathStatusFlags["PARTIAL_RESULT"] = 4] = "PARTIAL_RESULT";
	SlicedFindNodePathStatusFlags[SlicedFindNodePathStatusFlags["FAILURE"] = 8] = "FAILURE";
	SlicedFindNodePathStatusFlags[SlicedFindNodePathStatusFlags["INVALID_PARAM"] = 16] = "INVALID_PARAM";
})(SlicedFindNodePathStatusFlags || (SlicedFindNodePathStatusFlags = {}));
var SlicedFindNodePathInitFlags;
(function(SlicedFindNodePathInitFlags) {
	/** Enable any-angle pathfinding with raycast optimization */
	SlicedFindNodePathInitFlags[SlicedFindNodePathInitFlags["ANY_ANGLE"] = 1] = "ANY_ANGLE";
})(SlicedFindNodePathInitFlags || (SlicedFindNodePathInitFlags = {}));
var _moveAlongSurface_vertices = [];
var _moveAlongSurface_polyHeightResult = createGetPolyHeightResult();
var _moveAlongSurface_wallEdgeVj = create$3();
var _moveAlongSurface_wallEdgeVi = create$3();
var _moveAlongSurface_linkVj = create$3();
var _moveAlongSurface_linkVi = create$3();
var _moveAlongSurface_distancePtSegSqr2dResult = createDistancePtSegSqr2dResult();
/**
* Moves from start position towards end position along the navigation mesh surface.
*
* This method is optimized for small delta movement and a small number of
* polygons. If used for too great a distance, the result set will form an
* incomplete path.
*
* The resultPosition will equal the endPosition if the end is reached.
* Otherwise the closest reachable position will be returned.
*
* The resulting position is projected onto the surface of the navigation mesh with @see getPolyHeight.
*
* @param navMesh The navigation mesh
* @param startNodeRef The reference ID of the starting polygon
* @param startPosition The starting position [(x, y, z)]
* @param endPosition The ending position [(x, y, z)]
* @param filter The query filter.
* @returns Result containing status, final position, and visited polygons
*/
var moveAlongSurface = (navMesh, startNodeRef, startPosition, endPosition, filter) => {
	const result = {
		success: false,
		position: clone$1(startPosition),
		nodeRef: startNodeRef,
		visited: []
	};
	if (!isValidNodeRef(navMesh, startNodeRef) || !finite(startPosition) || !finite(endPosition)) return result;
	result.success = true;
	const nodes = {};
	const startNode = {
		cost: 0,
		total: 0,
		parentNodeRef: null,
		parentState: null,
		nodeRef: startNodeRef,
		state: 0,
		flags: 2,
		position: [
			startPosition[0],
			startPosition[1],
			startPosition[2]
		]
	};
	addSearchNode(nodes, startNode);
	const bestPos = clone$1(startPosition);
	let bestDist = Infinity;
	let bestNode = startNode;
	const searchPos = create$3();
	lerp(searchPos, startPosition, endPosition, .5);
	const searchRadSqr = (distance(startPosition, endPosition) / 2 + .001) ** 2;
	const queue = [startNode];
	while (queue.length > 0) {
		const curNode = queue.shift();
		const curRef = curNode.nodeRef;
		const tileAndPoly = getTileAndPolyByRef(curRef, navMesh);
		if (!tileAndPoly.success) continue;
		const { tile, poly } = tileAndPoly;
		const nv = poly.vertices.length;
		const vertices = _moveAlongSurface_vertices;
		for (let i = 0; i < nv; ++i) {
			const start = poly.vertices[i] * 3;
			vertices[i * 3] = tile.vertices[start];
			vertices[i * 3 + 1] = tile.vertices[start + 1];
			vertices[i * 3 + 2] = tile.vertices[start + 2];
		}
		if (pointInPoly(endPosition, vertices, nv)) {
			bestNode = curNode;
			copy(bestPos, endPosition);
			break;
		}
		for (let i = 0, j = nv - 1; i < nv; j = i++) {
			const neis = [];
			const node = getNodeByRef(navMesh, curRef);
			for (const linkIndex of node.links) {
				const link = navMesh.links[linkIndex];
				if (!link) continue;
				const neighbourRef = link.toNodeRef;
				if (link.edge === j) {
					if (!filter.passFilter(neighbourRef, navMesh)) continue;
					neis.push(neighbourRef);
				}
			}
			if (neis.length === 0) {
				const vj = fromBuffer(_moveAlongSurface_wallEdgeVj, vertices, j * 3);
				const vi = fromBuffer(_moveAlongSurface_wallEdgeVi, vertices, i * 3);
				const { distSqr, t: tSeg } = distancePtSegSqr2d(_moveAlongSurface_distancePtSegSqr2dResult, endPosition, vj, vi);
				if (distSqr < bestDist) {
					lerp(bestPos, vj, vi, tSeg);
					bestDist = distSqr;
					bestNode = curNode;
				}
			} else for (const neighbourRef of neis) {
				let neighbourNode = getSearchNode(nodes, neighbourRef, 0);
				if (!neighbourNode) {
					neighbourNode = {
						cost: 0,
						total: 0,
						parentNodeRef: null,
						parentState: null,
						nodeRef: neighbourRef,
						state: 0,
						flags: 0,
						position: [
							endPosition[0],
							endPosition[1],
							endPosition[2]
						]
					};
					addSearchNode(nodes, neighbourNode);
				}
				if (neighbourNode.flags & 2) continue;
				if (distancePtSegSqr2d(_moveAlongSurface_distancePtSegSqr2dResult, searchPos, fromBuffer(_moveAlongSurface_linkVj, vertices, j * 3), fromBuffer(_moveAlongSurface_linkVi, vertices, i * 3)).distSqr > searchRadSqr) continue;
				neighbourNode.parentNodeRef = curNode.nodeRef;
				neighbourNode.parentState = curNode.state;
				neighbourNode.flags |= 2;
				queue.push(neighbourNode);
			}
		}
	}
	if (bestNode) {
		let currentNode = bestNode;
		while (currentNode) {
			result.visited.push(currentNode.nodeRef);
			if (currentNode.parentNodeRef !== null) currentNode = getSearchNode(nodes, currentNode.parentNodeRef, 0) ?? null;
			else currentNode = null;
		}
		result.visited.reverse();
		copy(result.position, bestPos);
		result.nodeRef = bestNode.nodeRef;
		const tileAndPoly = getTileAndPolyByRef(result.nodeRef, navMesh);
		if (tileAndPoly.success) {
			const polyHeightResult = getPolyHeight(_moveAlongSurface_polyHeightResult, tileAndPoly.tile, tileAndPoly.poly, tileAndPoly.polyIndex, result.position);
			if (polyHeightResult.success) result.position[1] = polyHeightResult.height;
		}
	}
	return result;
};
var _raycast_vertices = [];
var _raycast_dir = create$3();
var _raycast_curPos = create$3();
var _raycast_lastPos = create$3();
var _raycast_e1Vec = create$3();
var _raycast_e0Vec = create$3();
var _raycast_eDir = create$3();
var _raycast_diff = create$3();
var _raycast_hitNormal_va = create$3();
var _raycast_hitNormal_vb = create$3();
/**
* Internal base implementation of raycast that handles both cost calculation modes.
*
* Casts a 'walkability' ray along the surface of the navigation mesh from
* the start position toward the end position.
*
* This method is meant to be used for quick, short distance checks.
* The raycast ignores the y-value of the end position (2D check).
*
* @param navMesh The navigation mesh to use for the raycast.
* @param startNodeRef The NodeRef for the start polygon
* @param startPosition The starting position in world space.
* @param endPosition The ending position in world space.
* @param filter The query filter to apply.
* @param calculateCosts Whether to calculate and accumulate path costs across polygons.
* @param prevRef The reference to the polygon we came from (for accurate cost calculations).
*/
var raycastBase = (navMesh, startNodeRef, startPosition, endPosition, filter, calculateCosts, prevRef) => {
	const result = {
		t: 0,
		hitNormal: create$3(),
		hitEdgeIndex: -1,
		path: [],
		pathCost: 0
	};
	if (!isValidNodeRef(navMesh, startNodeRef) || !finite(startPosition) || !finite(endPosition) || !filter) return result;
	let curRef = startNodeRef;
	let prevRefTracking = prevRef;
	const intersectSegmentPoly2DResult = createIntersectSegmentPoly2DResult();
	if (calculateCosts) {
		sub(_raycast_dir, endPosition, startPosition);
		copy(_raycast_curPos, startPosition);
	}
	while (curRef !== -1) {
		const tileAndPolyResult = getTileAndPolyByRef(curRef, navMesh);
		if (!tileAndPolyResult.success) break;
		const { tile, poly } = tileAndPolyResult;
		const nv = poly.vertices.length;
		const vertices = _raycast_vertices;
		for (let i = 0; i < nv; i++) {
			const start = poly.vertices[i] * 3;
			vertices[i * 3] = tile.vertices[start];
			vertices[i * 3 + 1] = tile.vertices[start + 1];
			vertices[i * 3 + 2] = tile.vertices[start + 2];
		}
		intersectSegmentPoly2D(intersectSegmentPoly2DResult, startPosition, endPosition, nv, vertices);
		if (!intersectSegmentPoly2DResult.intersects) return result;
		result.hitEdgeIndex = intersectSegmentPoly2DResult.segMax;
		if (intersectSegmentPoly2DResult.tmax > result.t) result.t = intersectSegmentPoly2DResult.tmax;
		result.path.push(curRef);
		if (intersectSegmentPoly2DResult.segMax === -1) {
			result.t = Number.MAX_VALUE;
			if (calculateCosts) result.pathCost += filter.getCost(_raycast_curPos, endPosition, navMesh, prevRefTracking, curRef, void 0);
			return result;
		}
		let nextRef;
		const curNode = getNodeByRef(navMesh, curRef);
		for (const linkIndex of curNode.links) {
			const link = navMesh.links[linkIndex];
			if (link.edge !== intersectSegmentPoly2DResult.segMax) continue;
			if (getNodeRefType(link.toNodeRef) === NodeType.OFFMESH) continue;
			if (!getTileAndPolyByRef(link.toNodeRef, navMesh).success) continue;
			if (!filter.passFilter(link.toNodeRef, navMesh)) continue;
			if (link.side === 255) {
				nextRef = link.toNodeRef;
				break;
			}
			if (link.bmin === 0 && link.bmax === 255) {
				nextRef = link.toNodeRef;
				break;
			}
			const v0 = poly.vertices[link.edge];
			const v1 = poly.vertices[(link.edge + 1) % poly.vertices.length];
			const left = [
				tile.vertices[v0 * 3],
				tile.vertices[v0 * 3 + 1],
				tile.vertices[v0 * 3 + 2]
			];
			const right = [
				tile.vertices[v1 * 3],
				tile.vertices[v1 * 3 + 1],
				tile.vertices[v1 * 3 + 2]
			];
			if (link.side === 0 || link.side === 4) {
				const s = 1 / 255;
				let lmin = left[2] + (right[2] - left[2]) * (link.bmin * s);
				let lmax = left[2] + (right[2] - left[2]) * (link.bmax * s);
				if (lmin > lmax) [lmin, lmax] = [lmax, lmin];
				const z = startPosition[2] + (endPosition[2] - startPosition[2]) * intersectSegmentPoly2DResult.tmax;
				if (z >= lmin && z <= lmax) {
					nextRef = link.toNodeRef;
					break;
				}
			} else if (link.side === 2 || link.side === 6) {
				const s = 1 / 255;
				let lmin = left[0] + (right[0] - left[0]) * (link.bmin * s);
				let lmax = left[0] + (right[0] - left[0]) * (link.bmax * s);
				if (lmin > lmax) [lmin, lmax] = [lmax, lmin];
				const x = startPosition[0] + (endPosition[0] - startPosition[0]) * intersectSegmentPoly2DResult.tmax;
				if (x >= lmin && x <= lmax) {
					nextRef = link.toNodeRef;
					break;
				}
			}
		}
		if (nextRef === void 0) {
			if (intersectSegmentPoly2DResult.segMax >= 0) {
				const a = intersectSegmentPoly2DResult.segMax;
				const b = intersectSegmentPoly2DResult.segMax + 1 < poly.vertices.length ? intersectSegmentPoly2DResult.segMax + 1 : 0;
				fromBuffer(_raycast_hitNormal_va, vertices, a * 3);
				fromBuffer(_raycast_hitNormal_vb, vertices, b * 3);
				const dx = _raycast_hitNormal_vb[0] - _raycast_hitNormal_va[0];
				const dz = _raycast_hitNormal_vb[2] - _raycast_hitNormal_va[2];
				result.hitNormal[0] = dz;
				result.hitNormal[1] = 0;
				result.hitNormal[2] = -dx;
				normalize(result.hitNormal, result.hitNormal);
			}
			if (calculateCosts) {
				copy(_raycast_lastPos, _raycast_curPos);
				scaleAndAdd(_raycast_curPos, startPosition, _raycast_dir, result.t);
				result.pathCost += filter.getCost(_raycast_lastPos, _raycast_curPos, navMesh, prevRefTracking, curRef, void 0);
			}
			return result;
		}
		if (calculateCosts) {
			copy(_raycast_lastPos, _raycast_curPos);
			scaleAndAdd(_raycast_curPos, startPosition, _raycast_dir, result.t);
			const e0 = poly.vertices[intersectSegmentPoly2DResult.segMax];
			const e1Offset = poly.vertices[(intersectSegmentPoly2DResult.segMax + 1) % poly.vertices.length] * 3;
			const e0Offset = e0 * 3;
			fromBuffer(_raycast_e1Vec, tile.vertices, e1Offset);
			fromBuffer(_raycast_e0Vec, tile.vertices, e0Offset);
			sub(_raycast_eDir, _raycast_e1Vec, _raycast_e0Vec);
			sub(_raycast_diff, _raycast_curPos, _raycast_e0Vec);
			const s = _raycast_eDir[0] * _raycast_eDir[0] > _raycast_eDir[2] * _raycast_eDir[2] ? _raycast_diff[0] / _raycast_eDir[0] : _raycast_diff[2] / _raycast_eDir[2];
			_raycast_curPos[1] = _raycast_e0Vec[1] + _raycast_eDir[1] * s;
			result.pathCost += filter.getCost(_raycast_lastPos, _raycast_curPos, navMesh, prevRefTracking, curRef, nextRef);
		}
		prevRefTracking = curRef;
		curRef = nextRef;
	}
	return result;
};
/**
* Casts a 'walkability' ray along the surface of the navigation mesh from
* the start position toward the end position.
*
* This method is meant to be used for quick, short distance checks.
* The raycast ignores the y-value of the end position (2D check).
*
* @param navMesh The navigation mesh to use for the raycast.
* @param startNodeRef The NodeRef for the start polygon
* @param startPosition The starting position in world space.
* @param endPosition The ending position in world space.
* @param filter The query filter to apply.
* @returns The raycast result with hit information and visited polygons (without cost calculation).
*/
var raycast = (navMesh, startNodeRef, startPosition, endPosition, filter) => {
	return raycastBase(navMesh, startNodeRef, startPosition, endPosition, filter, false, 0);
};
/**
* Casts a 'walkability' ray along the surface of the navigation mesh from
* the start position toward the end position, calculating accumulated path costs.
*
* This method is meant to be used for quick, short distance checks.
* The raycast ignores the y-value of the end position (2D check).
*
* @param navMesh The navigation mesh to use for the raycast.
* @param startNodeRef The NodeRef for the start polygon
* @param startPosition The starting position in world space.
* @param endPosition The ending position in world space.
* @param filter The query filter to apply.
* @param prevRef The reference to the polygon we came from (for accurate cost calculations).
* @returns The raycast result with hit information, visited polygons, and accumulated path costs.
*/
var raycastWithCosts = (navMesh, startNodeRef, startPosition, endPosition, filter, prevRef) => {
	return raycastBase(navMesh, startNodeRef, startPosition, endPosition, filter, true, prevRef);
};
var FindStraightPathOptions;
(function(FindStraightPathOptions) {
	FindStraightPathOptions[FindStraightPathOptions["ALL_CROSSINGS"] = 1] = "ALL_CROSSINGS";
	FindStraightPathOptions[FindStraightPathOptions["AREA_CROSSINGS"] = 2] = "AREA_CROSSINGS";
})(FindStraightPathOptions || (FindStraightPathOptions = {}));
var StraightPathPointFlags;
(function(StraightPathPointFlags) {
	StraightPathPointFlags[StraightPathPointFlags["START"] = 0] = "START";
	StraightPathPointFlags[StraightPathPointFlags["END"] = 1] = "END";
	StraightPathPointFlags[StraightPathPointFlags["OFFMESH"] = 2] = "OFFMESH";
})(StraightPathPointFlags || (StraightPathPointFlags = {}));
var FindStraightPathResultFlags;
(function(FindStraightPathResultFlags) {
	FindStraightPathResultFlags[FindStraightPathResultFlags["NONE"] = 0] = "NONE";
	FindStraightPathResultFlags[FindStraightPathResultFlags["SUCCESS"] = 1] = "SUCCESS";
	FindStraightPathResultFlags[FindStraightPathResultFlags["PARTIAL_PATH"] = 4] = "PARTIAL_PATH";
	FindStraightPathResultFlags[FindStraightPathResultFlags["MAX_POINTS_REACHED"] = 8] = "MAX_POINTS_REACHED";
	FindStraightPathResultFlags[FindStraightPathResultFlags["INVALID_INPUT"] = 16] = "INVALID_INPUT";
})(FindStraightPathResultFlags || (FindStraightPathResultFlags = {}));
var AppendVertexStatus;
(function(AppendVertexStatus) {
	AppendVertexStatus[AppendVertexStatus["SUCCESS"] = 1] = "SUCCESS";
	AppendVertexStatus[AppendVertexStatus["MAX_POINTS_REACHED"] = 2] = "MAX_POINTS_REACHED";
	AppendVertexStatus[AppendVertexStatus["IN_PROGRESS"] = 4] = "IN_PROGRESS";
})(AppendVertexStatus || (AppendVertexStatus = {}));
var appendVertex = (position, nodeRef, flags, outPoints, nodeType, maxPoints = null) => {
	if (outPoints.length > 0 && equals(outPoints[outPoints.length - 1].position, position)) {
		if (outPoints[outPoints.length - 1].type === NodeType.POLY && nodeType === NodeType.POLY) {
			outPoints[outPoints.length - 1].nodeRef = nodeRef;
			outPoints[outPoints.length - 1].type = nodeType;
			return AppendVertexStatus.IN_PROGRESS;
		}
	}
	outPoints.push({
		position: [
			position[0],
			position[1],
			position[2]
		],
		type: nodeType,
		nodeRef,
		flags
	});
	if (maxPoints !== null && outPoints.length >= maxPoints) return AppendVertexStatus.SUCCESS | AppendVertexStatus.MAX_POINTS_REACHED;
	if (flags & StraightPathPointFlags.END) return AppendVertexStatus.SUCCESS;
	return AppendVertexStatus.IN_PROGRESS;
};
var _intersectSegSeg2DResult = createIntersectSegSeg2DResult();
var _appendPortalsPoint = create$3();
var _appendPortalsLeft = create$3();
var _appendPortalsRight = create$3();
var appendPortals = (navMesh, startIdx, endIdx, endPosition, path, outPoints, options, maxPoints = null) => {
	const left = _appendPortalsLeft;
	const right = _appendPortalsRight;
	const startPos = outPoints[outPoints.length - 1].position;
	for (let i = startIdx; i < endIdx; i++) {
		const from = path[i];
		const to = path[i + 1];
		if (options & FindStraightPathOptions.AREA_CROSSINGS) {
			const a = getNodeByRef(navMesh, from);
			const b = getNodeByRef(navMesh, to);
			if (a.area === b.area) continue;
		}
		if (!getPortalPoints(navMesh, from, to, left, right)) break;
		const intersectResult = intersectSegSeg2D(_intersectSegSeg2DResult, startPos, endPosition, left, right);
		if (!intersectResult.hit) continue;
		const stat = appendVertex(lerp(_appendPortalsPoint, left, right, intersectResult.t), to, 0, outPoints, getNodeRefType(to), maxPoints);
		if (stat !== AppendVertexStatus.IN_PROGRESS) return stat;
	}
	return AppendVertexStatus.IN_PROGRESS;
};
var _findStraightPathPortalApex = create$3();
var _findStraightPathPortalLeft = create$3();
var _findStraightPathPortalRight = create$3();
var _findStraightPathLeftPortalPoint = create$3();
var _findStraightPathRightPortalPoint = create$3();
var _findStraightPath_distancePtSegSqr2dResult = createDistancePtSegSqr2dResult();
var makeFindStraightPathResult = (flags, path) => ({
	flags,
	success: (flags & FindStraightPathResultFlags.SUCCESS) !== 0,
	path
});
/**
* This method peforms what is often called 'string pulling'.
*
* The start position is clamped to the first polygon node in the path, and the
* end position is clamped to the last. So the start and end positions should
* normally be within or very near the first and last polygons respectively.
*
* @param navMesh The navigation mesh to use for the search.
* @param start The start position in world space.
* @param end The end position in world space.
* @param pathNodeRefs The list of polygon node references that form the path, generally obtained from `findNodePath`
* @param maxPoints The maximum number of points to return in the straight path. If null, no limit is applied.
* @param straightPathOptions @see FindStraightPathOptions
* @returns The straight path
*/
var findStraightPath = (navMesh, start, end, pathNodeRefs, maxPoints = null, straightPathOptions = 0) => {
	const path = [];
	if (!finite(start) || !finite(end) || pathNodeRefs.length === 0) return makeFindStraightPathResult(FindStraightPathResultFlags.NONE | FindStraightPathResultFlags.INVALID_INPUT, path);
	const closestStartPos = create$3();
	if (!getClosestPointOnPolyBoundary(closestStartPos, navMesh, pathNodeRefs[0], start)) return makeFindStraightPathResult(FindStraightPathResultFlags.NONE | FindStraightPathResultFlags.INVALID_INPUT, path);
	const closestEndPos = create$3();
	if (!getClosestPointOnPolyBoundary(closestEndPos, navMesh, pathNodeRefs[pathNodeRefs.length - 1], end)) return makeFindStraightPathResult(FindStraightPathResultFlags.NONE | FindStraightPathResultFlags.INVALID_INPUT, path);
	const startAppendStatus = appendVertex(closestStartPos, pathNodeRefs[0], StraightPathPointFlags.START, path, getNodeRefType(pathNodeRefs[0]), maxPoints);
	if (startAppendStatus !== AppendVertexStatus.IN_PROGRESS) {
		const maxPointsReached = (startAppendStatus & AppendVertexStatus.MAX_POINTS_REACHED) !== 0;
		let flags = FindStraightPathResultFlags.SUCCESS | FindStraightPathResultFlags.PARTIAL_PATH;
		if (maxPointsReached) flags |= FindStraightPathResultFlags.MAX_POINTS_REACHED;
		return makeFindStraightPathResult(flags, path);
	}
	const portalApex = _findStraightPathPortalApex;
	const portalLeft = _findStraightPathPortalLeft;
	const portalRight = _findStraightPathPortalRight;
	const left = _findStraightPathLeftPortalPoint;
	const right = _findStraightPathRightPortalPoint;
	const pathSize = pathNodeRefs.length;
	if (pathSize > 1) {
		copy(portalApex, closestStartPos);
		copy(portalLeft, portalApex);
		copy(portalRight, portalApex);
		let apexIndex = 0;
		let leftIndex = 0;
		let rightIndex = 0;
		let leftNodeRef = pathNodeRefs[0];
		let rightNodeRef = pathNodeRefs[0];
		let leftNodeType = NodeType.POLY;
		let rightNodeType = NodeType.POLY;
		for (let i = 0; i < pathSize; ++i) {
			let toType = NodeType.POLY;
			if (i + 1 < pathSize) {
				const toRef = pathNodeRefs[i + 1];
				toType = getNodeRefType(toRef);
				if (!getPortalPoints(navMesh, pathNodeRefs[i], toRef, left, right)) {
					const endClamp = create$3();
					if (!getClosestPointOnPolyBoundary(endClamp, navMesh, pathNodeRefs[i], end)) return makeFindStraightPathResult(FindStraightPathResultFlags.NONE | FindStraightPathResultFlags.INVALID_INPUT, path);
					if (straightPathOptions & (FindStraightPathOptions.AREA_CROSSINGS | FindStraightPathOptions.ALL_CROSSINGS)) appendPortals(navMesh, apexIndex, i, endClamp, pathNodeRefs, path, straightPathOptions, maxPoints);
					const nodeType = getNodeRefType(pathNodeRefs[i]);
					appendVertex(endClamp, pathNodeRefs[i], 0, path, nodeType, maxPoints);
					return makeFindStraightPathResult(FindStraightPathResultFlags.SUCCESS | FindStraightPathResultFlags.PARTIAL_PATH, path);
				}
				if (i === 0 && toType === NodeType.POLY) {
					if (distancePtSegSqr2d(_findStraightPath_distancePtSegSqr2dResult, portalApex, left, right).distSqr < 1e-6) continue;
				}
				if (toType === NodeType.OFFMESH) {
					const node = getNodeByRef(navMesh, toRef);
					const offMeshConnection = navMesh.offMeshConnections[node.offMeshConnectionId];
					const offMeshConnectionAttachment = navMesh.offMeshConnectionAttachments[node.offMeshConnectionId];
					const prevPolyRef = pathNodeRefs[i];
					const prevNode = getNodeByRef(navMesh, prevPolyRef);
					let linkEdge = 0;
					for (const linkIndex of prevNode.links) {
						const link = navMesh.links[linkIndex];
						if (link.toNodeRef === toRef) {
							linkEdge = link.edge;
							break;
						}
					}
					const enteringFromStart = linkEdge === 0;
					const offMeshStart = enteringFromStart ? offMeshConnection.start : offMeshConnection.end;
					const offMeshEnd = enteringFromStart ? offMeshConnection.end : offMeshConnection.start;
					const toPolyRef = enteringFromStart ? offMeshConnectionAttachment.endPolyNode : offMeshConnectionAttachment.startPolyNode;
					if (straightPathOptions & (FindStraightPathOptions.AREA_CROSSINGS | FindStraightPathOptions.ALL_CROSSINGS)) {
						const appendPortalsStatus = appendPortals(navMesh, apexIndex, i, offMeshStart, pathNodeRefs, path, straightPathOptions, maxPoints);
						if (appendPortalsStatus !== AppendVertexStatus.IN_PROGRESS) {
							const maxPointsReached = (appendPortalsStatus & AppendVertexStatus.MAX_POINTS_REACHED) !== 0;
							let flags = FindStraightPathResultFlags.SUCCESS | FindStraightPathResultFlags.PARTIAL_PATH;
							if (maxPointsReached) flags |= FindStraightPathResultFlags.MAX_POINTS_REACHED;
							return makeFindStraightPathResult(flags, path);
						}
					}
					const lastPointAdded = path[path.length - 1].position;
					if (!equals(lastPointAdded, portalRight) && !equals(lastPointAdded, portalLeft)) {
						const rightArea = triArea2D(lastPointAdded, portalRight, offMeshStart);
						const leftArea = triArea2D(lastPointAdded, portalLeft, offMeshStart);
						let appendStatus;
						if (rightArea <= 0 && leftArea < 0) appendStatus = appendVertex(portalLeft, leftNodeRef, 0, path, leftNodeRef !== null ? leftNodeType : NodeType.POLY, maxPoints);
						else if (leftArea >= 0 && rightArea > 0) appendStatus = appendVertex(portalRight, rightNodeRef, 0, path, rightNodeRef !== null ? rightNodeType : NodeType.POLY, maxPoints);
						if (appendStatus && appendStatus !== AppendVertexStatus.IN_PROGRESS) {
							const maxPointsReached = (appendStatus & AppendVertexStatus.MAX_POINTS_REACHED) !== 0;
							let resultFlags = FindStraightPathResultFlags.SUCCESS;
							if (maxPointsReached) resultFlags |= FindStraightPathResultFlags.MAX_POINTS_REACHED;
							return makeFindStraightPathResult(resultFlags, path);
						}
					}
					const appendStartStatus = appendVertex(offMeshStart, toRef, StraightPathPointFlags.OFFMESH, path, NodeType.OFFMESH, maxPoints);
					if (appendStartStatus !== AppendVertexStatus.IN_PROGRESS) {
						const maxPointsReached = (appendStartStatus & AppendVertexStatus.MAX_POINTS_REACHED) !== 0;
						let resultFlags = FindStraightPathResultFlags.SUCCESS;
						if (maxPointsReached) resultFlags |= FindStraightPathResultFlags.MAX_POINTS_REACHED;
						return makeFindStraightPathResult(resultFlags, path);
					}
					const appendEndStatus = appendVertex(offMeshEnd, toPolyRef, 0, path, NodeType.POLY, maxPoints);
					if (appendEndStatus !== AppendVertexStatus.IN_PROGRESS) {
						const maxPointsReached = (appendEndStatus & AppendVertexStatus.MAX_POINTS_REACHED) !== 0;
						let resultFlags = FindStraightPathResultFlags.SUCCESS;
						if (maxPointsReached) resultFlags |= FindStraightPathResultFlags.MAX_POINTS_REACHED;
						return makeFindStraightPathResult(resultFlags, path);
					}
					copy(portalApex, offMeshEnd);
					copy(portalLeft, offMeshEnd);
					copy(portalRight, offMeshEnd);
					apexIndex = i + 1;
					leftIndex = i + 1;
					rightIndex = i + 1;
					leftNodeRef = toPolyRef;
					rightNodeRef = toPolyRef;
					leftNodeType = NodeType.POLY;
					rightNodeType = NodeType.POLY;
					continue;
				}
			} else {
				copy(left, closestEndPos);
				copy(right, closestEndPos);
				toType = NodeType.POLY;
			}
			if (triArea2D(portalApex, portalRight, right) <= 0) {
				if (equals(portalApex, portalRight) || triArea2D(portalApex, portalLeft, right) > 0) {
					copy(portalRight, right);
					rightNodeRef = i + 1 < pathSize ? pathNodeRefs[i + 1] : null;
					rightNodeType = toType;
					rightIndex = i;
				} else {
					if (straightPathOptions & (FindStraightPathOptions.AREA_CROSSINGS | FindStraightPathOptions.ALL_CROSSINGS)) {
						const appendStatus = appendPortals(navMesh, apexIndex, leftIndex, portalLeft, pathNodeRefs, path, straightPathOptions, maxPoints);
						if (appendStatus !== AppendVertexStatus.IN_PROGRESS) {
							const maxPointsReached = (appendStatus & AppendVertexStatus.MAX_POINTS_REACHED) !== 0;
							let flags = FindStraightPathResultFlags.SUCCESS | FindStraightPathResultFlags.PARTIAL_PATH;
							if (maxPointsReached) flags |= FindStraightPathResultFlags.MAX_POINTS_REACHED;
							return makeFindStraightPathResult(flags, path);
						}
					}
					copy(portalApex, portalLeft);
					apexIndex = leftIndex;
					let pointFlags = 0;
					if (leftNodeRef === null) pointFlags = StraightPathPointFlags.END;
					const appendStatus = appendVertex(portalApex, leftNodeRef, pointFlags, path, leftNodeRef !== null ? leftNodeType : NodeType.POLY, maxPoints);
					if (appendStatus !== AppendVertexStatus.IN_PROGRESS) {
						const maxPointsReached = (appendStatus & AppendVertexStatus.MAX_POINTS_REACHED) !== 0;
						let resultFlags = FindStraightPathResultFlags.SUCCESS;
						if (maxPointsReached) resultFlags |= FindStraightPathResultFlags.MAX_POINTS_REACHED;
						return makeFindStraightPathResult(resultFlags, path);
					}
					copy(portalLeft, portalApex);
					copy(portalRight, portalApex);
					leftIndex = apexIndex;
					rightIndex = apexIndex;
					i = apexIndex;
					continue;
				}
			}
			if (triArea2D(portalApex, portalLeft, left) >= 0) {
				if (equals(portalApex, portalLeft) || triArea2D(portalApex, portalRight, left) < 0) {
					copy(portalLeft, left);
					leftNodeRef = i + 1 < pathSize ? pathNodeRefs[i + 1] : null;
					leftNodeType = toType;
					leftIndex = i;
				} else {
					if (straightPathOptions & (FindStraightPathOptions.AREA_CROSSINGS | FindStraightPathOptions.ALL_CROSSINGS)) {
						const appendStatus = appendPortals(navMesh, apexIndex, rightIndex, portalRight, pathNodeRefs, path, straightPathOptions, maxPoints);
						if (appendStatus !== AppendVertexStatus.IN_PROGRESS) {
							const maxPointsReached = (appendStatus & AppendVertexStatus.MAX_POINTS_REACHED) !== 0;
							let flags = FindStraightPathResultFlags.SUCCESS | FindStraightPathResultFlags.PARTIAL_PATH;
							if (maxPointsReached) flags |= FindStraightPathResultFlags.MAX_POINTS_REACHED;
							return makeFindStraightPathResult(flags, path);
						}
					}
					copy(portalApex, portalRight);
					apexIndex = rightIndex;
					let pointFlags = 0;
					if (rightNodeRef === null) pointFlags = StraightPathPointFlags.END;
					const appendStatus = appendVertex(portalApex, rightNodeRef, pointFlags, path, rightNodeRef !== null ? rightNodeType : NodeType.POLY, maxPoints);
					if (appendStatus !== AppendVertexStatus.IN_PROGRESS) {
						const maxPointsReached = (appendStatus & AppendVertexStatus.MAX_POINTS_REACHED) !== 0;
						let resultFlags = FindStraightPathResultFlags.SUCCESS;
						if (maxPointsReached) resultFlags |= FindStraightPathResultFlags.MAX_POINTS_REACHED;
						return makeFindStraightPathResult(resultFlags, path);
					}
					copy(portalLeft, portalApex);
					copy(portalRight, portalApex);
					leftIndex = apexIndex;
					rightIndex = apexIndex;
					i = apexIndex;
					continue;
				}
			}
		}
		if (straightPathOptions & (FindStraightPathOptions.AREA_CROSSINGS | FindStraightPathOptions.ALL_CROSSINGS)) {
			const appendStatus = appendPortals(navMesh, apexIndex, pathSize - 1, closestEndPos, pathNodeRefs, path, straightPathOptions, maxPoints);
			if (appendStatus !== AppendVertexStatus.IN_PROGRESS) {
				const maxPointsReached = (appendStatus & AppendVertexStatus.MAX_POINTS_REACHED) !== 0;
				let flags = FindStraightPathResultFlags.SUCCESS | FindStraightPathResultFlags.PARTIAL_PATH;
				if (maxPointsReached) flags |= FindStraightPathResultFlags.MAX_POINTS_REACHED;
				return makeFindStraightPathResult(flags, path);
			}
		}
	}
	const maxPointsReached = (appendVertex(closestEndPos, pathNodeRefs.length > 0 ? pathNodeRefs[pathNodeRefs.length - 1] : null, StraightPathPointFlags.END, path, NodeType.POLY, maxPoints) & AppendVertexStatus.MAX_POINTS_REACHED) !== 0;
	let resultFlags = FindStraightPathResultFlags.SUCCESS;
	if (maxPointsReached) resultFlags |= FindStraightPathResultFlags.MAX_POINTS_REACHED;
	return makeFindStraightPathResult(resultFlags, path);
};
var FindPathResultFlags;
(function(FindPathResultFlags) {
	FindPathResultFlags[FindPathResultFlags["NONE"] = 0] = "NONE";
	FindPathResultFlags[FindPathResultFlags["SUCCESS"] = 1] = "SUCCESS";
	FindPathResultFlags[FindPathResultFlags["COMPLETE_PATH"] = 2] = "COMPLETE_PATH";
	FindPathResultFlags[FindPathResultFlags["PARTIAL_PATH"] = 4] = "PARTIAL_PATH";
	FindPathResultFlags[FindPathResultFlags["MAX_POINTS_REACHED"] = 8] = "MAX_POINTS_REACHED";
	FindPathResultFlags[FindPathResultFlags["INVALID_INPUT"] = 16] = "INVALID_INPUT";
	FindPathResultFlags[FindPathResultFlags["FIND_NODE_PATH_FAILED"] = 32] = "FIND_NODE_PATH_FAILED";
	FindPathResultFlags[FindPathResultFlags["FIND_STRAIGHT_PATH_FAILED"] = 64] = "FIND_STRAIGHT_PATH_FAILED";
})(FindPathResultFlags || (FindPathResultFlags = {}));
var _findPathStartNearestPolyResult = createFindNearestPolyResult();
var _findPathEndNearestPolyResult = createFindNearestPolyResult();
/**
* Find a path between two positions on a NavMesh.
*
* If the end node cannot be reached through the navigation graph,
* the last node in the path will be the nearest the end node.
*
* Internally:
* - finds the closest poly for the start and end positions with @see findNearestPoly
* - finds a nav mesh node path with @see findNodePath
* - finds a straight path with @see findStraightPath
*
* If you want more fine tuned behaviour you can call these methods directly.
* For example, for agent movement you might want to find a node path once but regularly re-call @see findStraightPath
*
* @param navMesh The navigation mesh.
* @param start The starting position in world space.
* @param end The ending position in world space.
* @param queryFilter The query filter.
* @param options Optional configuration for the pathfinding operation.
* @returns The result of the pathfinding operation.
*/
var findPath = (navMesh, start, end, halfExtents, queryFilter, options) => {
	const result = {
		success: false,
		flags: FindPathResultFlags.NONE | FindPathResultFlags.INVALID_INPUT,
		nodePathFlags: FindNodePathResultFlags.NONE,
		straightPathFlags: FindStraightPathResultFlags.NONE,
		path: [],
		startNodeRef: null,
		startPosition: [
			0,
			0,
			0
		],
		endNodeRef: null,
		endPosition: [
			0,
			0,
			0
		],
		nodePath: null
	};
	const startNearestPolyResult = findNearestPoly(_findPathStartNearestPolyResult, navMesh, start, halfExtents, queryFilter);
	if (!startNearestPolyResult.success) return result;
	copy(result.startPosition, startNearestPolyResult.position);
	result.startNodeRef = startNearestPolyResult.nodeRef;
	const endNearestPolyResult = findNearestPoly(_findPathEndNearestPolyResult, navMesh, end, halfExtents, queryFilter);
	if (!endNearestPolyResult.success) return result;
	copy(result.endPosition, endNearestPolyResult.position);
	result.endNodeRef = endNearestPolyResult.nodeRef;
	const nodePath = findNodePath(navMesh, result.startNodeRef, result.endNodeRef, result.startPosition, result.endPosition, queryFilter, options?.raycastDistance ? { raycastDistance: options.raycastDistance } : void 0);
	result.nodePath = nodePath;
	result.nodePathFlags = nodePath.flags;
	if (!nodePath.success) {
		result.flags = FindPathResultFlags.FIND_NODE_PATH_FAILED;
		return result;
	}
	const straightPath = findStraightPath(navMesh, result.startPosition, result.endPosition, nodePath.path);
	if (!straightPath.success) {
		result.flags = FindPathResultFlags.FIND_STRAIGHT_PATH_FAILED;
		return result;
	}
	result.success = true;
	result.path = straightPath.path;
	result.straightPathFlags = straightPath.flags;
	let flags = FindPathResultFlags.SUCCESS;
	if (nodePath.flags & FindNodePathResultFlags.COMPLETE_PATH && (straightPath.flags & FindStraightPathResultFlags.PARTIAL_PATH) === 0) flags |= FindPathResultFlags.COMPLETE_PATH;
	else flags |= FindPathResultFlags.PARTIAL_PATH;
	if (straightPath.flags & FindStraightPathResultFlags.MAX_POINTS_REACHED) flags |= FindPathResultFlags.MAX_POINTS_REACHED;
	result.flags = flags;
	return result;
};
var FindSmoothPathResultFlags;
(function(FindSmoothPathResultFlags) {
	FindSmoothPathResultFlags[FindSmoothPathResultFlags["NONE"] = 0] = "NONE";
	FindSmoothPathResultFlags[FindSmoothPathResultFlags["SUCCESS"] = 1] = "SUCCESS";
	FindSmoothPathResultFlags[FindSmoothPathResultFlags["COMPLETE_PATH"] = 2] = "COMPLETE_PATH";
	FindSmoothPathResultFlags[FindSmoothPathResultFlags["PARTIAL_PATH"] = 4] = "PARTIAL_PATH";
	FindSmoothPathResultFlags[FindSmoothPathResultFlags["INVALID_INPUT"] = 8] = "INVALID_INPUT";
	FindSmoothPathResultFlags[FindSmoothPathResultFlags["FIND_NODE_PATH_FAILED"] = 16] = "FIND_NODE_PATH_FAILED";
	FindSmoothPathResultFlags[FindSmoothPathResultFlags["FIND_STRAIGHT_PATH_FAILED"] = 32] = "FIND_STRAIGHT_PATH_FAILED";
})(FindSmoothPathResultFlags || (FindSmoothPathResultFlags = {}));
var SmoothPathPointFlags;
(function(SmoothPathPointFlags) {
	SmoothPathPointFlags[SmoothPathPointFlags["START"] = 0] = "START";
	SmoothPathPointFlags[SmoothPathPointFlags["END"] = 1] = "END";
	SmoothPathPointFlags[SmoothPathPointFlags["OFFMESH"] = 2] = "OFFMESH";
})(SmoothPathPointFlags || (SmoothPathPointFlags = {}));
var DebugPrimitiveType;
(function(DebugPrimitiveType) {
	DebugPrimitiveType[DebugPrimitiveType["Triangles"] = 0] = "Triangles";
	DebugPrimitiveType[DebugPrimitiveType["Lines"] = 1] = "Lines";
	DebugPrimitiveType[DebugPrimitiveType["Points"] = 2] = "Points";
	DebugPrimitiveType[DebugPrimitiveType["Boxes"] = 3] = "Boxes";
})(DebugPrimitiveType || (DebugPrimitiveType = {}));
var hslToRgb = (out, h, s, l) => {
	h /= 360;
	const a = s * Math.min(l, 1 - l);
	const f = (n) => {
		const k = (n + h * 12) % 12;
		return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
	};
	out[0] = f(0);
	out[1] = f(8);
	out[2] = f(4);
	return out;
};
var areaToColor = (out, area, alpha = 1) => {
	if (area === 1) {
		out[0] = 0;
		out[1] = 192 / 255;
		out[2] = 1;
		return out;
	}
	if (area === 0) {
		out[0] = 0;
		out[1] = 0;
		out[2] = 0;
		return out;
	}
	hslToRgb(out, area * 137.5 % 360, .7, .6);
	out[0] *= alpha;
	out[1] *= alpha;
	out[2] *= alpha;
	return out;
};
var _color = create$3();
var createNavMeshHelper = (navMesh) => {
	const primitives = [];
	const triPositions = [];
	const triColors = [];
	const triIndices = [];
	let triVertexIndex = 0;
	const interPolyLinePositions = [];
	const interPolyLineColors = [];
	const outerPolyLinePositions = [];
	const outerPolyLineColors = [];
	const vertexPositions = [];
	const vertexColors = [];
	for (const tileId in navMesh.tiles) {
		const tile = navMesh.tiles[tileId];
		if (!tile) continue;
		for (let polyId = 0; polyId < tile.polys.length; polyId++) {
			const poly = tile.polys[polyId];
			const polyDetail = tile.detailMeshes[polyId];
			if (!polyDetail) continue;
			areaToColor(_color, poly.area, .4);
			const col = [
				_color[0],
				_color[1],
				_color[2]
			];
			for (let j = 0; j < polyDetail.trianglesCount; j++) {
				const triBase = (polyDetail.trianglesBase + j) * 4;
				const t0 = tile.detailTriangles[triBase];
				const t1 = tile.detailTriangles[triBase + 1];
				const t2 = tile.detailTriangles[triBase + 2];
				for (let k = 0; k < 3; k++) {
					const vertIndex = k === 0 ? t0 : k === 1 ? t1 : t2;
					let vx;
					let vy;
					let vz;
					if (vertIndex < poly.vertices.length) {
						const vBase = poly.vertices[vertIndex] * 3;
						vx = tile.vertices[vBase];
						vy = tile.vertices[vBase + 1];
						vz = tile.vertices[vBase + 2];
					} else {
						const detailVertIndex = (polyDetail.verticesBase + vertIndex - poly.vertices.length) * 3;
						vx = tile.detailVertices[detailVertIndex];
						vy = tile.detailVertices[detailVertIndex + 1];
						vz = tile.detailVertices[detailVertIndex + 2];
					}
					triPositions.push(vx, vy, vz);
					triColors.push(...col);
				}
				triIndices.push(triVertexIndex, triVertexIndex + 1, triVertexIndex + 2);
				triVertexIndex += 3;
			}
		}
		const innerColor = [
			.2,
			.2,
			.2
		];
		const outerColor = [
			.6,
			.6,
			1
		];
		for (let polyId = 0; polyId < tile.polys.length; polyId++) {
			const poly = tile.polys[polyId];
			for (let j = 0; j < poly.vertices.length; j++) {
				const nj = (j + 1) % poly.vertices.length;
				const isBoundary = (poly.neis[j] & POLY_NEIS_FLAG_EXT_LINK) !== 0;
				const polyVertIndex1 = poly.vertices[j];
				const polyVertIndex2 = poly.vertices[nj];
				const v1Base = polyVertIndex1 * 3;
				const v2Base = polyVertIndex2 * 3;
				const v1x = tile.vertices[v1Base];
				const v1y = tile.vertices[v1Base + 1] + .01;
				const v1z = tile.vertices[v1Base + 2];
				const v2x = tile.vertices[v2Base];
				const v2y = tile.vertices[v2Base + 1] + .01;
				const v2z = tile.vertices[v2Base + 2];
				if (isBoundary) {
					outerPolyLinePositions.push(v1x, v1y, v1z);
					outerPolyLineColors.push(outerColor[0], outerColor[1], outerColor[2]);
					outerPolyLinePositions.push(v2x, v2y, v2z);
					outerPolyLineColors.push(outerColor[0], outerColor[1], outerColor[2]);
				} else {
					interPolyLinePositions.push(v1x, v1y, v1z);
					interPolyLineColors.push(innerColor[0], innerColor[1], innerColor[2]);
					interPolyLinePositions.push(v2x, v2y, v2z);
					interPolyLineColors.push(innerColor[0], innerColor[1], innerColor[2]);
				}
			}
		}
		const vertexColor = [
			1,
			1,
			1
		];
		for (let i = 0; i < tile.vertices.length; i += 3) {
			const worldX = tile.vertices[i];
			const worldY = tile.vertices[i + 1];
			const worldZ = tile.vertices[i + 2];
			vertexPositions.push(worldX, worldY, worldZ);
			vertexColors.push(vertexColor[0], vertexColor[1], vertexColor[2]);
		}
	}
	if (triPositions.length > 0) primitives.push({
		type: DebugPrimitiveType.Triangles,
		positions: triPositions,
		colors: triColors,
		indices: triIndices,
		transparent: true,
		opacity: .8,
		doubleSided: true
	});
	if (interPolyLinePositions.length > 0) primitives.push({
		type: DebugPrimitiveType.Lines,
		positions: interPolyLinePositions,
		colors: interPolyLineColors,
		transparent: true,
		opacity: .3,
		lineWidth: 1.5
	});
	if (outerPolyLinePositions.length > 0) primitives.push({
		type: DebugPrimitiveType.Lines,
		positions: outerPolyLinePositions,
		colors: outerPolyLineColors,
		transparent: true,
		opacity: .9,
		lineWidth: 2.5
	});
	if (vertexPositions.length > 0) primitives.push({
		type: DebugPrimitiveType.Points,
		positions: vertexPositions,
		colors: vertexColors,
		size: .025
	});
	return primitives;
};
var createSearchNodesHelper = (nodePool) => {
	const primitives = [];
	if (!nodePool || Object.keys(nodePool).length === 0) return primitives;
	const yOffset = .5;
	const pointPositions = [];
	const pointColors = [];
	const linePositions = [];
	const lineColors = [];
	const pointColor = [
		1,
		192 / 255,
		0
	];
	const lineColor = [
		1,
		192 / 255,
		0
	];
	for (const nodeRef in nodePool) {
		const nodes = nodePool[nodeRef];
		for (let i = 0; i < nodes.length; i++) {
			const [x, y, z] = nodes[i].position;
			pointPositions.push(x, y + yOffset, z);
			pointColors.push(pointColor[0], pointColor[1], pointColor[2]);
		}
	}
	for (const nodeRef in nodePool) {
		const nodes = nodePool[nodeRef];
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (node.parentNodeRef === null || node.parentState === null) continue;
			const parentNodes = nodePool[node.parentNodeRef];
			if (!parentNodes) continue;
			let parent;
			for (let j = 0; j < parentNodes.length; j++) if (parentNodes[j].state === node.parentState) {
				parent = parentNodes[j];
				break;
			}
			if (!parent) continue;
			const [cx, cy, cz] = node.position;
			const [px, py, pz] = parent.position;
			linePositions.push(cx, cy + yOffset, cz, px, py + yOffset, pz);
			lineColors.push(lineColor[0], lineColor[1], lineColor[2], lineColor[0], lineColor[1], lineColor[2]);
		}
	}
	if (pointPositions.length > 0) primitives.push({
		type: DebugPrimitiveType.Points,
		positions: pointPositions,
		colors: pointColors,
		size: .01,
		transparent: true,
		opacity: 1
	});
	if (linePositions.length > 0) primitives.push({
		type: DebugPrimitiveType.Lines,
		positions: linePositions,
		colors: lineColors,
		transparent: true,
		opacity: .5,
		lineWidth: 2
	});
	return primitives;
};
var createNavMeshOffMeshConnectionsHelper = (navMesh) => {
	const primitives = [];
	const arcSegments = 16;
	const circleSegments = 20;
	const arcPositions = [];
	const arcColors = [];
	const circlePositions = [];
	const circleColors = [];
	const arcColor = [
		1,
		196 / 255,
		0
	];
	const pillarColor = [
		0,
		48 / 255,
		64 / 255
	];
	const oneWayEndColor = [
		220 / 255,
		32 / 255,
		16 / 255
	];
	const lerp = (start, end, t) => start + (end - start) * t;
	for (const id in navMesh.offMeshConnections) {
		const con = navMesh.offMeshConnections[id];
		if (!con) continue;
		const start = con.start;
		const end = con.end;
		const radius = con.radius;
		for (let i = 0; i < arcSegments; i++) {
			const t0 = i / arcSegments;
			const t1 = (i + 1) / arcSegments;
			const x0 = lerp(start[0], end[0], t0);
			const y0 = lerp(start[1], end[1], t0) + Math.sin(t0 * Math.PI) * .25;
			const z0 = lerp(start[2], end[2], t0);
			const x1 = lerp(start[0], end[0], t1);
			const y1 = lerp(start[1], end[1], t1) + Math.sin(t1 * Math.PI) * .25;
			const z1 = lerp(start[2], end[2], t1);
			arcPositions.push(x0, y0, z0, x1, y1, z1);
			for (let k = 0; k < 2; k++) arcColors.push(arcColor[0], arcColor[1], arcColor[2]);
		}
		if (con.direction === OffMeshConnectionDirection.START_TO_END) {
			const tMid = .5;
			const xMid = lerp(start[0], end[0], tMid);
			const yMid = lerp(start[1], end[1], tMid) + .25;
			const zMid = lerp(start[2], end[2], tMid);
			const dirX = end[0] - start[0];
			const dirZ = end[2] - start[2];
			const len = Math.hypot(dirX, dirZ) || 1;
			const nx = dirX / len;
			const nz = dirZ / len;
			const back = .3;
			arcPositions.push(xMid, yMid, zMid, xMid - nx * back + nz * back * .5, yMid - .05, zMid - nz * back - nx * back * .5, xMid, yMid, zMid, xMid - nx * back - nz * back * .5, yMid - .05, zMid - nz * back + nx * back * .5);
			for (let k = 0; k < 4; k++) arcColors.push(arcColor[0], arcColor[1], arcColor[2]);
		}
		const addCircle = (center, color) => {
			for (let i = 0; i < circleSegments; i++) {
				const a0 = i / circleSegments * Math.PI * 2;
				const a1 = (i + 1) / circleSegments * Math.PI * 2;
				const x0 = center[0] + Math.cos(a0) * radius;
				const z0 = center[2] + Math.sin(a0) * radius;
				const x1 = center[0] + Math.cos(a1) * radius;
				const z1 = center[2] + Math.sin(a1) * radius;
				circlePositions.push(x0, center[1] + .1, z0, x1, center[1] + .1, z1);
				for (let k = 0; k < 2; k++) circleColors.push(color[0], color[1], color[2]);
			}
			circlePositions.push(center[0], center[1], center[2], center[0], center[1] + .2, center[2]);
			for (let k = 0; k < 2; k++) circleColors.push(pillarColor[0], pillarColor[1], pillarColor[2]);
		};
		addCircle(start, arcColor);
		addCircle(end, con.direction === OffMeshConnectionDirection.BIDIRECTIONAL ? arcColor : oneWayEndColor);
	}
	if (arcPositions.length > 0) primitives.push({
		type: DebugPrimitiveType.Lines,
		positions: arcPositions,
		colors: arcColors,
		transparent: true,
		opacity: .9,
		lineWidth: 2
	});
	if (circlePositions.length > 0) primitives.push({
		type: DebugPrimitiveType.Lines,
		positions: circlePositions,
		colors: circleColors,
		transparent: true,
		opacity: .8,
		lineWidth: 1.5
	});
	return primitives;
};
export { getNodeByRef as A, create$2 as B, erodeWalkableArea as C, findNearestPoly as D, filterWalkableLowHeightSpans as E, polyMeshDetailToTileDetailMesh as F, create$3 as H, polyMeshToTilePolys as I, rasterizeTriangles as L, isValidNodeRef as M, markWalkableTriangles as N, findPath as O, moveAlongSurface as P, raycast as R, createSearchNodesHelper as S, filterLowHangingWalkableObstacles as T, create$4 as U, min as V, createGetClosestPointOnPolyResult as _, addTile as a, createNavMeshHelper as b, buildDistanceField as c, buildRegions as d, buildTile as f, createFindNearestPolyResult as g, createDefaultQueryFilter as h, addOffMeshConnection as i, isOffMeshConnectionConnected as j, getClosestPointOnPoly as k, buildPolyMesh as l, calculateMeshBounds as m, ContourBuildFlags as n, buildCompactHeightfield as o, calculateGridSize as p, DEFAULT_QUERY_FILTER as r, buildContours as s, BuildContext as t, buildPolyMeshDetail as u, createHeightfield as v, filterLedgeSpans as w, createNavMeshOffMeshConnectionsHelper as x, createNavMesh as y, removeOffMeshConnection as z };

//# sourceMappingURL=navcat-BGuLG0iQ.js.map