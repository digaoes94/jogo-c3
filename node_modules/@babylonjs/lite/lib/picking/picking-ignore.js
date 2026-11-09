// src/picking/picking-ignore.ts
function forMesh(ignore, mesh) {
	if (Array.isArray(ignore)) return ignore.find((entry) => entry.mesh === mesh) ?? null;
	return ignore.mesh === mesh ? ignore : null;
}
function prepareIgnoredCandidates(meshes, ignore, filter, advanced) {
	const candidates = [];
	let deformed = false;
	for (const mesh of meshes) {
		const entry = forMesh(ignore, mesh);
		if (mesh.pickable === false || entry && entry.thinInstanceIndex === void 0 && entry.thinInstanceRange === void 0 || filter && !filter(mesh)) continue;
		candidates.push({
			mesh,
			ignore: entry
		});
		deformed ||= !!(mesh.morphTargets || mesh.skeleton);
		advanced ||= !!mesh.vat || !!mesh.thinInstances || !!mesh._gpu._vbLayout?.position || !!mesh.material?._attributeFormats || entry?.thinInstanceIndex !== void 0 || !!entry?.thinInstanceRange;
	}
	return {
		candidates,
		deformed,
		advanced
	};
}
export { prepareIgnoredCandidates };

//# sourceMappingURL=picking-ignore.js.map