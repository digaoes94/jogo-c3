import { F32, U8 } from "../../engine/typed-arrays.js";
import { decomposeMat4 } from "../../math/decompose-mat4.js";
// src/mesh/GaussianSplatting/gaussian-splatting-bake.ts
var ROW_LENGTH = 32;
function mat4TransformCoord(m, x, y, z) {
	const w = 1 / (m[3] * x + m[7] * y + m[11] * z + m[15]);
	return [
		(m[0] * x + m[4] * y + m[8] * z + m[12]) * w,
		(m[1] * x + m[5] * y + m[9] * z + m[13]) * w,
		(m[2] * x + m[6] * y + m[10] * z + m[14]) * w
	];
}
function mat4ToRotationQuat(m) {
	const q = decomposeMat4(m).rotation;
	return [
		q.x,
		q.y,
		q.z,
		q.w
	];
}
function quatMultiply(ax, ay, az, aw, bx, by, bz, bw) {
	return [
		aw * bx + ax * bw + ay * bz - az * by,
		aw * by - ax * bz + ay * bw + az * bx,
		aw * bz + ax * by - ay * bx + az * bw,
		aw * bw - ax * bx - ay * by - az * bz
	];
}
/**
* Bakes a transform matrix directly into a mesh's splat vertices, rewriting each splat's
* position, scale, and orientation so the mesh renders identically with an identity transform.
* @param mesh - Gaussian Splatting mesh to modify in place.
* @param transform - World-space transform to bake into the splat data.
*/
function bakeTransformIntoVertices(mesh, transform) {
	const newBuffer = mesh.splatsData.slice(0);
	const u8 = new U8(newBuffer);
	const f32 = new F32(newBuffer);
	const splatCount = u8.byteLength / ROW_LENGTH | 0;
	const m = new F32(transform);
	const scaleX = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
	const [tqx, tqy, tqz, tqw] = mat4ToRotationQuat(m);
	for (let i = 0; i < splatCount; i++) {
		const fi = i * 8;
		const bi = i * ROW_LENGTH;
		const rawX = f32[fi];
		const rawY = f32[fi + 1];
		const rawZ = f32[fi + 2];
		const [tx, ty, tz] = mat4TransformCoord(m, rawX, -rawY, rawZ);
		f32[fi] = tx;
		f32[fi + 1] = -ty;
		f32[fi + 2] = tz;
		f32[fi + 3] = f32[fi + 3] * scaleX;
		f32[fi + 4] = f32[fi + 4] * scaleX;
		f32[fi + 5] = f32[fi + 5] * scaleX;
		let qx = (u8[bi + 29] - 127.5) / 127.5;
		let qy = (u8[bi + 30] - 127.5) / 127.5;
		let qz = (u8[bi + 31] - 127.5) / 127.5;
		let qw = (u8[bi + 28] - 127.5) / 127.5;
		const qLen = Math.hypot(qx, qy, qz, qw) || 1;
		qx /= qLen;
		qy /= qLen;
		qz /= qLen;
		qw /= qLen;
		const [rx, ry, rz, rw] = quatMultiply(tqx, -tqy, tqz, -tqw, qx, qy, qz, qw);
		const rLen = Math.hypot(rx, ry, rz, rw) || 1;
		u8[bi + 28] = Math.round(rw / rLen * 127.5 + 127.5);
		u8[bi + 29] = Math.round(rx / rLen * 127.5 + 127.5);
		u8[bi + 30] = Math.round(ry / rLen * 127.5 + 127.5);
		u8[bi + 31] = Math.round(rz / rLen * 127.5 + 127.5);
	}
	mesh.updateData(newBuffer);
}
/**
* Bakes the mesh's current world matrix into its splat vertices, then resets the mesh's
* position, rotation, and scaling to identity so the visual result is unchanged.
* @param mesh - Gaussian Splatting mesh to modify in place.
*/
function bakeCurrentTransformIntoVertices(mesh) {
	const transform = mesh.worldMatrix;
	bakeTransformIntoVertices(mesh, transform);
	mesh.position.x = 0;
	mesh.position.y = 0;
	mesh.position.z = 0;
	mesh.rotationQuaternion.x = 0;
	mesh.rotationQuaternion.y = 0;
	mesh.rotationQuaternion.z = 0;
	mesh.rotationQuaternion.w = 1;
	mesh.scaling.x = 1;
	mesh.scaling.y = 1;
	mesh.scaling.z = 1;
}
export { bakeCurrentTransformIntoVertices, bakeTransformIntoVertices };

//# sourceMappingURL=gaussian-splatting-bake.js.map