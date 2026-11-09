// src/picking/pick-contributor.ts
/** Register a pickable entity on the scene (mirrors pushing a `Renderable`). Fully typed: `load` must
*  resolve to the entity's pick pipeline, whose `createPickContributor` accepts this entity's type.
*  The scene stores a heterogeneous list, so the single entity-type erasure is contained here.
*
*  Returns an unregister function. The entity's disposer should call it so a disposed entity is not
*  left behind in `scene._pickSources` (which the scene otherwise only clears wholesale on teardown). */
function registerPickSource(scene, entity, load) {
	const source = {
		entity,
		load
	};
	scene._pickSources.push(source);
	return () => {
		const i = scene._pickSources.indexOf(source);
		if (i >= 0) scene._pickSources.splice(i, 1);
	};
}
export { registerPickSource };

//# sourceMappingURL=pick-contributor.js.map