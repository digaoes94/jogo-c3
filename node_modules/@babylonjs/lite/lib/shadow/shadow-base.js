import { F32 } from "../engine/typed-arrays.js";
import { allocateMat4 } from "../math/_matrix-allocator.js";
import { _cameraChangeKey } from "../camera/camera.js";
import { createUniformBuffer } from "../resource/uniform-buffer.js";
import { packMat4IntoF32 } from "../math/pack-mat4-into-f32.js";
import { _rightHanded } from "#coordinate-system";
// src/shadow/shadow-base.ts
/**
* Shared shadow helpers used by ESM and PCF shadow generators/tasks.
*/
/** Write shadow generator state into a Float32Array(24) for UBO upload.
*  Layout: [lightMatrix(16), depthValues.x, depthValues.y, 0, 0, shadowsInfo(4)] */
function writeShadowUboFields(out, sg) {
	packMat4IntoF32(out, sg._lightMatrix, 0);
	out[16] = sg._depthValues[0];
	out[17] = sg._depthValues[1];
	out[18] = 0;
	out[19] = 0;
	out[20] = sg._shadowsInfo[0];
	out[21] = sg._shadowsInfo[1];
	out[22] = sg._shadowsInfo[2];
	out[23] = sg._shadowsInfo[3];
}
/** Build a light-space view matrix (column-major 4x4) from direction + position.
*  Shared between directional and spot shadow generators. */
function buildLightViewMatrix(dirX, dirY, dirZ, px, py, pz) {
	const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
	const fx = dirX / len;
	const fy = dirY / len;
	const fz = dirZ / len;
	let upX = 0, upY = 1, upZ = 0;
	if (Math.abs(fy) > .99) {
		upX = 0;
		upY = 0;
		upZ = 1;
	}
	let rx = upY * fz - upZ * fy;
	let ry = upZ * fx - upX * fz;
	let rz = upX * fy - upY * fx;
	const rLen = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
	rx /= rLen;
	ry /= rLen;
	rz /= rLen;
	const ux = fy * rz - fz * ry;
	const uy = fz * rx - fx * rz;
	const uz = fx * ry - fy * rx;
	if (_rightHanded !== null) {
		rx = -rx;
		ry = -ry;
		rz = -rz;
	}
	return new F32([
		rx,
		ux,
		fx,
		0,
		ry,
		uy,
		fy,
		0,
		rz,
		uz,
		fz,
		0,
		-(rx * px + ry * py + rz * pz),
		-(ux * px + uy * py + uz * pz),
		-(fx * px + fy * py + fz * pz),
		1
	]);
}
/** Multiply two column-major 4x4 matrices: out = a * b. */
function multiply4x4(a, b) {
	const out = new F32(16);
	for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
		let sum = 0;
		for (let k = 0; k < 4; k++) sum += a[row + k * 4] * b[k + col * 4];
		out[row + col * 4] = sum;
	}
	return out;
}
/** Fit an orthographic directional-light projection to caster world-space bounds. */
function computeDirectionalLightMatrix(light, casterMeshes, orthoMinZ, orthoMaxZ, offX = 0, offY = 0, offZ = 0) {
	const lightWorld = light.worldMatrix;
	const direction = light.direction;
	const view = buildLightViewMatrix(lightWorld[0] * direction.x + lightWorld[4] * direction.y + lightWorld[8] * direction.z, lightWorld[1] * direction.x + lightWorld[5] * direction.y + lightWorld[9] * direction.z, lightWorld[2] * direction.x + lightWorld[6] * direction.y + lightWorld[10] * direction.z, lightWorld[12] - offX, lightWorld[13] - offY, lightWorld[14] - offZ);
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;
	for (const mesh of casterMeshes) {
		const world = mesh.worldMatrix;
		const boundMin = mesh.boundMin ?? [
			-.5,
			-.5,
			-.5
		];
		const boundMax = mesh.boundMax ?? [
			.5,
			.5,
			.5
		];
		for (let corner = 0; corner < 8; corner++) {
			const localX = corner & 1 ? boundMax[0] : boundMin[0];
			const localY = corner & 2 ? boundMax[1] : boundMin[1];
			const localZ = corner & 4 ? boundMax[2] : boundMin[2];
			const worldX = world[0] * localX + world[4] * localY + world[8] * localZ + world[12] - offX;
			const worldY = world[1] * localX + world[5] * localY + world[9] * localZ + world[13] - offY;
			const worldZ = world[2] * localX + world[6] * localY + world[10] * localZ + world[14] - offZ;
			const viewX = view[0] * worldX + view[4] * worldY + view[8] * worldZ + view[12];
			const viewY = view[1] * worldX + view[5] * worldY + view[9] * worldZ + view[13];
			minX = Math.min(minX, viewX);
			maxX = Math.max(maxX, viewX);
			minY = Math.min(minY, viewY);
			maxY = Math.max(maxY, viewY);
		}
	}
	if (!Number.isFinite(minX)) {
		minX = -1;
		maxX = 1;
		minY = -1;
		maxY = 1;
	}
	const padX = (maxX - minX) * .1;
	const padY = (maxY - minY) * .1;
	minX -= padX;
	maxX += padX;
	minY -= padY;
	maxY += padY;
	const projection = new F32(16);
	projection[0] = 2 / (maxX - minX);
	projection[5] = 2 / (maxY - minY);
	projection[10] = 1 / (orthoMaxZ - orthoMinZ);
	projection[12] = -(maxX + minX) / (maxX - minX);
	projection[13] = -(maxY + minY) / (maxY - minY);
	projection[14] = -orthoMinZ / (orthoMaxZ - orthoMinZ);
	projection[15] = 1;
	return {
		_view: view,
		_viewProj: multiply4x4(projection, view),
		_near: orthoMinZ,
		_far: orthoMaxZ
	};
}
/** Create the shared shadow-params UBO (32 bytes) holding bias/depthScale/depth-range fields. */
function createShadowParamsUBO(engine, bias, depthScale) {
	const data = new F32(8);
	data[0] = bias;
	data[2] = depthScale;
	data[4] = 0;
	data[5] = 1;
	return createUniformBuffer(engine, data);
}
/** Create the eager shadow-map render target used by frame-graph shadow tasks. */
function createShadowRenderTarget(sg, colorTexture = null, depthTexture = sg._depthTexture) {
	const mapSize = sg._config._mapSize;
	return {
		_descriptor: {
			size: {
				width: mapSize,
				height: mapSize
			},
			format: colorTexture ? "rgba16float" : void 0,
			dFormat: "depth32float",
			depthClearValue: 1,
			depthCompare: "less-equal",
			samples: 1
		},
		_colorTexture: colorTexture,
		_colorView: colorTexture?.createView() ?? null,
		_depthTexture: depthTexture,
		_depthView: depthTexture.createView(),
		_width: mapSize,
		_height: mapSize,
		_eager: true,
		_ownsDepthTexture: false
	};
}
/** Create the shared receiver-side shadow UBO (96 bytes), initialised from state. */
function createSharedShadowUBO(engine, _lightMatrix, _depthValues, _shadowsInfo) {
	const data = new F32(24);
	writeShadowUboFields(data, {
		_lightMatrix,
		_depthValues,
		_shadowsInfo
	});
	return {
		ubo: createUniformBuffer(engine, data),
		data
	};
}
/** Sum caster transform versions plus non-transform geometry/count mutations. */
function casterVersionSum(casterMeshes) {
	let sum = 0;
	for (const mesh of casterMeshes) sum += mesh.worldMatrixVersion + ~~mesh.thinInstances?._version;
	return sum;
}
/** Create the light-owned camera facade used by shadow render tasks.
*  Caches are pre-allocated from the process-global allocator. */
function createShadowCamera(sg) {
	return {
		fov: 1,
		nearPlane: 1,
		farPlane: 1,
		children: [],
		_viewCache: allocateMat4(),
		_projCache: allocateMat4(),
		_vpCache: allocateMat4(),
		get worldMatrix() {
			return sg._light.worldMatrix;
		},
		get worldMatrixVersion() {
			return this._shadowCameraVersion ?? sg._light._lightVersion;
		}
	};
}
/** Update the camera facade caches shared by all shadow task variants.
*
*  This facade does not *compute* its matrices through `camera.ts` — the shadow task already
*  built the light's view / view-projection (an orthographic or spot volume that
*  `getProjectionMatrix` knows nothing about) and installs them here, pinning the cache
*  versions so `getViewMatrix` / `getViewProjectionMatrix` hand them straight back.
*
*  The pin must therefore use the *same* key each getter compares against, or the getter
*  misses and silently rebuilds a perspective projection over the light's volume. The view
*  matrix keys on `worldMatrixVersion` (which the facade reports as `cameraVersion`); the
*  view-projection keys on `_cameraChangeKey`, which additionally folds in the projection
*  revision — and writing `nearPlane` / `farPlane` above moves that revision, so the key is
*  read *after* those writes and after `_shadowCameraVersion` is set. */
function updateShadowCameraBase(camera, cameraVersion, near, far, view, viewProj) {
	camera.nearPlane = near;
	camera.farPlane = far;
	camera._shadowCameraVersion = cameraVersion;
	camera._viewCache = view;
	camera._viewVer = cameraVersion;
	camera._vpCache = viewProj;
	camera._vpVer = _cameraChangeKey(camera);
	camera._vpAspect = 1;
}
export { buildLightViewMatrix, casterVersionSum, computeDirectionalLightMatrix, createShadowCamera, createShadowParamsUBO, createShadowRenderTarget, createSharedShadowUBO, multiply4x4, updateShadowCameraBase, writeShadowUboFields };

//# sourceMappingURL=shadow-base.js.map