import { createHavokThinInstanceContext } from "./havok-thin-instances.js";
// src/physics/enable-havok-thin-instance-physics-sync.ts
/**
* Enable Havok rigid bodies for meshes with thin-instance matrices synchronously.
*
* Use this variant when an adapter must preserve a synchronous setup contract.
* Native Lite applications should normally prefer {@link enableHavokThinInstancePhysics},
* which loads the implementation on demand.
*/
function enableHavokThinInstancePhysicsSync(world) {
	world._thin ??= createHavokThinInstanceContext(world);
}
export { enableHavokThinInstancePhysicsSync };

//# sourceMappingURL=enable-havok-thin-instance-physics-sync.js.map