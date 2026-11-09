import { F32 } from "../engine/typed-arrays.js";
import { multiplyMat4 } from "../math/multiply-mat4.js";
import { BU, TU } from "../engine/gpu-flags.js";
import { normalizeVec3TupleOrUp } from "../math/normalize-vec3-tuple-or-up.js";
// src/picking/detailed-picking.ts
function ensureDetailTarget(engine, owner) {
	if (owner.detail) return owner.detail;
	const texture = engine._device.createTexture({
		label: "pick-detail",
		size: [1, 1],
		format: "rgba32uint",
		usage: TU.RENDER_ATTACHMENT | TU.COPY_SRC
	});
	return owner.detail = {
		texture,
		view: texture.createView(),
		staging: engine._device.createBuffer({
			label: "pick-detail-staging",
			size: 256,
			usage: BU.COPY_DST | BU.MAP_READ
		})
	};
}
function copyDetailTarget(encoder, target) {
	encoder.copyTextureToBuffer({ texture: target.texture }, {
		buffer: target.staging,
		bytesPerRow: 256
	}, {
		width: 1,
		height: 1
	});
}
async function readDetailTarget(target) {
	await target.staging.mapAsync(GPUMapMode.READ);
	const range = target.staging.getMappedRange();
	const u32 = new Uint32Array(range);
	const primitiveIndex = u32[0] === 4294967295 ? -1 : u32[0];
	const f32 = new Float32Array(range);
	const localPoint = primitiveIndex < 0 ? null : [
		f32[1],
		f32[2],
		f32[3]
	];
	target.staging.unmap();
	return {
		primitiveIndex,
		localPoint
	};
}
/**
* Enable detailed results for subsequent {@link pickAsync} calls on `picker`.
*
* The detailed path is still the same GPU raster pick. It adds one packed 1x1
* attachment containing the winning primitive id and interpolated local surface
* position; Lite decodes that result into `faceId`, `bu`/`bv`, normals, and UV
* helper support. Detailed picking requires WebGPU primitive-index support;
* Lite installs no compatibility branch or CPU triangle-search fallback.
*/
function enableDetailedPicking(picker) {
	picker._detailedPicking = picker._scene.surface.engine._device.features.has("primitive-index");
}
/** @internal Snapshot one draw-time world matrix before asynchronous readback. */
function copyDetailedWorldMatrix(source) {
	return new F32(source);
}
/** @internal Compose the draw-time base world with the selected affine thin-instance matrix. */
function detailedWorldMatrix(baseWorld, mesh, thinInstanceIndex) {
	const ti = mesh.thinInstances;
	if (thinInstanceIndex < 0 || !ti) return baseWorld;
	const offset = thinInstanceIndex * 16;
	const packed = ti.matrices.subarray(offset, offset + 16);
	const instance = new F32(16);
	instance[0] = packed[0];
	instance[1] = packed[1];
	instance[2] = packed[2];
	instance[3] = 0;
	instance[4] = packed[4];
	instance[5] = packed[5];
	instance[6] = packed[6];
	instance[7] = 0;
	instance[8] = packed[8];
	instance[9] = packed[9];
	instance[10] = packed[10];
	instance[11] = 0;
	instance[12] = packed[12];
	instance[13] = packed[13];
	instance[14] = packed[14];
	instance[15] = 1;
	return multiplyMat4(baseWorld, instance);
}
var _deformedTriangle = null;
function transformNormal(world, normal) {
	return normalizeVec3TupleOrUp(world[0] * normal[0] + world[4] * normal[1] + world[8] * normal[2], world[1] * normal[0] + world[5] * normal[1] + world[9] * normal[2], world[2] * normal[0] + world[6] * normal[1] + world[10] * normal[2]);
}
function facesPickRay(normal, info) {
	const ray = info.ray;
	return !!ray && normal[0] * ray.direction[0] + normal[1] * ray.direction[1] + normal[2] * ray.direction[2] > 0;
}
function clampTinyBarycentric(value) {
	return Math.abs(value) < 1e-12 ? 0 : value;
}
/** @internal Decode exact primitive-local detail into the public mesh picking fields.
*
*  `positions` and `localPoint` are always the mesh's **rest** geometry and must share that space. The
*  GPU pick shader interpolates the rest local position across the *deformed* triangle it rasterized,
*  so the weights recovered from the rest triangle are exactly the hit's weights on the deformed
*  surface — barycentric coordinates are affine-invariant. Solving `localPoint` against deformed
*  vertices instead would mix spaces and skew `bu`/`bv`; a pure translation morph is enough to break it.
*
*  Caveat: that recovery is well-posed only for a nondegenerate rest triangle. A rest-collinear
*  triangle that deformation makes rasterizable has no unique rest-space solution; the `denom` guard
*  below leaves `bu`/`bv` unset in that case rather than returning a wrong answer.
*
*  The face normal is the exception — it comes from triangle edges, which deformation genuinely
*  rotates — so `deformTriangle` supplies those three (and only those three) deformed vertices. */
function populateDetailedMeshInfo(info, mesh, faceId, localPoint, positions, normals, world, surfaceNormalsValid, deformTriangle) {
	info.faceId = faceId;
	const indices = mesh._cpuIndices;
	if (!positions || !indices || faceId < 0 || faceId * 3 + 2 >= indices.length) return;
	const i0 = indices[faceId * 3];
	const i1 = indices[faceId * 3 + 1];
	const i2 = indices[faceId * 3 + 2];
	if (i0 * 3 + 2 >= positions.length || i1 * 3 + 2 >= positions.length || i2 * 3 + 2 >= positions.length) return;
	const o0 = i0 * 3;
	const o1 = i1 * 3;
	const o2 = i2 * 3;
	const ax = positions[o0];
	const ay = positions[o0 + 1];
	const az = positions[o0 + 2];
	const e0x = positions[o1] - ax;
	const e0y = positions[o1 + 1] - ay;
	const e0z = positions[o1 + 2] - az;
	const e1x = positions[o2] - ax;
	const e1y = positions[o2 + 1] - ay;
	const e1z = positions[o2 + 2] - az;
	const px = localPoint[0] - ax;
	const py = localPoint[1] - ay;
	const pz = localPoint[2] - az;
	const d00 = e0x * e0x + e0y * e0y + e0z * e0z;
	const d01 = e0x * e1x + e0y * e1y + e0z * e1z;
	const d11 = e1x * e1x + e1y * e1y + e1z * e1z;
	const d20 = px * e0x + py * e0y + pz * e0z;
	const d21 = px * e1x + py * e1y + pz * e1z;
	const denom = d00 * d11 - d01 * d01;
	if (Math.abs(denom) <= Number.EPSILON) return;
	const vertex1Weight = (d11 * d20 - d01 * d21) / denom;
	const vertex2Weight = (d00 * d21 - d01 * d20) / denom;
	info.bu = clampTinyBarycentric(1 - vertex1Weight - vertex2Weight);
	info.bv = clampTinyBarycentric(vertex1Weight);
	if (!surfaceNormalsValid) {
		info._normalsInvalid = true;
		return;
	}
	if (normals && i0 * 3 + 2 < normals.length && i1 * 3 + 2 < normals.length && i2 * 3 + 2 < normals.length) {
		const bw = 1 - info.bu - info.bv;
		let localNormal = normalizeVec3TupleOrUp(info.bu * normals[i0 * 3] + info.bv * normals[i1 * 3] + bw * normals[i2 * 3], info.bu * normals[i0 * 3 + 1] + info.bv * normals[i1 * 3 + 1] + bw * normals[i2 * 3 + 1], info.bu * normals[i0 * 3 + 2] + info.bv * normals[i1 * 3 + 2] + bw * normals[i2 * 3 + 2]);
		let worldNormal = transformNormal(world, localNormal);
		if (facesPickRay(worldNormal, info)) {
			localNormal = [
				-localNormal[0],
				-localNormal[1],
				-localNormal[2]
			];
			worldNormal = [
				-worldNormal[0],
				-worldNormal[1],
				-worldNormal[2]
			];
		}
		info.pickedNormal = localNormal;
		info.pickedNormalWorld = worldNormal;
	}
	let fe0x = e0x;
	let fe0y = e0y;
	let fe0z = e0z;
	let fe1x = e1x;
	let fe1y = e1y;
	let fe1z = e1z;
	if (deformTriangle) {
		const triangle = _deformedTriangle ??= new F32(9);
		if (deformTriangle(mesh, i0, i1, i2, triangle)) {
			fe0x = triangle[3] - triangle[0];
			fe0y = triangle[4] - triangle[1];
			fe0z = triangle[5] - triangle[2];
			fe1x = triangle[6] - triangle[0];
			fe1y = triangle[7] - triangle[1];
			fe1z = triangle[8] - triangle[2];
		}
	}
	let localFaceNormal = normalizeVec3TupleOrUp(fe0y * fe1z - fe0z * fe1y, fe0z * fe1x - fe0x * fe1z, fe0x * fe1y - fe0y * fe1x);
	let worldFaceNormal = transformNormal(world, localFaceNormal);
	if (facesPickRay(worldFaceNormal, info)) {
		localFaceNormal = [
			-localFaceNormal[0],
			-localFaceNormal[1],
			-localFaceNormal[2]
		];
		worldFaceNormal = [
			-worldFaceNormal[0],
			-worldFaceNormal[1],
			-worldFaceNormal[2]
		];
	}
	info.pickedFaceNormal = localFaceNormal;
	info.pickedFaceNormalWorld = worldFaceNormal;
}
export { copyDetailTarget, copyDetailedWorldMatrix, detailedWorldMatrix, enableDetailedPicking, ensureDetailTarget, populateDetailedMeshInfo, readDetailTarget };

//# sourceMappingURL=detailed-picking.js.map