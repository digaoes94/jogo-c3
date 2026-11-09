import { addMeshLoDPageBenefit, conservativeWorldScale, fadd, fmul, fsub, meshLoDConeCullMargin, meshLoDPageBenefit, perspectivePixelScale, projectSphere, sphereOutsidePlanes } from "./mesh-lod-selection-math.js";
// src/mesh-lod/mesh-lod-selection-cpu.ts
function project(input, worldScale, pixelScale, center, radius, error) {
	return projectSphere(input.worldMatrix, input.camera.position, input.camera.near, input.camera.orthographicHeight, input.camera.targetHeight, worldScale, pixelScale, center, radius, error);
}
function groupResident(input, group) {
	for (let i = 0; i < group.pageRefCount; i++) if (!input.isPageResident(input.groupPageRefs[group.firstPageRef + i])) return false;
	return true;
}
/** Run the deterministic CPU selection oracle. */
function selectMeshLoDCpu(input) {
	const groupCount = input.groups.length;
	const worldScale = conservativeWorldScale(input.worldMatrix);
	const pixelScale = Math.fround(input.camera.perspectivePixelScale ?? perspectivePixelScale(input.camera.targetHeight, input.camera.verticalFov));
	const refineBoundary = fmul(input.screenSpaceError, fadd(1, input.lodHysteresis));
	const coarsenBoundary = fmul(input.screenSpaceError, fsub(1, input.lodHysteresis));
	const groupErrorPx = new Float64Array(groupCount);
	const fineRequired = new Uint8Array(groupCount);
	const resident = new Uint8Array(groupCount);
	for (let g = 0; g < groupCount; g++) {
		const group = input.groups[g];
		resident[g] = groupResident(input, group) ? 1 : 0;
		if (group.terminal || !Number.isFinite(group.simplifiedError)) {
			fineRequired[g] = 1;
			groupErrorPx[g] = Number.POSITIVE_INFINITY;
			continue;
		}
		const errorPx = project(input, worldScale, pixelScale, group.center, group.radius, group.simplifiedError).errorPx;
		groupErrorPx[g] = errorPx;
		fineRequired[g] = (input.wasFineRequired[g] ? errorPx >= coarsenBoundary : errorPx > refineBoundary) ? 1 : 0;
	}
	const visible = new Uint8Array(groupCount);
	const stack = [];
	for (let level = input.levelCount - 1; level >= 0; level--) stack.push(level);
	while (stack.length > 0) {
		const nodeIndex = stack.pop();
		const node = input.nodes[nodeIndex];
		const p = project(input, worldScale, pixelScale, node.center, node.radius, node.error);
		if (sphereOutsidePlanes(input.frustumPlanes, p.worldCenter, p.worldRadius)) continue;
		if (node.groupId === -1) for (let c = node.childCount - 1; c >= 0; c--) stack.push(node.childOffset + c);
		else visible[node.groupId] = 1;
	}
	const selected = [];
	const demandShare = /* @__PURE__ */ new Map();
	const demandedGroups = /* @__PURE__ */ new Set();
	let renderedTriangleCount = 0;
	let maximumSelectedErrorPixels = 0;
	for (let c = 0; c < input.clusters.length; c++) {
		const cluster = input.clusters[c];
		const g = cluster.groupId;
		if (!visible[g] || !resident[g] || !fineRequired[g]) continue;
		const r = cluster.refinedGroupId;
		if (r !== -1 && fineRequired[r] === 1 && resident[r] === 1) continue;
		if (input.coneCull !== false && !(input.camera.orthographicHeight !== void 0 && input.camera.orthographicHeight > 0) && meshLoDConeCullMargin(input.worldMatrix, input.camera.position, cluster.center, cluster.radius, cluster.normalCone) <= 0) continue;
		selected.push(c);
		renderedTriangleCount += cluster.triangleCount;
		const err = groupErrorPx[g];
		if (Number.isFinite(err) && err > maximumSelectedErrorPixels) maximumSelectedErrorPixels = err;
		if (r !== -1 && fineRequired[r] === 1 && resident[r] === 0) demandedGroups.add(r);
	}
	let maximumUnmetErrorPixels = 0;
	for (const r of demandedGroups) {
		const group = input.groups[r];
		const missing = [];
		for (let i = 0; i < group.pageRefCount; i++) {
			const pageId = input.groupPageRefs[group.firstPageRef + i];
			if (!input.isPageResident(pageId)) missing.push(pageId);
		}
		if (missing.length === 0) continue;
		const p = project(input, worldScale, pixelScale, group.center, group.radius, group.simplifiedError);
		const errorPx = p.errorPx;
		if (errorPx > maximumUnmetErrorPixels) maximumUnmetErrorPixels = errorPx;
		const pageShare = meshLoDPageBenefit(p, input.screenSpaceError, input.camera.targetWidth, input.camera.targetHeight, missing.length);
		for (const pageId of missing) demandShare.set(pageId, addMeshLoDPageBenefit(demandShare.get(pageId) ?? 0, pageShare));
	}
	const desiredPages = [];
	for (const [pageId, share] of demandShare) {
		const stored = input.pageRecords[pageId]?.storedBytes ?? 1;
		desiredPages.push({
			pageId,
			priority: share / stored
		});
	}
	desiredPages.sort((a, b) => b.priority !== a.priority ? b.priority - a.priority : a.pageId - b.pageId);
	let visibleGroupCount = 0;
	for (let g = 0; g < groupCount; g++) visibleGroupCount += visible[g];
	return {
		selectedClusterIds: Uint32Array.from(selected),
		desiredPages,
		pageBenefits: demandShare,
		fineRequired,
		visibleGroupCount,
		fallbackGroupCount: demandedGroups.size,
		renderedTriangleCount,
		selectedMeshletCount: selected.length,
		maximumSelectedErrorPixels,
		maximumUnmetErrorPixels
	};
}
export { selectMeshLoDCpu };

//# sourceMappingURL=mesh-lod-selection-cpu.js.map