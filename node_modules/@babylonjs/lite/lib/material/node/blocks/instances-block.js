// src/material/node/blocks/instances-block.ts
var emitter = {
	className: "InstancesBlock",
	stage: "vertex",
	emit(_block, outputName, _stage, state, _ctx) {
		if (outputName === "instanceID") {
			if (state.hasInstances) {
				state.usesInstanceIndex = true;
				return {
					expr: "f32(instanceIndex)",
					type: "f32"
				};
			}
			return {
				expr: "0.0",
				type: "f32"
			};
		}
		if (state.hasInstances) {
			for (let index = 0; index < 4; index++) {
				const name = `world${index}`;
				if (!state.vertexAttributes.some((attribute) => attribute._name === name)) state.vertexAttributes.push({
					_name: name,
					_type: "vec4<f32>",
					_gpuFormat: "float32x4",
					_arrayStride: 64,
					_stepMode: "instance",
					_bufferGroup: "ti-matrix",
					_offset: index * 16
				});
			}
			return {
				expr: "(meshU.world * mat4x4<f32>(in.world0, in.world1, in.world2, in.world3))",
				type: "mat4f"
			};
		}
		return {
			expr: "meshU.world",
			type: "mat4f"
		};
	}
};
export { emitter };

//# sourceMappingURL=instances-block.js.map