// src/particle/node/npe-contextual.ts
var CTX_POSITION = 1;
var CTX_AGE = 3;
var CTX_LIFETIME = 4;
var CTX_COLOR = 5;
var CTX_SCALED_DIRECTION = 6;
var CTX_SCALED_COLOR_STEP = 23;
/** Build a scratch-backed Color4 getter for four component columns. */
function color4Getter(r, g, b, a) {
	const scratch = {
		r: 0,
		g: 0,
		b: 0,
		a: 0
	};
	return (i) => {
		scratch.r = r[i];
		scratch.g = g[i];
		scratch.b = b[i];
		scratch.a = a[i];
		return scratch;
	};
}
/** Build a common contextual getter, or null when the source belongs to the lazy contextual extension. */
function makeContextualGetter(buffer, system, source) {
	switch (source) {
		case CTX_AGE: {
			const age = buffer.age;
			return (i) => age[i];
		}
		case CTX_LIFETIME: {
			const lifeTime = buffer.lifeTime;
			return (i) => lifeTime[i];
		}
		case CTX_POSITION: {
			const x = buffer.posX;
			const y = buffer.posY;
			const z = buffer.posZ;
			const s = {
				x: 0,
				y: 0,
				z: 0
			};
			return (i) => {
				s.x = x[i];
				s.y = y[i];
				s.z = z[i];
				return s;
			};
		}
		case CTX_SCALED_DIRECTION: {
			const x = buffer.dirX;
			const y = buffer.dirY;
			const z = buffer.dirZ;
			const s = {
				x: 0,
				y: 0,
				z: 0
			};
			return (i) => {
				const k = system._scaledStep;
				s.x = x[i] * k;
				s.y = y[i] * k;
				s.z = z[i] * k;
				return s;
			};
		}
		case CTX_COLOR: return color4Getter(buffer.colorR, buffer.colorG, buffer.colorB, buffer.colorA);
		case CTX_SCALED_COLOR_STEP: {
			const r = buffer.colorStepR;
			const g = buffer.colorStepG;
			const b = buffer.colorStepB;
			const a = buffer.colorStepA;
			const s = {
				r: 0,
				g: 0,
				b: 0,
				a: 0
			};
			return (i) => {
				const k = system._scaledUpdateSpeed;
				s.r = r[i] * k;
				s.g = g[i] * k;
				s.b = b[i] * k;
				s.a = a[i] * k;
				return s;
			};
		}
		default: return null;
	}
}
export { color4Getter, makeContextualGetter };

//# sourceMappingURL=npe-contextual.js.map