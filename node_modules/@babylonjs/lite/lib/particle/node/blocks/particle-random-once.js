import { column } from "../../particle-buffer.js";
// src/particle/node/blocks/particle-random-once.ts
/**
* Build a scalar `OncePerParticle` cache. This module is loaded only for lock mode 3, so other random
* modes pay neither its code nor its three feature columns. The particle id invalidates stale values when a
* compacted slot is reused, avoiding a reset hook in the spawn loop.
*/
function createOnceRandomGetter(buffer, blockId, draw) {
	const cachedId = column(buffer, `random.${blockId}.id`, Uint32Array);
	const cachedValid = column(buffer, `random.${blockId}.valid`, Uint8Array);
	const value = column(buffer, `random.${blockId}.value0`, Float64Array);
	return (i) => {
		const id = buffer.id[i];
		if (cachedValid[i] === 0 || cachedId[i] !== id) {
			value[i] = draw(i);
			cachedId[i] = id;
			cachedValid[i] = 1;
		}
		return value[i];
	};
}
export { createOnceRandomGetter };

//# sourceMappingURL=particle-random-once.js.map