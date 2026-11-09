import { SS } from "../engine/gpu-flags.js";
import { SKELETON_HELPERS, makeSkinningCode } from "../shader/fragments/skeleton-fragment.js";
// src/picking/deform-picking-projection.ts
/** Live skeletal-skinning and morph-target projection for the GPU picker.
*
* Lazy-imported only when a pickable mesh carries a live skeleton or morph targets. The pick pass
* deforms vertices in its own vertex shader from the same bone texture and morph storage buffers the
* render path binds, so a pick sees exactly the pose on screen with no CPU-side per-vertex work.
*
* The skinning WGSL is imported from the shared render fragment rather than restated here, so the
* pick pose can never drift from the rendered pose.
*/
var _device = null;
var _projections = null;
var _emptyBGL = null;
var _emptyBG = null;
/** Position layout, restated so the simple and detailed pick pipelines keep theirs untouched. */
var POSITION = {
	arrayStride: 12,
	attributes: [{
		shaderLocation: 0,
		offset: 0,
		format: "float32x3"
	}]
};
/** Empty group(2) filler. Bind group layouts must be contiguous from 0, so a pick pipeline that puts
*  this projection at group(3) needs a placeholder whenever no discard rule supplies group(2). */
function emptyBGL(engine) {
	return _emptyBGL ??= engine._device.createBindGroupLayout({
		label: "picking-deform-empty-bgl",
		entries: []
	});
}
/** The matching group(2) filler bind group. Built from `emptyBGL` itself rather than from a specific
*  pipeline's reflected layout, so the one instance is compatible with every deform pipeline (they all
*  embed that same layout object) and can be cached for the device instead of rebuilt per draw. */
function emptyBG(engine) {
	return _emptyBG ??= engine._device.createBindGroup({
		label: "picking-deform-empty-bg",
		layout: emptyBGL(engine),
		entries: []
	});
}
/** Morph storage-buffer layout. Restated here rather than imported from `morph-fragment-core.ts`:
*  that module belongs to the material chunk, and importing one string from it splits it into a
*  separate shared chunk that every morph render scene then pays for. Must stay byte-compatible with
*  the `_vertexHelperFunctions` declarations there — both views read the same buffers. */
var MORPH_STRUCTS = `struct morphUniforms{count:u32,vertexCount:u32,_p0:u32,_p1:u32,weights:array<f32>,}struct morphDeltasUniforms{d:array<f32>,}`;
/** Position-only morph accumulation. The render fragment also accumulates normal deltas; picking never
*  needs normals, so this reads only the position half of each 6-float (position xyz, normal xyz)
*  delta record. The stride and weight indexing match `morph-fragment-core.ts` exactly. */
var MORPH_POSITION = `var morphedPos=position;for(var i=0u;i<morph.count;i=i+1u){let b=(i*morph.vertexCount+vertexIndex)*6u;morphedPos=morphedPos+morph.weights[i]*vec3<f32>(morphDeltas.d[b],morphDeltas.d[b+1u],morphDeltas.d[b+2u]);}`;
function declarations(skeleton, morph) {
	const parts = [];
	let binding = 0;
	if (skeleton) parts.push(SKELETON_HELPERS, `@group(3)@binding(${binding++})var boneSampler:texture_2d<f32>;`);
	if (morph) parts.push(MORPH_STRUCTS, `@group(3)@binding(${binding++})var<storage,read>morphDeltas:morphDeltasUniforms;`, `@group(3)@binding(${binding})var<storage,read>morph:morphUniforms;`);
	return parts.join("\n");
}
function inputs(skeleton, has8Bones, morph) {
	let source = "";
	if (skeleton) {
		source += ", @location(1) joints: vec4<u32>, @location(2) weights: vec4<f32>";
		if (has8Bones) source += ", @location(3) joints1: vec4<u32>, @location(4) weights1: vec4<f32>";
	}
	if (morph) source += ", @builtin(vertex_index) vertexIndex: u32";
	return source;
}
function body(skeleton, has8Bones, morph, worldExpr) {
	const parts = [];
	if (morph) parts.push(MORPH_POSITION);
	if (skeleton) parts.push(`var finalWorld= ${worldExpr};`, makeSkinningCode(has8Bones, worldExpr));
	const transform = skeleton ? "finalWorld" : worldExpr;
	parts.push(`let projectedTransform= ${transform};`, `let projectedWorld=(${transform} *vec4f(${morph ? "morphedPos" : "position"},1.0)).xyz;`);
	return parts.join("\n");
}
function skinLayouts(skeleton, has8Bones) {
	if (!skeleton) return [];
	const layouts = [{
		arrayStride: 16,
		attributes: [{
			shaderLocation: 1,
			offset: 0,
			format: "uint32x4"
		}]
	}, {
		arrayStride: 16,
		attributes: [{
			shaderLocation: 2,
			offset: 0,
			format: "float32x4"
		}]
	}];
	if (has8Bones) layouts.push({
		arrayStride: 16,
		attributes: [{
			shaderLocation: 3,
			offset: 0,
			format: "uint32x4"
		}]
	}, {
		arrayStride: 16,
		attributes: [{
			shaderLocation: 4,
			offset: 0,
			format: "float32x4"
		}]
	});
	return layouts;
}
function createProjection(engine, skeleton, has8Bones, morph) {
	const entries = [];
	let binding = 0;
	if (skeleton) entries.push({
		binding: binding++,
		visibility: SS.VERTEX,
		texture: { sampleType: "unfilterable-float" }
	});
	if (morph) entries.push({
		binding: binding++,
		visibility: SS.VERTEX,
		buffer: { type: "read-only-storage" }
	}, {
		binding,
		visibility: SS.VERTEX,
		buffer: { type: "read-only-storage" }
	});
	const key = `deform-${skeleton ? has8Bones ? "skin8" : "skin4" : "noskin"}-${morph ? "morph" : "nomorph"}`;
	const bgl = engine._device.createBindGroupLayout({
		label: `picking-${key}-bgl`,
		entries
	});
	const shared = declarations(skeleton, morph);
	const sharedInputs = inputs(skeleton, has8Bones, morph);
	return {
		key,
		shader: {
			regularDeclarations: shared,
			thinDeclarations: shared,
			regularInputs: sharedInputs,
			thinInputs: sharedInputs,
			regularBody: body(skeleton, has8Bones, morph, "mesh.world"),
			thinBody: body(skeleton, has8Bones, morph, "world")
		},
		vertexBuffers: skinLayouts(skeleton, has8Bones),
		regularBGL: bgl,
		thinBGL: bgl,
		_layouts: (e, base) => [
			...base.slice(0, 2),
			base[2] ?? emptyBGL(e),
			bgl
		],
		_buffers: [POSITION, ...skinLayouts(skeleton, has8Bones)]
	};
}
function projectionFor(engine, skeleton, has8Bones, morph) {
	if (_device !== engine._device) {
		_device = engine._device;
		_projections = null;
		_emptyBGL = null;
		_emptyBG = null;
	}
	const key = `${skeleton ? has8Bones ? 8 : 4 : 0}-${morph ? 1 : 0}`;
	const projections = _projections ??= /* @__PURE__ */ new Map();
	let projection = projections.get(key);
	if (!projection) {
		projection = createProjection(engine, skeleton, has8Bones, morph);
		projections.set(key, projection);
	}
	return projection;
}
/** Return the pick projection matching this mesh's live deformation, or null when it has none.
*  VAT meshes are excluded — their baked animation owns the projection slot instead. */
function getDeformPickingProjection(engine, mesh) {
	if (mesh.vat) return null;
	const skeleton = mesh.skeleton ?? null;
	const morph = mesh.morphTargets ?? null;
	if (!skeleton && !morph) return null;
	return projectionFor(engine, !!skeleton, !!(skeleton?.joints1Buffer && skeleton.weights1Buffer), !!morph);
}
/** Bind the bone texture, morph storage, and skin attributes for a deformed pick draw.
*
*  The projection always occupies group 3, so group 2 is part of the pipeline layout even when no
*  discard rule supplies one. An empty group declares no bindings, so leaving it unbound happens to
*  validate cleanly on the implementations tested; binding the cached filler anyway keeps the draw
*  within what the spec actually guarantees, at no per-draw allocation cost. */
function bindDeformPickingProjection(engine, pass, pipeline, mesh, firstVertexSlot, discardGroupBound) {
	const skeleton = mesh.skeleton;
	const morph = mesh.morphTargets;
	const entries = [];
	let binding = 0;
	if (skeleton) entries.push({
		binding: binding++,
		resource: skeleton.boneTexture.createView()
	});
	if (morph) entries.push({
		binding: binding++,
		resource: { buffer: morph.deltasBuffer }
	}, {
		binding,
		resource: { buffer: morph.weightsBuffer }
	});
	if (!discardGroupBound) pass.setBindGroup(2, emptyBG(engine));
	pass.setBindGroup(3, engine._device.createBindGroup({
		label: "picking-deform-bg",
		layout: pipeline.getBindGroupLayout(3),
		entries
	}));
	if (skeleton) {
		let slot = firstVertexSlot;
		pass.setVertexBuffer(slot++, skeleton.jointsBuffer);
		pass.setVertexBuffer(slot++, skeleton.weightsBuffer);
		if (skeleton.joints1Buffer && skeleton.weights1Buffer) {
			pass.setVertexBuffer(slot++, skeleton.joints1Buffer);
			pass.setVertexBuffer(slot, skeleton.weights1Buffer);
		}
	}
}
export { bindDeformPickingProjection, getDeformPickingProjection };

//# sourceMappingURL=deform-picking-projection.js.map