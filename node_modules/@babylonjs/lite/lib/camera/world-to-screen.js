import { multiplyMat4 } from "../math/multiply-mat4.js";
import { transformCoordinatesToRef } from "../math/mat4-transform.js";
// src/camera/world-to-screen.ts
/**
* Project a point through an explicit world and view-projection transform into
* viewport pixels. Unlike the canvas-oriented helpers below, zero-sized
* viewports are valid and collapse the corresponding output coordinate.
*/
function projectPointToViewportToRef(point, world, transform, viewport, result) {
	const worldViewProjection = multiplyMat4(transform, world);
	transformCoordinatesToRef(point.x, point.y, point.z, worldViewProjection, result);
	result.x = viewport.x + (result.x + 1) * viewport.width * .5;
	result.y = viewport.y + (1 - result.y) * viewport.height * .5;
	return result;
}
function validateOptions(options) {
	const { viewport, backingWidth, backingHeight, worldOrigin, cssWidth, cssHeight } = options;
	if (!Number.isFinite(viewport.x) || !Number.isFinite(viewport.y) || !(viewport.width > 0) || !Number.isFinite(viewport.width) || !(viewport.height > 0) || !Number.isFinite(viewport.height) || !(backingWidth > 0) || !Number.isFinite(backingWidth) || !(backingHeight > 0) || !Number.isFinite(backingHeight)) throw new RangeError("ScreenProjectionOptions backing dimensions and viewport extents must be positive and finite; viewport offsets must be finite.");
	if (worldOrigin && (!Number.isFinite(worldOrigin.x) || !Number.isFinite(worldOrigin.y) || !Number.isFinite(worldOrigin.z))) throw new RangeError("ScreenProjectionOptions world origin must be finite.");
	if (cssWidth === void 0 !== (cssHeight === void 0) || cssWidth !== void 0 && (!(cssWidth > 0) || !Number.isFinite(cssWidth)) || cssHeight !== void 0 && (!(cssHeight > 0) || !Number.isFinite(cssHeight))) throw new RangeError("ScreenProjectionOptions CSS dimensions must both be positive and finite.");
}
/**
* Project a world-space point into canvas backing pixels and canvas-relative CSS pixels,
* writing every output field into `result`.
*
* `view` is required separately from `viewProjection` so `behindCamera` works for
* orthographic projections, whose homogeneous W remains 1. Coordinates are not clamped:
* finite offscreen points keep their extrapolated positions for edge-indicator placement.
*
* This function performs no allocations. When the matrices use a rebased coordinate frame,
* set `options.worldOrigin` to the absolute world position represented by their origin.
* Derive the matrices and viewport once per frame
* with `getViewMatrix`, `getViewProjectionMatrix`, `getEffectiveAspectRatio`, and
* `resolveCameraViewport`, then reuse both `options` and `result` for each projected point.
*/
function projectWorldToScreenToRef(point, view, viewProjection, options, result) {
	validateOptions(options);
	const v = view;
	const vp = viewProjection;
	const origin = options.worldOrigin;
	const x = point.x - (origin?.x ?? 0);
	const y = point.y - (origin?.y ?? 0);
	const z = point.z - (origin?.z ?? 0);
	const viewZ = x * v[2] + y * v[6] + z * v[10] + v[14];
	const clipX = x * vp[0] + y * vp[4] + z * vp[8] + vp[12];
	const clipY = x * vp[1] + y * vp[5] + z * vp[9] + vp[13];
	const clipZ = x * vp[2] + y * vp[6] + z * vp[10] + vp[14];
	const clipW = x * vp[3] + y * vp[7] + z * vp[11] + vp[15];
	const behindCamera = viewZ <= 0;
	result.clipW = clipW;
	result.behindCamera = behindCamera;
	if (!Number.isFinite(viewZ) || !Number.isFinite(clipX) || !Number.isFinite(clipY) || !Number.isFinite(clipZ) || !Number.isFinite(clipW) || clipW === 0) {
		result.x = result.y = result.z = result.cssX = result.cssY = NaN;
		result.clipped = true;
		result.offscreen = true;
		return result;
	}
	const invW = 1 / clipW;
	const ndcX = clipX * invW;
	const ndcY = clipY * invW;
	const ndcZ = clipZ * invW;
	if (!Number.isFinite(ndcX) || !Number.isFinite(ndcY) || !Number.isFinite(ndcZ)) {
		result.x = result.y = result.z = result.cssX = result.cssY = NaN;
		result.clipped = true;
		result.offscreen = true;
		return result;
	}
	const viewport = options.viewport;
	result.x = viewport.x + (ndcX + 1) * viewport.width * .5;
	result.y = viewport.y + (1 - ndcY) * viewport.height * .5;
	result.z = ndcZ;
	result.cssX = result.x * ((options.cssWidth ?? options.backingWidth) / options.backingWidth);
	result.cssY = result.y * ((options.cssHeight ?? options.backingHeight) / options.backingHeight);
	result.offscreen = behindCamera || clipW < 0 || ndcX < -1 || ndcX > 1 || ndcY < -1 || ndcY > 1;
	result.clipped = result.offscreen || ndcZ < 0 || ndcZ > 1;
	return result;
}
/**
* Allocating convenience wrapper for {@link projectWorldToScreenToRef}.
* Use the `ToRef` form when projecting repeatedly.
*/
function projectWorldToScreen(point, view, viewProjection, options) {
	return projectWorldToScreenToRef(point, view, viewProjection, options, {
		x: 0,
		y: 0,
		z: 0,
		cssX: 0,
		cssY: 0,
		clipW: 0,
		behindCamera: false,
		clipped: false,
		offscreen: false
	});
}
export { projectPointToViewportToRef, projectWorldToScreen, projectWorldToScreenToRef };

//# sourceMappingURL=world-to-screen.js.map