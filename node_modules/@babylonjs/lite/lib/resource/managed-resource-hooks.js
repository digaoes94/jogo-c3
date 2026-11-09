// src/resource/managed-resource-hooks.ts
/** @internal Register an independent GPU resource family for engine teardown. */
function registerManagedResourceDisposer(engine, dispose) {
	const disposers = engine._managedResourceDisposers ??= [];
	disposers.push(dispose);
	if (disposers.length !== 1) return;
	engine._disposeManagedResources = () => {
		for (let i = disposers.length; i-- > 0;) disposers[i]();
	};
}
export { registerManagedResourceDisposer };

//# sourceMappingURL=managed-resource-hooks.js.map