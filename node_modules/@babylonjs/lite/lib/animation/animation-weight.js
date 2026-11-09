import { ThrowLiteError } from "../lite-error.js";
// src/animation/animation-weight.ts
/** Set the weighted contribution for an animation group. Feature-specific mixers remain explicit opt-ins. */
function setAnimationWeight(group, weight) {
	if (!Number.isFinite(weight) || weight < 0 || weight > 1) ThrowLiteError(6, weight);
	group.weight = weight;
}
export { setAnimationWeight };

//# sourceMappingURL=animation-weight.js.map