import { buildNativeMassProperties } from "./havok-mass-properties.js";
// src/physics/havok-thin-instance-advanced.ts
function enableHavokThinInstanceAdvancedPhysics(world) {
	const shapesByHandles = /* @__PURE__ */ new WeakMap();
	const releaseShapes = (raw, handles) => {
		const shapes = shapesByHandles.get(handles);
		if (shapes) {
			for (const shape of shapes.values()) raw.HP_Shape_Release(shape);
			shapesByHandles.delete(handles);
		}
	};
	world._thinAdvanced = {
		setShapes(raw, handles, scales, shape) {
			const scaledShapes = /* @__PURE__ */ new Map();
			let result;
			for (let index = 0; index < handles.length; index++) {
				const scaleOffset = index * 3;
				const x = scales[scaleOffset];
				const y = scales[scaleOffset + 1];
				const z = scales[scaleOffset + 2];
				let instanceShape = shape;
				if (x !== 1 || y !== 1 || z !== 1) {
					const key = `${x},${y},${z}`;
					instanceShape = scaledShapes.get(key);
					if (!instanceShape) {
						instanceShape = raw.HP_Shape_CreateContainer()[1];
						raw.HP_Shape_AddChild(instanceShape, shape, [
							[
								0,
								0,
								0
							],
							[
								0,
								0,
								0,
								1
							],
							[
								x,
								y,
								z
							]
						]);
						scaledShapes.set(key, instanceShape);
					}
				}
				result = raw.HP_Body_SetShape(handles[index], instanceShape);
			}
			releaseShapes(raw, handles);
			shapesByHandles.set(handles, scaledShapes);
			return result;
		},
		releaseShapes,
		mass(raw, body, handles, properties, fallbackInertia) {
			const transform = body._massPropertiesTransform;
			for (let index = 0; index < handles.length; index++) {
				const massProperties = buildNativeMassProperties(raw, handles[index], properties, fallbackInertia);
				transform?.(massProperties, index);
				raw.HP_Body_SetMassProperties(handles[index], massProperties);
			}
		}
	};
}
export { enableHavokThinInstanceAdvancedPhysics };

//# sourceMappingURL=havok-thin-instance-advanced.js.map