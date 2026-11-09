import { column } from "./particle-buffer.js";
// src/particle/sprite-columns.ts
/**
* Sprite-sheet feature as particle columns.
*
* This is the sprite-sheet animation expressed the data-oriented way: it owns a set of columns on the
* particle buffer and returns birth/update steps that close over them. A system that never calls
* {@link useSpriteSheet} allocates none of these columns and never imports this module, so a non-sprite
* particle system pays nothing for sprite animation — in bundle bytes or in per-particle memory — while
* the update step remains allocation-free. The cell math mirrors Babylon.js `Particle.updateCellIndex`.
*/
function clamp01(value) {
	return value < 0 ? 0 : value > 1 ? 1 : value;
}
/**
* Attach the sprite-sheet feature to a buffer: allocate its columns (only now, on this buffer) and return
* birth/update steps closing over them. Columns are keyed `sprite.*`, shared if attached more than once.
*/
function useSpriteSheet(buffer, config) {
	const cellIndex = column(buffer, "sprite.cellIndex", Uint16Array);
	const age = buffer.age;
	const lifeTime = buffer.lifeTime;
	const start = config.startCellID;
	const distance = config.endCellID - start + 1;
	return {
		cellIndex,
		birth(i) {
			cellIndex[i] = start;
		},
		update(i) {
			const life = lifeTime[i];
			const progress = age[i] * config.changeSpeed;
			const ratio = config.loop ? clamp01(progress % life / life) : clamp01(progress / life);
			cellIndex[i] = start + ratio * distance | 0;
		}
	};
}
export { useSpriteSheet };

//# sourceMappingURL=sprite-columns.js.map