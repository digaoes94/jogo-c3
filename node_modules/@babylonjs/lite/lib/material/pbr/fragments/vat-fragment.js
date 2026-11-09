import "../../mesh-features.js";
// src/material/pbr/fragments/vat-fragment.ts
var STAGE_VERTEX = 1;
var VAT_HELPERS = `struct vatUniforms{params:vec4<f32>,clock:vec4<f32>,}fn readMatrixFromVat(smp:texture_2d<f32>,index:f32,row:i32)->mat4x4<f32>{let o=i32(index)*4;let m0=textureLoad(smp,vec2<i32>(o+0,row),0);let m1=textureLoad(smp,vec2<i32>(o+1,row),0);let m2=textureLoad(smp,vec2<i32>(o+2,row),0);let m3=textureLoad(smp,vec2<i32>(o+3,row),0);return mat4x4f(m0,m1,m2,m3);}fn vatFrameRow(p:vec4<f32>,t:f32)->i32{let span=max(1.0,p.y-p.x+1.0);let raw=p.z+t*p.w;let wrapped=raw-floor(raw/span)*span;return i32(p.x+wrapped);}`;
/** WGSL summing the 4- (or 8-) bone skin matrix for one frame `row` into a new matrix var `dest`. */
function vatSkinSum(dest, row, has8Bones) {
	let s = `var ${dest}:mat4x4<f32> =readMatrixFromVat(vatSampler,f32(joints[0]),${row})*weights[0];${dest} = ${dest} +readMatrixFromVat(vatSampler,f32(joints[1]),${row})*weights[1];${dest} = ${dest} +readMatrixFromVat(vatSampler,f32(joints[2]),${row})*weights[2];${dest} = ${dest} +readMatrixFromVat(vatSampler,f32(joints[3]),${row})*weights[3];`;
	if (has8Bones) s = `${s} ${dest} = ${dest} +readMatrixFromVat(vatSampler,f32(joints1[0]),${row})*weights1[0];${dest} = ${dest} +readMatrixFromVat(vatSampler,f32(joints1[1]),${row})*weights1[1];${dest} = ${dest} +readMatrixFromVat(vatSampler,f32(joints1[2]),${row})*weights1[2];${dest} = ${dest} +readMatrixFromVat(vatSampler,f32(joints1[3]),${row})*weights1[3];`;
	return s;
}
var VAT_INSTANCE_PLACEMENT = `let vatInstWorld=mat4x4<f32>(world0,world1,world2,world3);finalWorld=vatInstWorld*mesh.world*influence;`;
function vatRegularInfluence(has8Bones) {
	return `let vatRow=vatFrameRow(vat.params,vat.clock.x);${vatSkinSum("influence", "vatRow", has8Bones)}`;
}
function vatInstancedInfluence(has8Bones, instanceIndex, storage = false) {
	return `${storage ? `let vatIdx= ${instanceIndex} *2u;let vatA=vatInstanceStorage[vatIdx];let vatB=vatInstanceStorage[vatIdx+1u];` : `let vatIdx=i32(${instanceIndex})*2;let vatA=textureLoad(vatInstanceTex,vec2<i32>(vatIdx,0),0);let vatB=textureLoad(vatInstanceTex,vec2<i32>(vatIdx+1,0),0);`} let rowA=vatFrameRow(vatA,vat.clock.x);let rowB=vatFrameRow(vec4f(vatB.x,vatB.y,vatA.z,vatB.w),vat.clock.x);${vatSkinSum("infA", "rowA", has8Bones)} ${vatSkinSum("infB", "rowB", has8Bones)} var influence:mat4x4f=infA*(1.0-vatB.z)+infB*vatB.z;`;
}
function makeVatSkinningCode(has8Bones, instanced) {
	if (!instanced) return `${vatRegularInfluence(has8Bones)} finalWorld=mesh.world*influence;`;
	return `${vatInstancedInfluence(has8Bones, "vatInstanceIndex")} ${VAT_INSTANCE_PLACEMENT}`;
}
/** @internal VAT-owned shader projection reused by the GPU picker so its mesh pass deforms the
*  exact same vertices, with the exact same transform order, as the visible material. */
function createVatPickProjectionWgsl(has8Bones, instanceStorage = false) {
	return {
		helpers: VAT_HELPERS,
		regularBody: `${vatRegularInfluence(has8Bones)} let projectedTransform=mesh.world*influence;let projectedWorld=(projectedTransform*vec4f(position,1.0)).xyz;`,
		thinBody: `${vatInstancedInfluence(has8Bones, "instanceIndex", instanceStorage)} let projectedTransform=instanceWorld*tiMesh.world*influence;let projectedWorld=(projectedTransform*vec4f(position,1.0)).xyz;`
	};
}
/**
* Create a VAT fragment.
* @param has8Bones - Whether to use 8-bone skinning (joints1/weights1).
* @param instanced - Whether the mesh is thin-instanced; if so each instance reads its own frame(s) from
*                    instanceTexture by instance_index (always the dual-clip path, single-clip = blend 0).
*/
function createVatFragment(has8Bones, instanced) {
	return {
		_id: "vat",
		_dependencies: instanced ? ["thin-instance"] : void 0,
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
		_vertexBindings: [
			{
				_name: "vatSampler",
				_type: {
					_kind: "texture",
					_textureType: "texture_2d<f32>",
					_sampleType: "unfilterable-float"
				},
				_visibility: STAGE_VERTEX
			},
			{
				_name: "vat",
				_type: { _kind: "uniform-buffer" },
				_visibility: STAGE_VERTEX
			},
			...instanced ? [{
				_name: "vatInstanceTex",
				_type: {
					_kind: "texture",
					_textureType: "texture_2d<f32>",
					_sampleType: "unfilterable-float"
				},
				_visibility: STAGE_VERTEX
			}] : []
		],
		_vertexBuiltins: instanced ? [{
			_name: "vatInstanceIndex",
			_builtin: "instance_index",
			_type: "u32"
		}] : void 0,
		_vertexHelperFunctions: VAT_HELPERS,
		_vertexSlots: { VW: makeVatSkinningCode(has8Bones, instanced) }
	};
}
var pbrExt = {
	id: "vat",
	phase: "vertex",
	frag(ctx) {
		if (!(ctx._meshFeatures & 512)) return null;
		return createVatFragment((ctx._meshFeatures & 4) !== 0, (ctx._meshFeatures & 16) !== 0);
	},
	bind(ctx, entries, b) {
		const mesh = ctx._mesh;
		if (!(ctx._meshFeatures & 512) || !mesh?.vat) return b;
		entries.push({
			binding: b++,
			resource: mesh.vat.texture.createView()
		});
		entries.push({
			binding: b++,
			resource: { buffer: mesh.vat.settingsBuffer }
		});
		if (ctx._meshFeatures & 16 && mesh.vat.instanceTexture) entries.push({
			binding: b++,
			resource: mesh.vat.instanceTexture.createView()
		});
		return b;
	}
};
export { createVatFragment, createVatPickProjectionWgsl, pbrExt };

//# sourceMappingURL=vat-fragment.js.map