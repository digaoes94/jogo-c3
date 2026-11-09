import { ThrowLiteError } from "../lite-error.js";
// src/animation/animation-manager.ts
/** Creates an animation task that invokes `update` each tick.
*  @param update - Callback that advances the task by the frame delta.
*  @param options - Optional category and dispose hook.
*  @returns The new, active animation task. */
function createAnimationTask(update, options) {
	return {
		_entityType: "animation-task",
		active: true,
		_update: update,
		_category: options?.category,
		_dispose: options?.dispose
	};
}
/** Creates an animation manager with no tasks attached.
*  @param options - Optional engine, fixed timestep, and update callback.
*  @returns The new manager. */
function createAnimationManager(options) {
	return {
		animations: [],
		fixedDeltaMs: options?.fixedDeltaMs ?? 0,
		running: false,
		engine: options?.engine,
		onUpdate: options?.onUpdate,
		_rafId: 0,
		_lastTime: 0
	};
}
/** Registers a single category `handler` on `manager` that drives every task tagged with `category` in one pass.
*  @throws If `category` is empty. */
function setAnimationTaskCategoryHandler(manager, category, handler) {
	if (!category) ThrowLiteError(1);
	manager._taskCategory = category;
	manager._taskCategoryHandler = handler;
}
/** Attaches `task` to `manager` and marks it active.
*  @throws If the task is already attached to a different manager. */
function addAnimationTask(manager, task) {
	const owner = task._owner;
	if (owner === manager) return;
	if (owner) ThrowLiteError(2);
	task.active = true;
	task._owner = manager;
	manager.animations.push(task);
}
/** Detaches `task` from `manager`, marking it inactive and running its dispose hook if it was attached. */
function removeAnimationTask(manager, task) {
	const index = manager.animations.indexOf(task);
	if (index !== -1) removeAnimationTaskAt(manager, index);
	else if (task._owner === manager) {
		task._owner = void 0;
		task.active = false;
	}
}
/** Removes and disposes every task attached to `manager`. */
function clearAnimationManager(manager) {
	while (manager.animations.length > 0) removeAnimationTaskAt(manager, manager.animations.length - 1);
}
/** Advances every active task by `deltaMs` (or by `fixedDeltaMs` when set), running the category handler first.
*  Ignores non-finite or negative steps. */
function updateAnimationManager(manager, deltaMs) {
	const step = manager.fixedDeltaMs > 0 ? manager.fixedDeltaMs : deltaMs;
	if (!Number.isFinite(step) || step < 0) return;
	manager._preUpdate?.(manager, step);
	const handledCategory = manager._taskCategoryHandler?.(manager, step) ? manager._taskCategory : void 0;
	const tasks = manager.animations.slice();
	for (let index = 0; index < tasks.length; index++) {
		const task = tasks[index];
		if (!task.active || task._category && task._category === handledCategory) continue;
		task._update(manager, step, task);
	}
}
/** Starts the manager's autonomous requestAnimationFrame loop. No-op if already running.
*  @throws If `requestAnimationFrame` is unavailable in the host environment. */
function startAnimationManager(manager) {
	if (manager.running) return;
	if (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function") ThrowLiteError(3);
	manager.running = true;
	manager._lastTime = 0;
	const tick = (now) => {
		if (!manager.running) return;
		const deltaMs = manager._lastTime > 0 ? now - manager._lastTime : 0;
		manager._lastTime = now;
		const step = manager.fixedDeltaMs > 0 ? manager.fixedDeltaMs : deltaMs;
		updateAnimationManager(manager, deltaMs);
		manager.onUpdate?.(step);
		manager._rafId = requestAnimationFrame(tick);
	};
	manager._rafId = requestAnimationFrame(tick);
}
/** Stops the manager's autonomous requestAnimationFrame loop. No-op if not running. */
function stopAnimationManager(manager) {
	if (!manager.running) return;
	cancelAnimationFrame(manager._rafId);
	manager._rafId = 0;
	manager._lastTime = 0;
	manager.running = false;
}
function removeAnimationTaskAt(manager, index) {
	const task = manager.animations[index];
	manager.animations.splice(index, 1);
	if (task._owner === manager) task._owner = void 0;
	task.active = false;
	task._dispose?.(manager);
}
export { addAnimationTask, clearAnimationManager, createAnimationManager, createAnimationTask, removeAnimationTask, setAnimationTaskCategoryHandler, startAnimationManager, stopAnimationManager, updateAnimationManager };

//# sourceMappingURL=animation-manager.js.map