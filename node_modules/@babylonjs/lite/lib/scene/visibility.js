import { bumpVisibilityEpoch } from "../engine/engine.js";
// src/scene/visibility.ts
/** Set `visible` on `node` and all descendants (via `node.children`). glTF
*  KHR_node_visibility specifies that children inherit their parent's
*  invisibility — we materialize this at set-time so the render hot-path
*  only has to check a single boolean per mesh.
*
*  The epoch bump is SKIPPED when no node's flag actually changed: the bump
*  re-records every cached opaque render bundle (each draw re-resolves its
*  pipeline), so an animation loop that re-asserts the same visibility every
*  frame would otherwise force a full re-record per frame scene-wide. A
*  same-value call is now a true no-op; callers that need a re-record without
*  a visibility change use `invalidateRenderBundles`. */
function setSubtreeVisible(node, v) {
	if (cascade(node, v)) bumpVisibilityEpoch();
}
function cascade(node, v) {
	let changed = node.visible !== v;
	node.visible = v;
	const kids = node.children;
	for (let i = 0; i < kids.length; i++) if (cascade(kids[i], v)) changed = true;
	return changed;
}
export { setSubtreeVisible };

//# sourceMappingURL=visibility.js.map