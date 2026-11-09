import { _installAnimationMaskResolver } from "../skeleton/skeleton-updater.js";
// src/animation/animation-group-mask.ts
/** Mode controlling how an {@link AnimationGroupMask} filters targets. */
var AnimationGroupMaskMode = /* @__PURE__ */ function(AnimationGroupMaskMode) {
	/** Only the listed target names animate; every other target stays at its bind/rest pose. */
	AnimationGroupMaskMode[AnimationGroupMaskMode["Include"] = 0] = "Include";
	/** Every target animates except the listed names (which stay at their bind/rest pose). */
	AnimationGroupMaskMode[AnimationGroupMaskMode["Exclude"] = 1] = "Exclude";
	return AnimationGroupMaskMode;
}({});
/**
* Whether the mask retains (keeps animating) the given target name.
*
* Mirrors Babylon.js `AnimationGroupMask.retainsTarget`: in Include mode a name is
* retained when it is listed; in Exclude mode a name is retained when it is NOT listed.
* A disabled mask retains every name.
* @param mask - The mask to query.
* @param name - The target (node/bone) name to test.
* @returns True if a target with this name should animate, false if it is masked out.
*/
function animationGroupMaskRetainsTarget(mask, name) {
	if (mask.disabled) return true;
	return mask.names.indexOf(name) !== -1 === (mask.mode === 0);
}
/** Resolver installed into the animation controller: fills `out[i]=1` for every node
*  index `i` whose channels must be skipped (masked out), `0` for retained nodes. */
function resolveAnimationMask(mask, nodeNames, out, numNodes) {
	for (let i = 0; i < numNodes; i++) out[i] = animationGroupMaskRetainsTarget(mask, nodeNames[i] ?? "") ? 0 : 1;
}
/**
* Create an {@link AnimationGroupMask}.
* @param names - Target names listed by the mask (copied). Defaults to empty.
* @param mode - Include (only listed names animate) or Exclude (all but listed names animate).
*               Defaults to {@link AnimationGroupMaskMode.Include}.
* @returns A new mask. Assign it to `animationGroup.mask`.
*/
function createAnimationGroupMask(names = [], mode = 0) {
	_installAnimationMaskResolver(resolveAnimationMask);
	return {
		mode,
		names: names.slice(),
		disabled: false
	};
}
export { AnimationGroupMaskMode, animationGroupMaskRetainsTarget, createAnimationGroupMask };

//# sourceMappingURL=animation-group-mask.js.map