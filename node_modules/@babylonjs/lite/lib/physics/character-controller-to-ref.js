// src/physics/character-controller-to-ref.ts
/**
* Compute character movement into an existing vector.
* @returns False when forward and up cannot form a movement frame.
*/
function calculatePhysicsCharacterMovementToRef(controller, deltaTime, forwardWorld, surfaceNormal, currentVelocity, surfaceVelocity, desiredVelocity, upWorld, result) {
	const crossX = forwardWorld.y * upWorld.z - forwardWorld.z * upWorld.y;
	const crossY = forwardWorld.z * upWorld.x - forwardWorld.x * upWorld.z;
	const crossZ = forwardWorld.x * upWorld.y - forwardWorld.y * upWorld.x;
	if (crossX * crossX + crossY * crossY + crossZ * crossZ < 1e-5) return false;
	const value = controller.calculateMovement(deltaTime, forwardWorld, surfaceNormal, currentVelocity, surfaceVelocity, desiredVelocity, upWorld);
	result.x = value.x;
	result.y = value.y;
	result.z = value.z;
	return true;
}
export { calculatePhysicsCharacterMovementToRef };

//# sourceMappingURL=character-controller-to-ref.js.map