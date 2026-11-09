import { F32 } from "../engine/typed-arrays.js";
import { SS } from "../engine/gpu-flags.js";
import { _registerPbrExt } from "../material/pbr/pbr-flags.js";
import { CLUSTERED_LIGHT_STRUCTS, _clusteredSpotLightBlock } from "../material/pbr/fragments/clustered-light-wgsl.js";
// src/light/clustered-spot-support.ts
var PBR_HAS_CLUSTERED_SPOTS = 16384;
var clusteredSpotPbrExt = {
	id: "clustered-spot-lights",
	phase: "fragment",
	detect(mat) {
		return mat._clusteredLightState?._hasSpots ? {
			f: PBR_HAS_CLUSTERED_SPOTS,
			f2: 0
		} : {
			f: 0,
			f2: 0
		};
	},
	frag(ctx) {
		if ((ctx._features & PBR_HAS_CLUSTERED_SPOTS) === 0) return null;
		const block = _clusteredSpotLightBlock();
		return {
			_id: "clustered-spot-lights",
			_bindings: [
				{
					_name: "clusteredLightParams",
					_type: { _kind: "uniform-buffer" },
					_visibility: SS.FRAGMENT
				},
				{
					_name: "clusteredLights",
					_type: {
						_kind: "texture",
						_textureType: "texture_2d<f32>",
						_sampleType: "unfilterable-float"
					},
					_visibility: SS.FRAGMENT
				},
				{
					_name: "clusteredCells",
					_type: {
						_kind: "texture",
						_textureType: "texture_2d<u32>"
					},
					_visibility: SS.FRAGMENT
				},
				{
					_name: "clusteredIndices",
					_type: {
						_kind: "texture",
						_textureType: "texture_2d<u32>"
					},
					_visibility: SS.FRAGMENT
				}
			],
			_helperFunctions: CLUSTERED_LIGHT_STRUCTS,
			_fragmentSlots: {
				AD: block,
				BL: block
			}
		};
	},
	bind(ctx, entries, b) {
		const state = ctx._material._clusteredLightState;
		if (!state) return b;
		entries.push({
			binding: b++,
			resource: { buffer: state.paramsBuffer }
		});
		entries.push({
			binding: b++,
			resource: state.lightsView
		});
		entries.push({
			binding: b++,
			resource: state.cellsView
		});
		entries.push({
			binding: b++,
			resource: state.indicesView
		});
		return b;
	}
};
/** @internal Install spot-only code and register its PBR extension. */
function _enableClusteredSpotSupport(container) {
	if (!container._spotSupport) {
		container._spotSupport = spotSupport;
		_registerPbrExt(clusteredSpotPbrExt);
	}
}
var spotSupport = { _create(lightCount) {
	const snapshot = new F32(lightCount * 4);
	snapshot.fill(NaN);
	return {
		_stride: 3,
		_coneChanged(index, light) {
			const off = index * 4;
			const changed = snapshot[off] !== light.direction[0] || snapshot[off + 1] !== light.direction[1] || snapshot[off + 2] !== light.direction[2] || snapshot[off + 3] !== light.angle;
			snapshot[off] = light.direction[0];
			snapshot[off + 1] = light.direction[1];
			snapshot[off + 2] = light.direction[2];
			snapshot[off + 3] = light.angle;
			return changed;
		},
		_collect(activeLights, lights, view) {
			for (const light of lights) if (light.range > 0 && light.intensity > 0) activeLights.push({
				light,
				_spot: light,
				depth: view[2] * light.position[0] + view[6] * light.position[1] + view[10] * light.position[2] + view[14]
			});
		},
		_write(data, offset, spot) {
			if (!spot) {
				data[offset + 8] = 0;
				data[offset + 9] = 0;
				data[offset + 10] = 0;
				data[offset + 11] = -1;
				return;
			}
			const dx = spot.direction[0];
			const dy = spot.direction[1];
			const dz = spot.direction[2];
			const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
			const inv = len === 0 || len === 1 ? 1 : 1 / len;
			data[offset + 8] = dx * inv;
			data[offset + 9] = dy * inv;
			data[offset + 10] = dz * inv;
			data[offset + 11] = Math.cos(Math.min(Math.max(spot.angle, 0), Math.PI) * .5);
		},
		_markState(state) {
			state._hasSpots = true;
		}
	};
} };
export { _enableClusteredSpotSupport };

//# sourceMappingURL=clustered-spot-support.js.map