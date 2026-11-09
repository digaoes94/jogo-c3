// src/loader-gltf/gltf-feature-xmp.ts
var feature = {
	id: "KHR_xmp_json_ld",
	async applyAsset(_meshes, _root, ctx) {
		const json = ctx._json;
		const packets = json.extensions?.KHR_xmp_json_ld?.packets ?? [];
		const assetPacketIndex = json.asset?.extensions?.KHR_xmp_json_ld?.packet;
		return { xmpMetadata: {
			packets,
			assetPacket: assetPacketIndex !== void 0 ? packets[assetPacketIndex] : void 0
		} };
	}
};
export { feature as default };

//# sourceMappingURL=gltf-feature-xmp.js.map