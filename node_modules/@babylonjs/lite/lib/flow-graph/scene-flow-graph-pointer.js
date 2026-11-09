import { FgEventType } from "./types.js";
import { pumpFlowGraphEvent } from "./runtime.js";
// src/flow-graph/scene-flow-graph-pointer.ts
function graphUsesPointerEvent(runtime) {
	return runtime.graph.blocks.some((block) => block.event === FgEventType.Pointer);
}
function runtimesForMesh(scene, mesh) {
	return (scene._flowGraphs?.filter(graphUsesPointerEvent) ?? []).filter((runtime) => runtime.env._assetScope === mesh._flowGraphAssetScope);
}
/** @internal */
function isFlowGraphMeshSelectable(scene, mesh) {
	const interactivityMesh = mesh;
	const nodeIndex = interactivityMesh._gltfNodeIndex;
	if (nodeIndex === void 0) return false;
	const selectablePointer = `/nodes/${nodeIndex}/extensions/KHR_node_selectability/selectable`;
	const runtimes = runtimesForMesh(scene, interactivityMesh);
	return runtimes.length > 0 && !runtimes.some((runtime) => runtime.env.accessors[selectablePointer]?.get() === false);
}
/** Dispatch one successful scene pick to the Flow Graph runtimes owned by its asset. */
function dispatchFlowGraphPointerPick(scene, pick) {
	const mesh = pick.pickedMesh;
	const nodeIndex = mesh?._gltfNodeIndex;
	if (!pick.hit || !mesh || nodeIndex === void 0 || !isFlowGraphMeshSelectable(scene, mesh)) return;
	for (const runtime of runtimesForMesh(scene, mesh)) pumpFlowGraphEvent(runtime, FgEventType.Pointer, {
		nodeIndex,
		controllerIndex: 0,
		event: "/extensions/KHR_interactivity/events/pointer"
	});
}
function refreshFlowGraphPointerPicking(scene) {
	if (!scene._flowGraphs?.some(graphUsesPointerEvent)) {
		scene._flowGraphPointerCleanup?.();
		return;
	}
	if (scene._flowGraphPointerCleanup || scene._flowGraphPointerInit) return scene._flowGraphPointerInit;
	scene._flowGraphPointerInit = import("../picking/gpu-picker.js").then(({ createGpuPicker, pickAsync, disposePicker }) => {
		if (!scene._flowGraphs?.some(graphUsesPointerEvent)) return;
		const canvas = scene.surface.canvas;
		if (!("addEventListener" in canvas)) return;
		const picker = createGpuPicker(scene);
		let disposed = false;
		let press;
		const onPointerDown = (event) => {
			const pointer = event;
			if (pointer.button === 0) press = {
				pointerId: pointer.pointerId,
				x: pointer.offsetX,
				y: pointer.offsetY
			};
		};
		const onPointerUp = (event) => {
			const pointer = event;
			const start = press;
			press = void 0;
			if (!start || start.pointerId !== pointer.pointerId || Math.hypot(pointer.offsetX - start.x, pointer.offsetY - start.y) > 5) return;
			pickAsync(picker, pointer.offsetX, pointer.offsetY, { filter: (mesh) => isFlowGraphMeshSelectable(scene, mesh) }).then((pick) => {
				if (!disposed) dispatchFlowGraphPointerPick(scene, pick);
			}).catch((error) => {
				console.error("Flow Graph pointer selection failed:", error);
			});
		};
		const onPointerCancel = () => {
			press = void 0;
		};
		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("pointerup", onPointerUp);
		canvas.addEventListener("pointercancel", onPointerCancel);
		scene._flowGraphPointerCleanup = () => {
			if (disposed) return;
			disposed = true;
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("pointerup", onPointerUp);
			canvas.removeEventListener("pointercancel", onPointerCancel);
			disposePicker(picker);
			scene._flowGraphPointerCleanup = void 0;
		};
	}).finally(() => {
		scene._flowGraphPointerInit = void 0;
	});
	return scene._flowGraphPointerInit;
}
/** Enable canvas pointer selection for Flow Graph pointer-event blocks on a scene.
* Keeping this bridge explicit prevents the optional GPU picker from entering
* bundles that only load non-interactive glTF assets. */
function enableFlowGraphPointerPicking(scene) {
	scene._flowGraphPointerRefresh = () => {
		refreshFlowGraphPointerPicking(scene);
	};
	return refreshFlowGraphPointerPicking(scene);
}
export { dispatchFlowGraphPointerPick, enableFlowGraphPointerPicking, isFlowGraphMeshSelectable };

//# sourceMappingURL=scene-flow-graph-pointer.js.map