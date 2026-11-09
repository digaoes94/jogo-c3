import { onPhysicsAfterStep } from "./havok.js";
import { ensureHavokEventContext } from "./havok-events.js";
// src/physics/havok-collision.ts
/**
* Enable or disable collision-event reporting for a single body by setting its Havok event mask.
*
* Only bodies with events enabled contribute to the stream read by {@link onPhysicsCollision};
* a collision is reported when at least one of the two touching bodies has events enabled.
* @param world - The physics world owning the body.
* @param body - The body to toggle collision events on.
* @param enabled - `true` to report STARTED/CONTINUED/FINISHED events, `false` to silence the body.
*/
function setPhysicsBodyCollisionEventsEnabled(world, body, enabled) {
	const hknp = world._hknp;
	const mask = hknp.EventType.COLLISION_STARTED.value | hknp.EventType.COLLISION_CONTINUED.value | hknp.EventType.COLLISION_FINISHED.value;
	hknp.HP_Body_SetEventMask(body._hkBody, enabled ? mask : 0);
}
/**
* Register a callback invoked once per collision event after each physics step.
*
* The events are produced by the Havok world step, so they are drained via the post-step hook
* ({@link onPhysicsAfterStep}). Enable events on the participating bodies first with
* {@link setPhysicsBodyCollisionEventsEnabled}, otherwise the stream is empty.
* @param world - The physics world to listen on.
* @param cb - Callback invoked with each {@link PhysicsCollisionInfo} as it is read.
*/
function onPhysicsCollision(world, cb) {
	if (world._collision) {
		world._collision.callbacks.push(cb);
		return;
	}
	const hknp = world._hknp;
	const events = ensureHavokEventContext(world);
	const startedValue = hknp.EventType.COLLISION_STARTED.value;
	const continuedValue = hknp.EventType.COLLISION_CONTINUED.value;
	const collision = { callbacks: [cb] };
	world._collision = collision;
	onPhysicsAfterStep(world, () => {
		const callbackCount = collision.callbacks.length;
		let addr = hknp.HP_World_GetCollisionEvents(world._hkWorld)[1];
		while (addr) {
			const intBuf = new Int32Array(hknp.HEAPU8.buffer, addr);
			const floatBuf = new Float32Array(hknp.HEAPU8.buffer, addr);
			const type = intBuf[0];
			const offA = 2;
			const offB = 18;
			const bodyA = events.resolve(intBuf[offA]);
			const bodyB = events.resolve(intBuf[offB]);
			if (!bodyA || !bodyB) {
				addr = hknp.HP_World_GetNextCollisionEvent(world._hkWorld, addr);
				continue;
			}
			const pointA = {
				x: floatBuf[10],
				y: floatBuf[11],
				z: floatBuf[12]
			};
			const pointB = {
				x: floatBuf[26],
				y: floatBuf[27],
				z: floatBuf[28]
			};
			const normal = {
				x: floatBuf[13],
				y: floatBuf[14],
				z: floatBuf[15]
			};
			const info = {
				collider: bodyA[0],
				colliderIndex: bodyA[2],
				collidedAgainst: bodyB[0],
				collidedAgainstIndex: bodyB[2],
				type: type === startedValue ? "STARTED" : type === continuedValue ? "CONTINUED" : "FINISHED",
				point: pointA,
				normal,
				impulse: floatBuf[34],
				distance: (pointB.x - pointA.x) * normal.x + (pointB.y - pointA.y) * normal.y + (pointB.z - pointA.z) * normal.z
			};
			for (let index = 0; index < callbackCount; index++) {
				collision.callbacks[index](info);
				if (world._disposed) return;
			}
			addr = hknp.HP_World_GetNextCollisionEvent(world._hkWorld, addr);
		}
	});
}
export { onPhysicsCollision, setPhysicsBodyCollisionEventsEnabled };

//# sourceMappingURL=havok-collision.js.map