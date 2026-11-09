import { ThrowLiteError } from "../lite-error.js";
import { tickAnimationCore } from "./animation-group.js";
import { addAnimationTask, createAnimationTask, removeAnimationTask } from "./animation-manager.js";
// src/animation/animation-group-task.ts
var ANIMATION_GROUP_TASK_CATEGORY = "animation-group";
function getMutableAnimationGroups(manager) {
	const managerInternal = manager;
	let groups = managerInternal._animationGroups;
	if (!groups) {
		groups = [];
		managerInternal._animationGroups = groups;
	}
	return groups;
}
/** Returns the animation groups currently attached to `manager`, or an empty array if none. */
function getAnimationGroups(manager) {
	return manager._animationGroups ?? [];
}
function getAnimationGroupOwner(group) {
	return group._animationManager;
}
/** Attaches `group` to `manager` so it is ticked each update, creating its backing animation task on first use.
*  @param manager - Animation manager that will own and drive the group.
*  @param group - Animation group to attach.
*  @throws If the group is already attached to a different manager. */
function addAnimationGroup(manager, group) {
	const groupInternal = group;
	const owner = groupInternal._animationManager;
	if (owner && owner !== manager) ThrowLiteError(0, group.name);
	if (owner === manager) return;
	const managerInternal = manager;
	if (groupInternal._animationOrderManager !== manager) {
		groupInternal._animationOrderManager = manager;
		groupInternal._animationOrder = managerInternal._nextAnimationGroupOrder ?? 0;
		managerInternal._nextAnimationGroupOrder = groupInternal._animationOrder + 1;
	}
	const task = groupInternal._animationTask ?? createAnimationTask((taskManager, deltaMs) => {
		tickAnimationCore(group, deltaMs, taskManager.engine);
	}, {
		category: "animation-group",
		dispose: (ownerManager) => {
			const groups = ownerManager._animationGroups;
			const index = groups?.indexOf(group) ?? -1;
			if (groups && index !== -1) groups.splice(index, 1);
			if (groupInternal._animationManager === ownerManager) groupInternal._animationManager = void 0;
			group._mixerCleanup?.(ownerManager);
		}
	});
	const groups = getMutableAnimationGroups(manager);
	const order = groupInternal._animationOrder;
	let groupIndex = groups.length;
	while (groupIndex > 0 && (groups[groupIndex - 1]._animationOrder ?? -1) > order) groupIndex--;
	groups.splice(groupIndex, 0, group);
	groupInternal._animationManager = manager;
	groupInternal._animationTask = task;
	addAnimationTask(manager, task);
	const nextTask = groups[groupIndex + 1]?._animationTask;
	if (nextTask) {
		const taskIndex = manager.animations.indexOf(task);
		const nextTaskIndex = manager.animations.indexOf(nextTask);
		if (taskIndex > nextTaskIndex && nextTaskIndex !== -1) {
			manager.animations.splice(taskIndex, 1);
			manager.animations.splice(nextTaskIndex, 0, task);
		}
	}
}
/** Attaches each group in `groups` to `manager` via {@link addAnimationGroup}. */
function addAnimationGroups(manager, groups) {
	for (const group of groups) addAnimationGroup(manager, group);
}
/** Detaches `group` from `manager`, removing its animation task so it is no longer ticked. */
function removeAnimationGroup(manager, group) {
	const groupInternal = group;
	const task = groupInternal._animationTask;
	if (task && groupInternal._animationManager === manager) {
		removeAnimationTask(manager, task);
		return;
	}
	const groups = manager._animationGroups;
	const index = groups?.indexOf(group) ?? -1;
	if (groups && index !== -1) groups.splice(index, 1);
	if (groupInternal._animationManager === manager) groupInternal._animationManager = void 0;
}
export { ANIMATION_GROUP_TASK_CATEGORY, addAnimationGroup, addAnimationGroups, getAnimationGroupOwner, getAnimationGroups, removeAnimationGroup };

//# sourceMappingURL=animation-group-task.js.map