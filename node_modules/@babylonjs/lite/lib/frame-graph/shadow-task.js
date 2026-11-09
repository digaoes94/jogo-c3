import { _getShadowTaskCasterMeshes, _setShadowTaskInputPreloader } from "./shadow-inputs.js";
// src/frame-graph/shadow-task.ts
/** @internal Create the scene-owned shadow scheduling adapter task. */
function createShadowTask(engine, scene) {
	const shadowGenerators = /* @__PURE__ */ new Set();
	_setShadowTaskInputPreloader(preloadShadowTaskInput);
	const task = {
		name: "shadow",
		engine,
		scene,
		_passes: [],
		async _preload() {
			const loads = [];
			for (const light of scene.lights) {
				const sg = light.shadowGenerator;
				const casterMeshes = sg ? _getShadowTaskCasterMeshes(sg) : null;
				if (sg?._preloadShadowTask && casterMeshes) loads.push(preloadShadowTaskInput(sg, casterMeshes));
			}
			await Promise.all(loads);
		},
		record() {
			task._passes.length = 0;
			for (const light of scene.lights) {
				const sg = light.shadowGenerator;
				const casterMeshes = sg ? _getShadowTaskCasterMeshes(sg) : null;
				if (sg?._ensureShadowTaskState && casterMeshes && !sg._preloadPending) {
					shadowGenerators.add(sg);
					const state = sg._ensureShadowTaskState(engine, scene, casterMeshes);
					const version = scene._renderableVersion;
					state._task.record();
					state._recordedVersion = version;
				}
			}
		},
		execute() {
			let draws = 0;
			for (const light of scene.lights) {
				const sg = light.shadowGenerator;
				const casterMeshes = sg ? _getShadowTaskCasterMeshes(sg) : null;
				if (sg?._ensureShadowTaskState && sg._renderShadowMap && casterMeshes && !sg._preloadPending) {
					shadowGenerators.add(sg);
					const existing = sg._shadowTaskState ?? null;
					const state = sg._ensureShadowTaskState(engine, scene, casterMeshes);
					if (state !== existing || state._recordedVersion !== scene._renderableVersion) {
						const version = scene._renderableVersion;
						state._task.record();
						state._recordedVersion = version;
					}
					draws += sg._renderShadowMap(engine, state);
				}
			}
			return draws;
		},
		dispose() {
			task._passes.length = 0;
			for (const sg of shadowGenerators) {
				const state = sg._shadowTaskState;
				if (state) {
					state._task.dispose();
					sg._shadowTaskState = void 0;
				}
			}
			shadowGenerators.clear();
		}
	};
	return task;
}
/**
* Park `casterMeshes` on the generator while the no-colour material views for its caster families
* import — rendering before that would call a factory that is still undefined, so `record`/`execute`
* skip a parked generator — then lift the park, only on success and only if no newer set superseded
* this one meanwhile. A rejected import leaves the set parked: the factory is still missing, and
* rendering anyway would throw inside the frame with a far less actionable stack. Shared by the
* registration preload above, which awaits it, and — installed through `_setShadowTaskInputPreloader` —
* by the runtime re-supply in `setShadowTaskCasterMeshes`, which cannot.
*/
async function preloadShadowTaskInput(shadowGenerator, casterMeshes) {
	shadowGenerator._preloadPending = casterMeshes;
	await shadowGenerator._preloadShadowTask?.(casterMeshes);
	if (shadowGenerator._preloadPending === casterMeshes) shadowGenerator._preloadPending = void 0;
}
export { createShadowTask };

//# sourceMappingURL=shadow-task.js.map