import { ObservableVec3 } from "../math/observable-vec3.js";
import { initSceneNodeTransform } from "../scene/scene-node.js";
// src/light/light-base.ts
/** Create the SceneNode transform and version state shared by all light types. */
function createLightBase(position) {
	const lvs = {
		_lightVersion: 0,
		b() {
			lvs._lightVersion++;
		}
	};
	return {
		node: initSceneNodeTransform({
			name: "",
			children: []
		}, position[0], position[1], position[2]),
		lvs
	};
}
/** Write a normalized world-space direction from a light matrix. Parent scale
*  must not change lighting intensity or spotlight cone tests. */
function writeWorldLightDirection(data, offset, world, direction) {
	const x = world[0] * direction.x + world[4] * direction.y + world[8] * direction.z;
	const y = world[1] * direction.x + world[5] * direction.y + world[9] * direction.z;
	const z = world[2] * direction.x + world[6] * direction.y + world[10] * direction.z;
	const invLength = 1 / (Math.hypot(x, y, z) || 1);
	data[offset] = x * invLength;
	data[offset + 1] = y * invLength;
	data[offset + 2] = z * invLength;
}
/** Add light-specific state to a SceneNode and return the same object. */
function applyLightBase(node, target, lvs) {
	Object.assign(node, target);
	if (lvs) {
		Object.defineProperty(node, "_lightVersion", {
			get() {
				return lvs._lightVersion + node.worldMatrixVersion;
			},
			enumerable: false,
			configurable: true
		});
		node._bumpLightVersion = lvs.b;
	}
	return node;
}
export { ObservableVec3, applyLightBase, createLightBase, writeWorldLightDirection };

//# sourceMappingURL=light-base.js.map