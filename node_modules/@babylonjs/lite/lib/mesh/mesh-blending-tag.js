// src/mesh/mesh-blending-tag.ts
/** Radius class encoded in the high two bits of a mesh-blending tag. */
var MeshBlendingRadiusClass = /* @__PURE__ */ function(MeshBlendingRadiusClass) {
	MeshBlendingRadiusClass[MeshBlendingRadiusClass["Small"] = 0] = "Small";
	MeshBlendingRadiusClass[MeshBlendingRadiusClass["Medium"] = 1] = "Medium";
	MeshBlendingRadiusClass[MeshBlendingRadiusClass["Large"] = 2] = "Large";
	MeshBlendingRadiusClass[MeshBlendingRadiusClass["ExtraLarge"] = 3] = "ExtraLarge";
	return MeshBlendingRadiusClass;
}({});
/** Pack a logical group and radius class into the geometry renderer's one-byte tag. */
function packMeshBlendingTag(groupId, radiusClass) {
	if (!Number.isInteger(groupId) || groupId < 0 || groupId > 63) throw new RangeError("Mesh-blending group ID must be an integer between 0 and 63.");
	if (groupId === 0) return 0;
	if (!Number.isInteger(radiusClass) || radiusClass < 0 || radiusClass > 3) throw new RangeError("Mesh-blending radius class must be an integer between 0 and 3.");
	return radiusClass << 6 | groupId;
}
/** Validate and return a packed mesh-blending tag. */
function validatePackedMeshBlendingTag(tag) {
	if (!Number.isInteger(tag) || tag < 0 || tag > 255) throw new RangeError("Mesh-blending tag must be an integer between 0 and 255.");
	if (tag !== 0 && (tag & 63) === 0) throw new RangeError("A nonzero mesh-blending tag must contain a group ID between 1 and 63.");
	return tag;
}
/** Decode a validated packed mesh-blending tag. */
function unpackMeshBlendingTag(tag) {
	const packed = validatePackedMeshBlendingTag(tag);
	return {
		groupId: packed & 63,
		radiusClass: packed >> 6
	};
}
function radiusDefinition(worldRadius, minimumProjectedRadius) {
	let currentWorldRadius = worldRadius;
	let currentMinimumProjectedRadius = minimumProjectedRadius;
	const definition = {};
	Object.defineProperties(definition, {
		worldRadius: {
			enumerable: true,
			get: () => currentWorldRadius,
			set: (value) => {
				if (!Number.isFinite(value) || value < 0) throw new RangeError("Mesh-blending world radii must be finite non-negative numbers.");
				currentWorldRadius = value;
			}
		},
		minimumProjectedRadius: {
			enumerable: true,
			get: () => currentMinimumProjectedRadius,
			set: (value) => {
				if (!Number.isFinite(value) || value < 0) throw new RangeError("Mesh-blending minimum projected radii must be finite non-negative numbers.");
				currentMinimumProjectedRadius = value;
			}
		}
	});
	return definition;
}
/** Create Babylon-compatible defaults for all four packed radius classes. */
function createDefaultMeshBlendRadiusDefinitions() {
	return Object.freeze([
		radiusDefinition(.06, 1.5),
		radiusDefinition(.1, 3),
		radiusDefinition(.2, 3),
		radiusDefinition(.3, 5)
	]);
}
/** Resolve the tag owned by a mesh. Thin instances use their draw-owning mesh's tag. */
function resolveMeshBlendingTag(mesh) {
	return validatePackedMeshBlendingTag(mesh.meshBlendingTag ?? 0);
}
export { MeshBlendingRadiusClass, createDefaultMeshBlendRadiusDefinitions, packMeshBlendingTag, resolveMeshBlendingTag, unpackMeshBlendingTag, validatePackedMeshBlendingTag };

//# sourceMappingURL=mesh-blending-tag.js.map