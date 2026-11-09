// src/shader/fragments/skeleton-fragment.ts
var STAGE_VERTEX = 1;
/** Bone-matrix texture reader. Shared verbatim with the GPU picker's deformation projection so a pick
*  resolves bones exactly the way the render path does. */
var SKELETON_HELPERS = `fn readMatrixFromRawSampler(smp:texture_2d<f32>,index:f32)->mat4x4<f32>{let offset=i32(index)*4;let m0=textureLoad(smp,vec2<i32>(offset+0,0),0);let m1=textureLoad(smp,vec2<i32>(offset+1,0),0);let m2=textureLoad(smp,vec2<i32>(offset+2,0),0);let m3=textureLoad(smp,vec2<i32>(offset+3,0),0);return mat4x4f(m0,m1,m2,m3);}`;
/** Emit the bone-blend body. Assigns `finalWorld` from `worldExpr` and the accumulated influence, so
*  callers must have `finalWorld` in scope. `worldExpr` names the mesh world matrix in the consuming
*  shader — the render path and the picker's regular/detailed variants use `mesh.world`, while the
*  picker's thin-instance variant uses the per-instance `world`. */
function makeSkinningCode(has8Bones, worldExpr = "mesh.world") {
	return `${makeBoneInfluenceCode(has8Bones)} finalWorld= ${worldExpr} *influence;`;
}
/** @internal Shared current/previous bone blend, preserving influence order. */
function makeBoneInfluenceCode(has8Bones, sampler = "boneSampler", variable = "influence") {
	let code = `var ${variable}:mat4x4<f32> =readMatrixFromRawSampler(${sampler},f32(joints[0]))*weights[0];${variable} = ${variable} +readMatrixFromRawSampler(${sampler},f32(joints[1]))*weights[1];${variable} = ${variable} +readMatrixFromRawSampler(${sampler},f32(joints[2]))*weights[2];${variable} = ${variable} +readMatrixFromRawSampler(${sampler},f32(joints[3]))*weights[3];`;
	if (has8Bones) code = `${code} ${variable} = ${variable} +readMatrixFromRawSampler(${sampler},f32(joints1[0]))*weights1[0];${variable} = ${variable} +readMatrixFromRawSampler(${sampler},f32(joints1[1]))*weights1[1];${variable} = ${variable} +readMatrixFromRawSampler(${sampler},f32(joints1[2]))*weights1[2];${variable} = ${variable} +readMatrixFromRawSampler(${sampler},f32(joints1[3]))*weights1[3];`;
	return code;
}
/** Create the shared skeletal skinning shader fragment. */
function createSkeletonFragment(has8Bones) {
	return {
		_id: "skeleton",
		_vertexAttributes: [
			{
				_name: "joints",
				_type: "vec4<u32>",
				_gpuFormat: "uint32x4",
				_arrayStride: 16
			},
			{
				_name: "weights",
				_type: "vec4<f32>",
				_gpuFormat: "float32x4",
				_arrayStride: 16
			},
			...has8Bones ? [{
				_name: "joints1",
				_type: "vec4<u32>",
				_gpuFormat: "uint32x4",
				_arrayStride: 16
			}, {
				_name: "weights1",
				_type: "vec4<f32>",
				_gpuFormat: "float32x4",
				_arrayStride: 16
			}] : []
		],
		_vertexBindings: [{
			_name: "boneSampler",
			_type: {
				_kind: "texture",
				_textureType: "texture_2d<f32>",
				_sampleType: "unfilterable-float"
			},
			_visibility: STAGE_VERTEX
		}],
		_vertexHelperFunctions: SKELETON_HELPERS,
		_vertexSlots: { VW: makeSkinningCode(has8Bones) }
	};
}
export { SKELETON_HELPERS, createSkeletonFragment, makeBoneInfluenceCode, makeSkinningCode };

//# sourceMappingURL=skeleton-fragment.js.map