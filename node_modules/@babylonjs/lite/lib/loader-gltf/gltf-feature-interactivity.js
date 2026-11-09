import { detachFlowGraph, runFlowGraphs } from "../flow-graph/scene-flow-graph.js";
import { parseFlowGraphEditorJson } from "../flow-graph/editor-serialization.js";
import { parseInteractivityGraph } from "../flow-graph/gltf/interactivity-parser.js";
import { resolvePointerAccessor } from "../flow-graph/gltf/path-converter.js";
import { _registerAssetContainerSceneCleanup } from "./gltf-scene-cleanup.js";
// src/loader-gltf/gltf-feature-interactivity.ts
/** Build a glTF-material-index → runtime-material map by walking the node→mesh→
*  primitive hierarchy in the same order the loader instantiates GPU meshes
*  (mirrors KHR_animation_pointer's `materialMap`). Lets a `pointer/{get,set}` on
*  a material's UV transform reach the live PBR material. The same walk records
*  each primitive's source node for `event/onSelect`. */
function buildMaterialMap(json, meshes, assetScope) {
	const map = [];
	const nodes = json.nodes ?? [];
	let gpuIdx = 0;
	for (let ni = 0; ni < nodes.length; ni++) {
		const meshRef = nodes[ni]?.mesh;
		if (meshRef === void 0) continue;
		const prims = json.meshes?.[meshRef]?.primitives ?? [];
		for (let p = 0; p < prims.length; p++) {
			const matIdx = prims[p]?.material;
			const mesh = meshes[gpuIdx++];
			if (mesh) {
				mesh._gltfNodeIndex = ni;
				mesh._flowGraphAssetScope = assetScope;
			}
			if (matIdx !== void 0 && mesh) map[matIdx] = mesh.material;
		}
	}
	return map;
}
var feature = {
	id: "KHR_interactivity",
	async applyAsset(_meshes, _root, ctx) {
		const graphs = (ctx._json.extensions?.KHR_interactivity)?.graphs ?? [];
		const nodeMap = ctx._nodeMap ?? [];
		const assetScope = {};
		const resolveCtx = {
			nodeMap,
			materials: buildMaterialMap(ctx._json, _meshes, assetScope),
			json: ctx._json
		};
		const flowGraphs = [];
		for (let graphIndex = 0; graphIndex < graphs.length; graphIndex++) try {
			const { graph, pointers } = await parseInteractivityGraph(graphs[graphIndex]);
			const accessors = {};
			for (const pointer of pointers) {
				const accessor = resolvePointerAccessor(pointer, resolveCtx);
				if (accessor) accessors[pointer] = accessor;
			}
			flowGraphs.push({
				graph,
				rightHanded: true,
				accessors,
				resolveAccessor: (pointer, scene, animations) => resolvePointerAccessor(pointer, {
					...resolveCtx,
					scene,
					animations
				}),
				_assetScope: assetScope
			});
		} catch (error) {
			console.warn(`KHR_interactivity: rejected graph ${graphIndex}:`, error);
		}
		const editorJson = (ctx._json.extensions?.BABYLON_flow_graph)?.flowGraph;
		if (editorJson) try {
			const parsed = await parseFlowGraphEditorJson(editorJson, { resolveReference(value) {
				const id = value.id ?? value.name;
				return nodeMap.find((node) => node && ((node.id ?? node.name) === id || node.name === id));
			} });
			parsed.graphs.forEach((graph, index) => flowGraphs.push({
				graph,
				rightHanded: parsed.rightHanded[index],
				accessors: {},
				_assetScope: assetScope
			}));
		} catch (error) {
			console.warn("BABYLON_flow_graph: rejected editor graph JSON:", error);
		}
		if (flowGraphs.length === 0) return {};
		return {
			flowGraphs,
			_sceneSetup(scene, container) {
				let removed = false;
				let active = [];
				const runtimes = runFlowGraphs(scene, flowGraphs, container.animationGroups);
				container.flowGraphRuntimes = runtimes;
				_registerAssetContainerSceneCleanup(container, scene, () => {
					removed = true;
					active.forEach((runtime) => detachFlowGraph(scene, runtime));
					active = [];
				});
				runtimes.then((loaded) => {
					if (removed) loaded.forEach((runtime) => detachFlowGraph(scene, runtime));
					else active = loaded;
				}, () => void 0);
			}
		};
	}
};
export { feature as default };

//# sourceMappingURL=gltf-feature-interactivity.js.map