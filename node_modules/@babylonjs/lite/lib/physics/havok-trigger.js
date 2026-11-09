import { onPhysicsAfterStep } from "./havok.js";
import { ensureHavokEventContext } from "./havok-events.js";
// src/physics/havok-trigger.ts
/**
* Havok Physics V2 trigger-volume reporting for Babylon Lite.
*
* Kept in a standalone module so the trigger path adds bytes only to scenes that actually
* import {@link setPhysicsShapeIsTrigger} or {@link onPhysicsTrigger}. The per-frame
* `_stepWorld` core in `havok.ts` intentionally does NOT reference this code, so ordinary
* physics scenes pay zero for it.
*
* Unlike collision events (which require a per-body event mask), trigger volumes only need
* the shape flagged as a trigger and the trigger body present in the world. Flag the shape,
* register a callback, and trigger events are drained via the existing post-step hook once
* per event:
*
* ```ts
*   const triggerShape = createPhysicsShape(world, { type: PhysicsShapeType.SPHERE, parameters: { radius: 2 } });
*   setPhysicsShapeIsTrigger(world, triggerShape, true);
*   const triggerNode = createTransformNode("trigger", 0, 0, 0);
*   const triggerBody = createPhysicsBody(world, triggerNode, PhysicsMotionType.STATIC);
*   setPhysicsBodyShape(world, triggerBody, triggerShape);
*   onPhysicsTrigger(world, (info) => {
*       console.log(info.type); // "ENTERED" when a body enters, "EXITED" when it leaves
*   });
* ```
*/
var TRIGGER_ENTERED = 8;
var TRIGGER_EXITED = 16;
/**
* Flag a collision shape as a trigger volume (or clear the flag).
*
* A trigger shape detects overlaps and reports {@link PhysicsTriggerInfo} events but does
* not produce a physical collision response — bodies pass through it. Attach the flagged
* shape to a body in the world, then listen with {@link onPhysicsTrigger}.
* @param world - The physics world owning the shape.
* @param shape - The collision shape to flag.
* @param isTrigger - `true` to make the shape a trigger volume, `false` for a solid shape.
*/
function setPhysicsShapeIsTrigger(world, shape, isTrigger) {
	world._hknp.HP_Shape_SetTrigger(shape._hkShape, isTrigger);
}
/**
* Register a callback invoked once per trigger event after each physics step.
*
* The events are produced by the Havok world step, so they are drained via the post-step
* hook ({@link onPhysicsAfterStep}). Flag the participating shape with
* {@link setPhysicsShapeIsTrigger} first, otherwise the stream is empty.
* @param world - The physics world to listen on.
* @param cb - Callback invoked with each {@link PhysicsTriggerInfo} as it is read.
* @returns A disposer that removes the callback.
*/
function onPhysicsTrigger(world, cb) {
	return registerTriggerDrain(world, () => drainTriggerEvents(world, (type) => cb({ type })));
}
/**
* Register a trigger callback that also resolves both participating Havok bodies.
*
* A body is `null` when the native event references a body that has already been removed from
* the world's tracked body list.
* @param world - The physics world to listen on.
* @param cb - Callback invoked with each body-aware trigger event.
* @returns A disposer that removes the callback.
*/
function onPhysicsTriggerBodies(world, cb) {
	const events = ensureHavokEventContext(world);
	return registerTriggerDrain(world, () => drainTriggerEvents(world, (type, bodyAId, bodyBId) => {
		const bodyA = events.resolve(bodyAId);
		const bodyB = events.resolve(bodyBId);
		cb({
			type,
			bodyA: bodyA?.[0] ?? null,
			bodyAIndex: bodyA?.[2] ?? -1,
			bodyB: bodyB?.[0] ?? null,
			bodyBIndex: bodyB?.[2] ?? -1
		});
	}));
}
function drainTriggerEvents(world, cb) {
	const hknp = world._hknp;
	let address = hknp.HP_World_GetTriggerEvents(world._hkWorld)[1];
	while (address) {
		const event = new Int32Array(hknp.HEAPU8.buffer, address);
		const type = event[0] === TRIGGER_ENTERED ? "ENTERED" : event[0] === TRIGGER_EXITED ? "EXITED" : null;
		if (type) cb(type, event[2], event[6]);
		address = hknp.HP_World_GetNextTriggerEvent(world._hkWorld, address);
	}
}
function registerTriggerDrain(world, drain) {
	onPhysicsAfterStep(world, drain);
	return () => {
		const callbacks = world._afterStep;
		const index = callbacks?.indexOf(drain) ?? -1;
		if (index >= 0) callbacks.splice(index, 1);
	};
}
export { onPhysicsTrigger, onPhysicsTriggerBodies, setPhysicsShapeIsTrigger };

//# sourceMappingURL=havok-trigger.js.map