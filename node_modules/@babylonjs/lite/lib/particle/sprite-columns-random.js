import { column } from "./particle-buffer.js";
// src/particle/sprite-columns-random.ts
function clamp01(value) {
	return value < 0 ? 0 : value > 1 ? 1 : value;
}
/** Attach the random-start sprite variant. Loaded only when the graph enables random start cells. */
function useRandomSpriteSheet(buffer, config) {
	const randomOffset = column(buffer, "sprite.randomOffset", Float32Array);
	const cellIndex = column(buffer, "sprite.cellIndex", Uint16Array);
	const age = buffer.age;
	const lifeTime = buffer.lifeTime;
	const start = config.startCellID;
	const distance = config.endCellID - start + 1;
	return {
		cellIndex,
		birth(i) {
			randomOffset[i] = -1;
			cellIndex[i] = start;
		},
		update(i) {
			const life = lifeTime[i];
			if (randomOffset[i] < 0) randomOffset[i] = Math.random() * life;
			let progress;
			if (config.changeSpeed === 0) progress = randomOffset[i];
			else progress = (age[i] + randomOffset[i]) * config.changeSpeed;
			const ratio = config.loop ? clamp01(progress % life / life) : clamp01(progress / life);
			cellIndex[i] = start + ratio * distance | 0;
		}
	};
}
export { useRandomSpriteSheet };

//# sourceMappingURL=sprite-columns-random.js.map