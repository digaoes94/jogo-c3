// src/material/node/node-blocks.ts
/** Lazily loaded AddBlock implementation. */
var nodeAddBlock = {
	className: "AddBlock",
	_load: async () => (await import("./blocks/add-block.js")).emitter
};
/** Lazily loaded AmbientOcclusionBlock implementation. */
var nodeAmbientOcclusionBlock = {
	className: "AmbientOcclusionBlock",
	_load: async () => (await import("./blocks/ambient-occlusion-block.js")).emitter
};
/** Lazily loaded AnisotropyBlock implementation. */
var nodeAnisotropyBlock = {
	className: "AnisotropyBlock",
	_load: async () => (await import("./blocks/anisotropy-block.js")).emitter
};
/** Lazily loaded ArcTan2Block implementation. */
var nodeArcTan2Block = {
	className: "ArcTan2Block",
	_load: async () => (await import("./blocks/arc-tan2-block.js")).emitter
};
/** Lazily loaded BiPlanarBlock implementation. */
var nodeBiPlanarBlock = {
	className: "BiPlanarBlock",
	_load: async () => (await import("./blocks/biplanar-block.js")).emitter
};
/** Lazily loaded BonesBlock implementation. */
var nodeBonesBlock = {
	className: "BonesBlock",
	_load: async () => (await import("./blocks/bones-block.js")).emitter
};
/** Lazily loaded ClampBlock implementation. */
var nodeClampBlock = {
	className: "ClampBlock",
	_load: async () => (await import("./blocks/clamp-block.js")).emitter
};
/** Lazily loaded ClearCoatBlock implementation. */
var nodeClearCoatBlock = {
	className: "ClearCoatBlock",
	_load: async () => (await import("./blocks/clearcoat-block.js")).emitter
};
/** Lazily loaded ClipPlanesBlock implementation. */
var nodeClipPlanesBlock = {
	className: "ClipPlanesBlock",
	_load: async () => (await import("./blocks/clip-planes-block.js")).emitter
};
/** Lazily loaded CloudBlock implementation. */
var nodeCloudBlock = {
	className: "CloudBlock",
	_load: async () => (await import("./blocks/cloud-block.js")).emitter
};
/** Lazily loaded ColorConverterBlock implementation. */
var nodeColorConverterBlock = {
	className: "ColorConverterBlock",
	_load: async () => (await import("./blocks/color-converter-block.js")).emitter
};
/** Lazily loaded ColorMergerBlock implementation. */
var nodeColorMergerBlock = {
	className: "ColorMergerBlock",
	_load: async () => (await import("./blocks/color-merger.js")).emitter
};
/** Lazily loaded ColorSplitterBlock implementation. */
var nodeColorSplitterBlock = {
	className: "ColorSplitterBlock",
	_load: async () => (await import("./blocks/color-splitter.js")).emitter
};
/** Lazily loaded ConditionalBlock implementation. */
var nodeConditionalBlock = {
	className: "ConditionalBlock",
	_load: async () => (await import("./blocks/conditional-block.js")).emitter
};
/** Lazily loaded CrossBlock implementation. */
var nodeCrossBlock = {
	className: "CrossBlock",
	_load: async () => (await import("./blocks/cross-block.js")).emitter
};
/** Lazily loaded CurveBlock implementation. */
var nodeCurveBlock = {
	className: "CurveBlock",
	_load: async () => (await import("./blocks/curve-block.js")).emitter
};
/** Lazily loaded DerivativeBlock implementation. */
var nodeDerivativeBlock = {
	className: "DerivativeBlock",
	_load: async () => (await import("./blocks/derivative-block.js")).emitter
};
/** Lazily loaded DesaturateBlock implementation. */
var nodeDesaturateBlock = {
	className: "DesaturateBlock",
	_load: async () => (await import("./blocks/desaturate-block.js")).emitter
};
/** Lazily loaded DiscardBlock implementation. */
var nodeDiscardBlock = {
	className: "DiscardBlock",
	_load: async () => (await import("./blocks/discard-block.js")).emitter
};
/** Lazily loaded DistanceBlock implementation. */
var nodeDistanceBlock = {
	className: "DistanceBlock",
	_load: async () => (await import("./blocks/distance-block.js")).emitter
};
/** Lazily loaded DivideBlock implementation. */
var nodeDivideBlock = {
	className: "DivideBlock",
	_load: async () => (await import("./blocks/divide-block.js")).emitter
};
/** Lazily loaded DotBlock implementation. */
var nodeDotBlock = {
	className: "DotBlock",
	_load: async () => (await import("./blocks/dot-block.js")).emitter
};
/** Lazily loaded ElbowBlock implementation. */
var nodeElbowBlock = {
	className: "ElbowBlock",
	_load: async () => (await import("./blocks/elbow-block.js")).emitter
};
/** Lazily loaded FogBlock implementation. */
var nodeFogBlock = {
	className: "FogBlock",
	_load: async () => (await import("./blocks/fog-block.js")).emitter
};
/** Lazily loaded FragCoordBlock implementation. */
var nodeFragCoordBlock = {
	className: "FragCoordBlock",
	_load: async () => (await import("./blocks/frag-coord-block.js")).emitter
};
/** Lazily loaded FragDepthBlock implementation. */
var nodeFragDepthBlock = {
	className: "FragDepthBlock",
	_load: async () => (await import("./blocks/frag-depth-block.js")).emitter
};
/** Lazily loaded FragmentOutputBlock implementation. */
var nodeFragmentOutputBlock = {
	className: "FragmentOutputBlock",
	_load: async () => (await import("./blocks/fragment-output.js")).emitter
};
/** Lazily loaded FresnelBlock implementation. */
var nodeFresnelBlock = {
	className: "FresnelBlock",
	_load: async () => (await import("./blocks/fresnel-block.js")).emitter
};
/** Lazily loaded FrontFacingBlock implementation. */
var nodeFrontFacingBlock = {
	className: "FrontFacingBlock",
	_load: async () => (await import("./blocks/front-facing.js")).emitter
};
/** Lazily loaded GeometryTextureOutputBlock implementation. */
var nodeGeometryTextureOutputBlock = {
	className: "GeometryTextureOutputBlock",
	_load: async () => (await import("./blocks/geometry-texture-output.js")).emitter
};
/** Lazily loaded GradientBlock implementation. */
var nodeGradientBlock = {
	className: "GradientBlock",
	_load: async () => (await import("./blocks/gradient-block.js")).emitter
};
/** Lazily loaded HeightToNormalBlock implementation. */
var nodeHeightToNormalBlock = {
	className: "HeightToNormalBlock",
	_load: async () => (await import("./blocks/height-to-normal-block.js")).emitter
};
/** Lazily loaded ImageProcessingBlock implementation. */
var nodeImageProcessingBlock = {
	className: "ImageProcessingBlock",
	_load: async () => (await import("./blocks/image-processing-block.js")).emitter
};
/** Lazily loaded ImageSourceBlock implementation. */
var nodeImageSourceBlock = {
	className: "ImageSourceBlock",
	_load: async () => (await import("./blocks/image-source.js")).emitter
};
/** Lazily loaded InputBlock implementation. */
var nodeInputBlock = {
	className: "InputBlock",
	_load: async () => (await import("./blocks/input-block.js")).emitter
};
/** Lazily loaded InstancesBlock implementation. */
var nodeInstancesBlock = {
	className: "InstancesBlock",
	_load: async () => (await import("./blocks/instances-block.js")).emitter
};
/** Lazily loaded IridescenceBlock implementation. */
var nodeIridescenceBlock = {
	className: "IridescenceBlock",
	_load: async () => (await import("./blocks/iridescence-block.js")).emitter
};
/** Lazily loaded LengthBlock implementation. */
var nodeLengthBlock = {
	className: "LengthBlock",
	_load: async () => (await import("./blocks/length-block.js")).emitter
};
/** Lazily loaded LerpBlock implementation. */
var nodeLerpBlock = {
	className: "LerpBlock",
	_load: async () => (await import("./blocks/lerp-block.js")).emitter
};
/** Lazily loaded LightBlock implementation. */
var nodeLightBlock = {
	className: "LightBlock",
	_load: async () => (await import("./blocks/light-block.js")).emitter
};
/** Lazily loaded LightInformationBlock implementation. */
var nodeLightInformationBlock = {
	className: "LightInformationBlock",
	_load: async () => (await import("./blocks/light-information.js")).emitter
};
/** Lazily loaded LoopBlock implementation. */
var nodeLoopBlock = {
	className: "LoopBlock",
	_load: async () => (await import("./blocks/loop-block.js")).emitter
};
/** Lazily loaded MatrixBuilder implementation. */
var nodeMatrixBuilder = {
	className: "MatrixBuilder",
	_load: async () => (await import("./blocks/matrix-blocks.js")).emitter
};
/** Lazily loaded MatrixDeterminantBlock implementation. */
var nodeMatrixDeterminantBlock = {
	className: "MatrixDeterminantBlock",
	_load: async () => (await import("./blocks/matrix-blocks.js")).emitter
};
/** Lazily loaded MatrixSplitterBlock implementation. */
var nodeMatrixSplitterBlock = {
	className: "MatrixSplitterBlock",
	_load: async () => (await import("./blocks/matrix-blocks.js")).emitter
};
/** Lazily loaded MatrixTransposeBlock implementation. */
var nodeMatrixTransposeBlock = {
	className: "MatrixTransposeBlock",
	_load: async () => (await import("./blocks/matrix-blocks.js")).emitter
};
/** Lazily loaded MaxBlock implementation. */
var nodeMaxBlock = {
	className: "MaxBlock",
	_load: async () => (await import("./blocks/max-block.js")).emitter
};
/** Lazily loaded MeshAttributeExistsBlock implementation. */
var nodeMeshAttributeExistsBlock = {
	className: "MeshAttributeExistsBlock",
	_load: async () => (await import("./blocks/mesh-attribute-exists-block.js")).emitter
};
/** Lazily loaded MinBlock implementation. */
var nodeMinBlock = {
	className: "MinBlock",
	_load: async () => (await import("./blocks/min-block.js")).emitter
};
/** Lazily loaded ModBlock implementation. */
var nodeModBlock = {
	className: "ModBlock",
	_load: async () => (await import("./blocks/mod-block.js")).emitter
};
/** Lazily loaded MorphTargetsBlock implementation. */
var nodeMorphTargetsBlock = {
	className: "MorphTargetsBlock",
	_load: async () => (await import("./blocks/morph-targets.js")).emitter
};
/** Lazily loaded MultiplyBlock implementation. */
var nodeMultiplyBlock = {
	className: "MultiplyBlock",
	_load: async () => (await import("./blocks/multiply-block.js")).emitter
};
/** Lazily loaded NegateBlock implementation. */
var nodeNegateBlock = {
	className: "NegateBlock",
	_load: async () => (await import("./blocks/negate-block.js")).emitter
};
/** Lazily loaded NLerpBlock implementation. */
var nodeNLerpBlock = {
	className: "NLerpBlock",
	_load: async () => (await import("./blocks/nlerp-block.js")).emitter
};
/** Lazily loaded NodeMaterialDebugBlock implementation. */
var nodeDebugBlock = {
	className: "NodeMaterialDebugBlock",
	_load: async () => (await import("./blocks/debug-block.js")).emitter
};
/** Lazily loaded NodeMaterialTeleportInBlock implementation. */
var nodeTeleportInBlock = {
	className: "NodeMaterialTeleportInBlock",
	_load: async () => (await import("./blocks/teleport-in-block.js")).emitter
};
/** Lazily loaded NodeMaterialTeleportOutBlock implementation. */
var nodeTeleportOutBlock = {
	className: "NodeMaterialTeleportOutBlock",
	_load: async () => (await import("./blocks/teleport-out-block.js")).emitter
};
/** Lazily loaded NormalBlendBlock implementation. */
var nodeNormalBlendBlock = {
	className: "NormalBlendBlock",
	_load: async () => (await import("./blocks/normal-blend-block.js")).emitter
};
/** Lazily loaded NormalizeBlock implementation. */
var nodeNormalizeBlock = {
	className: "NormalizeBlock",
	_load: async () => (await import("./blocks/normalize-block.js")).emitter
};
/** Lazily loaded OneMinusBlock implementation. */
var nodeOneMinusBlock = {
	className: "OneMinusBlock",
	_load: async () => (await import("./blocks/oneminus-block.js")).emitter
};
/** Lazily loaded OppositeBlock implementation. */
var nodeOppositeBlock = {
	className: "OppositeBlock",
	_load: async () => (await import("./blocks/opposite-block.js")).emitter
};
/** Lazily loaded PannerBlock implementation. */
var nodePannerBlock = {
	className: "PannerBlock",
	_load: async () => (await import("./blocks/panner-block.js")).emitter
};
/** Lazily loaded PBRMetallicRoughnessBlock implementation. */
var nodePbrMetallicRoughnessBlock = {
	className: "PBRMetallicRoughnessBlock",
	_load: async () => (await import("./blocks/pbr-metallic-roughness-block.js")).emitter
};
/** Lazily loaded PBRMetallicRoughnessBlock__full implementation. */
var nodePbrMetallicRoughnessBlockFull = {
	className: "PBRMetallicRoughnessBlock",
	_load: async () => (await import("./blocks/pbr-metallic-roughness-block-full.js")).emitter
};
/** Lazily loaded PerturbNormalBlock implementation. */
var nodePerturbNormalBlock = {
	className: "PerturbNormalBlock",
	_load: async () => (await import("./blocks/perturb-normal.js")).emitter
};
/** Lazily loaded PosterizeBlock implementation. */
var nodePosterizeBlock = {
	className: "PosterizeBlock",
	_load: async () => (await import("./blocks/posterize-block.js")).emitter
};
/** Lazily loaded PowBlock implementation. */
var nodePowBlock = {
	className: "PowBlock",
	_load: async () => (await import("./blocks/pow-block.js")).emitter
};
/** Lazily loaded RandomNumberBlock implementation. */
var nodeRandomNumberBlock = {
	className: "RandomNumberBlock",
	_load: async () => (await import("./blocks/random-number-block.js")).emitter
};
/** Lazily loaded ReciprocalBlock implementation. */
var nodeReciprocalBlock = {
	className: "ReciprocalBlock",
	_load: async () => (await import("./blocks/reciprocal-block.js")).emitter
};
/** Lazily loaded ReflectBlock implementation. */
var nodeReflectBlock = {
	className: "ReflectBlock",
	_load: async () => (await import("./blocks/reflect-block.js")).emitter
};
/** Lazily loaded ReflectionBlock implementation. */
var nodeReflectionBlock = {
	className: "ReflectionBlock",
	_load: async () => (await import("./blocks/reflection-block.js")).emitter
};
/** Lazily loaded ReflectionTextureBaseBlock implementation. */
var nodeReflectionTextureBaseBlock = {
	className: "ReflectionTextureBaseBlock",
	_load: async () => (await import("./blocks/reflection-texture-base-block.js")).emitter
};
/** Lazily loaded ReflectionTextureBlock implementation. */
var nodeReflectionTextureBlock = {
	className: "ReflectionTextureBlock",
	_load: async () => (await import("./blocks/reflection-texture-block.js")).emitter
};
/** Lazily loaded RefractBlock implementation. */
var nodeRefractBlock = {
	className: "RefractBlock",
	_load: async () => (await import("./blocks/refract-block.js")).emitter
};
/** Lazily loaded RefractionBlock implementation. */
var nodeRefractionBlock = {
	className: "RefractionBlock",
	_load: async () => (await import("./blocks/refraction-block.js")).emitter
};
/** Lazily loaded RemapBlock implementation. */
var nodeRemapBlock = {
	className: "RemapBlock",
	_load: async () => (await import("./blocks/remap-block.js")).emitter
};
/** Lazily loaded ReplaceColorBlock implementation. */
var nodeReplaceColorBlock = {
	className: "ReplaceColorBlock",
	_load: async () => (await import("./blocks/replace-color-block.js")).emitter
};
/** Lazily loaded Rotate2dBlock implementation. */
var nodeRotate2dBlock = {
	className: "Rotate2dBlock",
	_load: async () => (await import("./blocks/rotate2d-block.js")).emitter
};
/** Lazily loaded ScaleBlock implementation. */
var nodeScaleBlock = {
	className: "ScaleBlock",
	_load: async () => (await import("./blocks/scale-block.js")).emitter
};
/** Lazily loaded ScreenSizeBlock implementation. */
var nodeScreenSizeBlock = {
	className: "ScreenSizeBlock",
	_load: async () => (await import("./blocks/screen-size-block.js")).emitter
};
/** Lazily loaded ScreenSpaceBlock implementation. */
var nodeScreenSpaceBlock = {
	className: "ScreenSpaceBlock",
	_load: async () => (await import("./blocks/screen-space-block.js")).emitter
};
/** Lazily loaded ShadowMapBlock implementation. */
var nodeShadowMapBlock = {
	className: "ShadowMapBlock",
	_load: async () => (await import("./blocks/shadow-map.js")).emitter
};
/** Lazily loaded SheenBlock implementation. */
var nodeSheenBlock = {
	className: "SheenBlock",
	_load: async () => (await import("./blocks/sheen-block.js")).emitter
};
/** Lazily loaded SimplexPerlin3DBlock implementation. */
var nodeSimplexPerlin3DBlock = {
	className: "SimplexPerlin3DBlock",
	_load: async () => (await import("./blocks/simplex-perlin-3d-block.js")).emitter
};
/** Lazily loaded SmoothStepBlock implementation. */
var nodeSmoothStepBlock = {
	className: "SmoothStepBlock",
	_load: async () => (await import("./blocks/smoothstep-block.js")).emitter
};
/** Lazily loaded StepBlock implementation. */
var nodeStepBlock = {
	className: "StepBlock",
	_load: async () => (await import("./blocks/step-block.js")).emitter
};
/** Lazily loaded StorageReadBlock implementation. */
var nodeStorageReadBlock = {
	className: "StorageReadBlock",
	_load: async () => (await import("./blocks/storage-read-block.js")).emitter
};
/** Lazily loaded StorageWriteBlock implementation. */
var nodeStorageWriteBlock = {
	className: "StorageWriteBlock",
	_load: async () => (await import("./blocks/storage-write-block.js")).emitter
};
/** Lazily loaded SubSurfaceBlock implementation. */
var nodeSubSurfaceBlock = {
	className: "SubSurfaceBlock",
	_load: async () => (await import("./blocks/subsurface-block.js")).emitter
};
/** Lazily loaded SubtractBlock implementation. */
var nodeSubtractBlock = {
	className: "SubtractBlock",
	_load: async () => (await import("./blocks/subtract-block.js")).emitter
};
/** Lazily loaded TBNBlock implementation. */
var nodeTBNBlock = {
	className: "TBNBlock",
	_load: async () => (await import("./blocks/tbn-block.js")).emitter
};
/** Lazily loaded TextureBlock implementation. */
var nodeTextureBlock = {
	className: "TextureBlock",
	_load: async () => (await import("./blocks/texture-block.js")).emitter
};
/** Lazily loaded TransformBlock implementation. */
var nodeTransformBlock = {
	className: "TransformBlock",
	_load: async () => (await import("./blocks/transform-block.js")).emitter
};
/** Lazily loaded TrigonometryBlock implementation. */
var nodeTrigonometryBlock = {
	className: "TrigonometryBlock",
	_load: async () => (await import("./blocks/trigonometry-block.js")).emitter
};
/** Lazily loaded TriPlanarBlock implementation. */
var nodeTriPlanarBlock = {
	className: "TriPlanarBlock",
	_load: async () => (await import("./blocks/triplanar-block.js")).emitter
};
/** Lazily loaded TwirlBlock implementation. */
var nodeTwirlBlock = {
	className: "TwirlBlock",
	_load: async () => (await import("./blocks/twirl-block.js")).emitter
};
/** Lazily loaded VectorMergerBlock implementation. */
var nodeVectorMergerBlock = {
	className: "VectorMergerBlock",
	_load: async () => (await import("./blocks/vector-merger.js")).emitter
};
/** Lazily loaded VectorSplitterBlock implementation. */
var nodeVectorSplitterBlock = {
	className: "VectorSplitterBlock",
	_load: async () => (await import("./blocks/vector-splitter.js")).emitter
};
/** Lazily loaded VertexOutputBlock implementation. */
var nodeVertexOutputBlock = {
	className: "VertexOutputBlock",
	_load: async () => (await import("./blocks/vertex-output.js")).emitter
};
/** Lazily loaded ViewDirectionBlock implementation. */
var nodeViewDirectionBlock = {
	className: "ViewDirectionBlock",
	_load: async () => (await import("./blocks/view-direction.js")).emitter
};
/** Lazily loaded VoronoiNoiseBlock implementation. */
var nodeVoronoiNoiseBlock = {
	className: "VoronoiNoiseBlock",
	_load: async () => (await import("./blocks/voronoi-noise-block.js")).emitter
};
/** Lazily loaded WaveBlock implementation. */
var nodeWaveBlock = {
	className: "WaveBlock",
	_load: async () => (await import("./blocks/wave-block.js")).emitter
};
/** Lazily loaded WorleyNoise3DBlock implementation. */
var nodeWorleyNoise3DBlock = {
	className: "WorleyNoise3DBlock",
	_load: async () => (await import("./blocks/worley-noise-3d-block.js")).emitter
};
export { nodeAddBlock, nodeAmbientOcclusionBlock, nodeAnisotropyBlock, nodeArcTan2Block, nodeBiPlanarBlock, nodeBonesBlock, nodeClampBlock, nodeClearCoatBlock, nodeClipPlanesBlock, nodeCloudBlock, nodeColorConverterBlock, nodeColorMergerBlock, nodeColorSplitterBlock, nodeConditionalBlock, nodeCrossBlock, nodeCurveBlock, nodeDebugBlock, nodeDerivativeBlock, nodeDesaturateBlock, nodeDiscardBlock, nodeDistanceBlock, nodeDivideBlock, nodeDotBlock, nodeElbowBlock, nodeFogBlock, nodeFragCoordBlock, nodeFragDepthBlock, nodeFragmentOutputBlock, nodeFresnelBlock, nodeFrontFacingBlock, nodeGeometryTextureOutputBlock, nodeGradientBlock, nodeHeightToNormalBlock, nodeImageProcessingBlock, nodeImageSourceBlock, nodeInputBlock, nodeInstancesBlock, nodeIridescenceBlock, nodeLengthBlock, nodeLerpBlock, nodeLightBlock, nodeLightInformationBlock, nodeLoopBlock, nodeMatrixBuilder, nodeMatrixDeterminantBlock, nodeMatrixSplitterBlock, nodeMatrixTransposeBlock, nodeMaxBlock, nodeMeshAttributeExistsBlock, nodeMinBlock, nodeModBlock, nodeMorphTargetsBlock, nodeMultiplyBlock, nodeNLerpBlock, nodeNegateBlock, nodeNormalBlendBlock, nodeNormalizeBlock, nodeOneMinusBlock, nodeOppositeBlock, nodePannerBlock, nodePbrMetallicRoughnessBlock, nodePbrMetallicRoughnessBlockFull, nodePerturbNormalBlock, nodePosterizeBlock, nodePowBlock, nodeRandomNumberBlock, nodeReciprocalBlock, nodeReflectBlock, nodeReflectionBlock, nodeReflectionTextureBaseBlock, nodeReflectionTextureBlock, nodeRefractBlock, nodeRefractionBlock, nodeRemapBlock, nodeReplaceColorBlock, nodeRotate2dBlock, nodeScaleBlock, nodeScreenSizeBlock, nodeScreenSpaceBlock, nodeShadowMapBlock, nodeSheenBlock, nodeSimplexPerlin3DBlock, nodeSmoothStepBlock, nodeStepBlock, nodeStorageReadBlock, nodeStorageWriteBlock, nodeSubSurfaceBlock, nodeSubtractBlock, nodeTBNBlock, nodeTeleportInBlock, nodeTeleportOutBlock, nodeTextureBlock, nodeTransformBlock, nodeTriPlanarBlock, nodeTrigonometryBlock, nodeTwirlBlock, nodeVectorMergerBlock, nodeVectorSplitterBlock, nodeVertexOutputBlock, nodeViewDirectionBlock, nodeVoronoiNoiseBlock, nodeWaveBlock, nodeWorleyNoise3DBlock };

//# sourceMappingURL=node-blocks.js.map