// src/particle/particle-buffer.ts
/** Create a particle buffer with all built-in columns sized to `capacity`. */
function createParticleBuffer(capacity) {
	const posX = new Float32Array(capacity);
	const posY = new Float32Array(capacity);
	const posZ = new Float32Array(capacity);
	const dirX = new Float32Array(capacity);
	const dirY = new Float32Array(capacity);
	const dirZ = new Float32Array(capacity);
	const age = new Float64Array(capacity);
	const lifeTime = new Float64Array(capacity);
	const id = new Uint32Array(capacity);
	const size = new Float32Array(capacity);
	const angle = new Float32Array(capacity);
	const scaleX = new Float32Array(capacity);
	const scaleY = new Float32Array(capacity);
	const colorR = new Float32Array(capacity);
	const colorG = new Float32Array(capacity);
	const colorB = new Float32Array(capacity);
	const colorA = new Float32Array(capacity);
	const colorStepR = new Float32Array(capacity);
	const colorStepG = new Float32Array(capacity);
	const colorStepB = new Float32Array(capacity);
	const colorStepA = new Float32Array(capacity);
	return {
		capacity,
		alive: 0,
		posX,
		posY,
		posZ,
		dirX,
		dirY,
		dirZ,
		age,
		lifeTime,
		id,
		size,
		angle,
		scaleX,
		scaleY,
		colorR,
		colorG,
		colorB,
		colorA,
		colorStepR,
		colorStepG,
		colorStepB,
		colorStepA,
		_columns: /* @__PURE__ */ new Map(),
		_all: [
			posX,
			posY,
			posZ,
			dirX,
			dirY,
			dirZ,
			age,
			lifeTime,
			id,
			size,
			angle,
			scaleX,
			scaleY,
			colorR,
			colorG,
			colorB,
			colorA,
			colorStepR,
			colorStepG,
			colorStepB,
			colorStepA
		],
		_nextId: 0
	};
}
/**
* Get (or lazily allocate) an optional feature column by name. The first caller allocates a typed array of the
* buffer's capacity and registers it for swap-remove; later callers with the same name share it. A buffer
* whose systems never request a given column never allocates it — this is what makes unused features free.
*/
function column(buffer, name, ctor) {
	const existing = buffer._columns.get(name);
	if (existing) return existing;
	const created = new ctor(buffer.capacity);
	buffer._columns.set(name, created);
	buffer._all.push(created);
	return created;
}
/**
* Reserve a slot for a new particle and return its index, or `-1` when the buffer is full. Assigns a fresh
* id and zeroes `age`; the caller's creation steps must fill every other field they own.
*/
function spawnParticle(buffer) {
	if (buffer.alive >= buffer.capacity) return -1;
	const i = buffer.alive++;
	buffer.id[i] = buffer._nextId++;
	buffer.age[i] = 0;
	return i;
}
/**
* Recycle a dead particle by swap-remove: copy the last live particle into slot `i` across every column and
* shrink the live range. Zero allocation; O(columns) copies per death.
*/
function killParticle(buffer, i) {
	const last = --buffer.alive;
	if (i !== last) {
		const all = buffer._all;
		for (let c = 0; c < all.length; c++) {
			const col = all[c];
			col[i] = col[last];
		}
	}
}
export { column, createParticleBuffer, killParticle, spawnParticle };

//# sourceMappingURL=particle-buffer.js.map