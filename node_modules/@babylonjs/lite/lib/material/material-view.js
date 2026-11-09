// src/material/material-view.ts
/** Create a material view that references source state and overrides render features exactly. */
function createMaterialView(source, renderFeatures) {
	const src = getMaterialSource(source);
	return Object.create(src, {
		source: {
			value: src,
			enumerable: true
		},
		_renderFeatures: {
			value: {
				features: renderFeatures.features,
				features2: renderFeatures.features2
			},
			writable: true,
			enumerable: true,
			configurable: true
		}
	});
}
function isMaterialView(material) {
	const maybeView = material;
	return !!maybeView.source && !!maybeView._renderFeatures;
}
function getMaterialSource(material) {
	return isMaterialView(material) ? material.source : material;
}
export { createMaterialView, getMaterialSource, isMaterialView };

//# sourceMappingURL=material-view.js.map