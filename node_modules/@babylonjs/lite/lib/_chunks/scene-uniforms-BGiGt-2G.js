// src/shader/scene-uniforms.ts
/** Canonical SceneUniforms — TS counterpart to `shaders/scene-uniforms.wgsl`.
*
*  Only the size + the WGSL source are exported. Per-field byte offsets are
*  hard-coded inline at every write site (see `frame-graph/render-task.ts` and the
*  light extensions). If the WGSL struct changes, update those offsets. */
/** Canonical WGSL declaration of the SceneUniforms struct + group(0) binding.
*  Prepend to any standalone shader (skybox, ground, etc.) that samples the
*  per-pass scene UBO. The composer-driven materials (std + pbr) inject this
*  same string into their shader templates via the `/*SU* /` slot. */
var SCENE_UBO_WGSL = "struct a{viewProjection:mat4x4<f32>,view:mat4x4<f32>,vEyePosition:vec4<f32>,envRotationY:f32,_envPad0:f32,_envPad1:f32,_envPad2:f32,vSphericalL00:vec4<f32>,vSphericalL1_1:vec4<f32>,vSphericalL10:vec4<f32>,vSphericalL11:vec4<f32>,vSphericalL2_2:vec4<f32>,vSphericalL2_1:vec4<f32>,vSphericalL20:vec4<f32>,vSphericalL21:vec4<f32>,vSphericalL22:vec4<f32>,vImageInfos:vec4<f32>,vFogInfos:vec4<f32>,vFogColor:vec4<f32>,clipPlane:vec4<f32>}@group(0) @binding(0) var<uniform> scene:a;";
export { SCENE_UBO_WGSL as t };

//# sourceMappingURL=scene-uniforms-BGiGt-2G.js.map