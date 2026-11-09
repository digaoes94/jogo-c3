// src/loader-gltf/gltf-ext-lights-image-based.ts
/** Convert glTF `EXT_lights_image_based` SH9 irradiance coefficients into the
*  27-float spherical-polynomial layout `[x,y,z,xx,yy,zz,yz,zx,xy]` that
*  `assembleEnvironmentTextures` → `polynomialToPreScaledHarmonics` expects.
*
*  Mirrors Babylon's chain: `SphericalHarmonics.FromArray(coeffs)` →
*  `scaleInPlace(intensity)` → `convertIrradianceToLambertianRadiance()` (×1/π) →
*  `SphericalPolynomial.FromHarmonics()` (`updateFromHarmonics`, which folds a
*  final ×1/π). All band constants are copied from Babylon `sphericalPolynomial`. */
function irradianceCoefficientsToPolynomial(coeffs, intensity) {
	const s = intensity / Math.PI;
	const poly = /* @__PURE__ */ new Float32Array(27);
	for (let c = 0; c < 3; c++) {
		const l00 = coeffs[0][c] * s;
		const l1_1 = coeffs[1][c] * s;
		const l10 = coeffs[2][c] * s;
		const l11 = coeffs[3][c] * s;
		const l2_2 = coeffs[4][c] * s;
		const l2_1 = coeffs[5][c] * s;
		const l20 = coeffs[6][c] * s;
		const l21 = coeffs[7][c] * s;
		const l22 = coeffs[8][c] * s;
		const k = 1 / Math.PI;
		poly[0 + c] = -1.02333 * l11 * k;
		poly[3 + c] = -1.02333 * l1_1 * k;
		poly[6 + c] = 1.02333 * l10 * k;
		poly[9 + c] = (.886277 * l00 - .247708 * l20 + .429043 * l22) * k;
		poly[12 + c] = (.886277 * l00 - .247708 * l20 - .429043 * l22) * k;
		poly[15 + c] = (.886277 * l00 + .495417 * l20) * k;
		poly[18 + c] = -.858086 * l2_1 * k;
		poly[21 + c] = -.858086 * l21 * k;
		poly[24 + c] = .858086 * l2_2 * k;
	}
	return poly;
}
/** Extract the Y-axis rotation angle (radians) from an image-based-light
*  quaternion. The extension's rotations are pure Y-yaw; Lite drives environment
*  yaw through the scene's internal environment state. Babylon inverts the rotation for its
*  left-handed target scene, so we negate to match its sampling direction. */
function envYawFromQuaternion(q) {
	return -2 * Math.atan2(q[1], q[3]);
}
var feature = {
	id: "EXT_lights_image_based",
	async applyAsset(_meshes, _root, ctx) {
		const json = ctx._json;
		const lights = json.extensions?.EXT_lights_image_based?.lights;
		const lightIdx = (json.scenes?.[json.scene ?? 0])?.extensions?.EXT_lights_image_based?.light;
		if (!lights?.length || lightIdx === void 0) return {};
		const light = lights[lightIdx];
		if (!light?.specularImages?.length || !light.irradianceCoefficients) return {};
		const engine = ctx._engine;
		const specularImageSize = light.specularImageSize;
		const mipCount = light.specularImages.length;
		const flatIndices = light.specularImages.flat();
		const { resolveImage } = await import("./ibl-env-assembly.js");
		const faceImages = await Promise.all(flatIndices.map((imgIdx) => resolveImage(json, ctx._binChunk, imgIdx, ctx._baseUrl)));
		const { uploadCubemapRGBD } = await import("./ibl-cubemap-upload.js");
		const specularCube = uploadCubemapRGBD(engine, faceImages, specularImageSize, mipCount);
		for (const img of faceImages) img.close();
		const { generateBrdfLut } = await import("./ibl-env-assembly.js");
		const brdfLut = generateBrdfLut(engine);
		const intensity = light.intensity ?? 1;
		const irradianceSH = irradianceCoefficientsToPolynomial(light.irradianceCoefficients, intensity);
		const lodGenerationScale = (mipCount - 1) / Math.log2(specularImageSize);
		const { assembleEnvironmentTextures } = await import("./ibl-env-assembly.js");
		const textures = assembleEnvironmentTextures(specularCube, brdfLut, irradianceSH, lodGenerationScale, engine);
		const envRotationY = light.rotation ? envYawFromQuaternion(light.rotation) : 0;
		const { registerEnvSceneUniforms } = await import("./ibl-env-assembly.js");
		const _sceneSetup = (scene) => {
			scene._envTextures = textures;
			if (envRotationY) scene._environmentRotation = envRotationY;
			registerEnvSceneUniforms(scene);
			scene._disposables.push(() => {
				specularCube.destroy();
				brdfLut.destroy();
			});
			scene.imageProcessing.toneMappingEnabled = true;
			scene.imageProcessing.exposure = .8;
			scene.imageProcessing.contrast = 1.2;
		};
		return { _sceneSetup };
	}
};
export { feature as default };

//# sourceMappingURL=gltf-ext-lights-image-based.js.map