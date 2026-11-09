// src/physics/havok-queries.ts
/** Ignore-none body filter handle: a single zero body id. Lazily built — a
*  module-level `BigInt(0)` call is a module-init side effect that would defeat
*  the package's `sideEffects: false` contract. */
var _ignoreNone = null;
function ignoreNone() {
	return _ignoreNone ??= [BigInt(0)];
}
/** Lazily create (and cache on the world) the single-hit Havok query collector. */
function getCollector(world) {
	if (!world._queryCollector) world._queryCollector = world._hknp.HP_QueryCollector_Create(1)[1];
	return world._queryCollector;
}
/** Convert a Havok hit tuple's position/normal slots into plain `Vec3`s. */
function hitVec(slot) {
	return {
		x: slot[0],
		y: slot[1],
		z: slot[2]
	};
}
/**
* Find the closest point between a query shape and the nearest body in the world.
*
* The query shape is positioned at `position`/`rotation` and tested against the world's
* broadphase. When a body is found within `maxDistance`, `inputHitPoint` is the closest
* point on the query shape and `hitPoint` is the closest point on the hit body (world
* space). Run at least one physics step first so the broadphase exists.
* @param world - The physics world to query.
* @param query - Query shape, transform, and search distance.
* @returns The proximity result; `hasHit` is `false` when nothing is within range.
*/
function shapeProximity(world, query) {
	const hknp = world._hknp;
	const collector = getCollector(world);
	const { position: p, rotation: r } = query;
	const hkQuery = [
		query.shape._hkShape,
		[
			p.x,
			p.y,
			p.z
		],
		[
			r.x,
			r.y,
			r.z,
			r.w
		],
		query.maxDistance,
		query.shouldHitTriggers ?? false,
		ignoreNone()
	];
	hknp.HP_World_ShapeProximityWithCollector(world._hkWorld, collector, hkQuery);
	if (hknp.HP_QueryCollector_GetNumHits(collector)[1] > 0) {
		const [distance, hitInputData, hitShapeData] = hknp.HP_QueryCollector_GetShapeProximityResult(collector, 0)[1];
		return {
			hasHit: true,
			distance,
			inputHitPoint: hitVec(hitInputData[3]),
			hitPoint: hitVec(hitShapeData[3]),
			inputHitNormal: hitVec(hitInputData[4]),
			hitNormal: hitVec(hitShapeData[4])
		};
	}
	return emptyResult();
}
/**
* Sweep a shape from `startPosition` to `endPosition` (orientation fixed) and return the
* first body it hits.
*
* `hitPoint` is the world-space contact point on the hit body; `fraction` is where along
* the sweep contact first occurs. Run at least one physics step first so the broadphase exists.
* @param world - The physics world to query.
* @param query - Swept shape, orientation, and start/end positions.
* @returns The cast result; `hasHit` is `false` when the sweep clears every body.
*/
function shapeCast(world, query) {
	const hknp = world._hknp;
	const collector = getCollector(world);
	const { rotation: r, startPosition: s, endPosition: e } = query;
	const ignoredBody = query.ignoreBody ? [BigInt(query.ignoreBody._hkBody[0])] : ignoreNone();
	const hkQuery = [
		query.shape._hkShape,
		[
			r.x,
			r.y,
			r.z,
			r.w
		],
		[
			s.x,
			s.y,
			s.z
		],
		[
			e.x,
			e.y,
			e.z
		],
		query.shouldHitTriggers ?? false,
		ignoredBody
	];
	hknp.HP_World_ShapeCastWithCollector(world._hkWorld, collector, hkQuery);
	if (hknp.HP_QueryCollector_GetNumHits(collector)[1] > 0) {
		const [fraction, hitInputData, hitShapeData] = hknp.HP_QueryCollector_GetShapeCastResult(collector, 0)[1];
		return {
			hasHit: true,
			fraction,
			inputHitPoint: hitVec(hitInputData[3]),
			hitPoint: hitVec(hitShapeData[3]),
			inputHitNormal: hitVec(hitInputData[4]),
			hitNormal: hitVec(hitShapeData[4])
		};
	}
	return emptyResult();
}
/**
* Cast a ray from `from` to `to` and return the first body it hits.
*
* `collideWith`/`membership` filter which bodies the ray can hit (by their shape filter masks).
* For MESH shapes the hit triangle index is reported; non-mesh shapes report `-1`. Run at least
* one physics step first so the broadphase exists.
* @param world - The physics world to query.
* @param from - World-space ray origin.
* @param to - World-space ray end point.
* @param query - Optional collision-filter masks and trigger behaviour.
* @returns The raycast result; `hasHit` is `false` when the ray clears every matching body.
*/
function physicsRaycast(world, from, to, query = {}) {
	const hknp = world._hknp;
	const collector = getCollector(world);
	const membership = query.membership ?? -1;
	const collideWith = query.collideWith ?? -1;
	const hkQuery = [
		[
			from.x,
			from.y,
			from.z
		],
		[
			to.x,
			to.y,
			to.z
		],
		[membership, collideWith],
		query.shouldHitTriggers ?? false,
		ignoreNone()
	];
	hknp.HP_World_CastRayWithCollector(world._hkWorld, collector, hkQuery);
	if (hknp.HP_QueryCollector_GetNumHits(collector)[1] > 0) {
		const [, hitData] = hknp.HP_QueryCollector_GetCastRayResult(collector, 0)[1];
		const hitPos = hitData[3];
		const dx = from.x - hitPos[0];
		const dy = from.y - hitPos[1];
		const dz = from.z - hitPos[2];
		const body = findBodyById(world, hitData[0][0]);
		return {
			hasHit: true,
			hitPoint: hitVec(hitPos),
			hitNormal: hitVec(hitData[4]),
			hitDistance: Math.sqrt(dx * dx + dy * dy + dz * dz),
			triangleIndex: hitData[5],
			body: body?.[0] ?? null,
			bodyIndex: body?.[2] ?? -1
		};
	}
	return {
		hasHit: false,
		hitPoint: {
			x: 0,
			y: 0,
			z: 0
		},
		hitNormal: {
			x: 0,
			y: 0,
			z: 0
		},
		hitDistance: 0,
		triangleIndex: -1,
		body: null,
		bodyIndex: -1
	};
}
function findBodyById(world, hitBodyId) {
	const thinBody = world._thin?.resolve(hitBodyId);
	if (thinBody) return thinBody;
	const bodies = world._bodies;
	for (let i = 0; i < bodies.length; i++) {
		const body = bodies[i];
		if (body._hkBody[0] === hitBodyId) return [
			body,
			body._hkBody,
			0
		];
	}
	return null;
}
/** Zeroed no-hit result shared by both queries. */
function emptyResult() {
	const zero = () => ({
		x: 0,
		y: 0,
		z: 0
	});
	return {
		hasHit: false,
		distance: 0,
		fraction: 0,
		inputHitPoint: zero(),
		hitPoint: zero(),
		inputHitNormal: zero(),
		hitNormal: zero()
	};
}
export { physicsRaycast, shapeCast, shapeProximity };

//# sourceMappingURL=havok-queries.js.map