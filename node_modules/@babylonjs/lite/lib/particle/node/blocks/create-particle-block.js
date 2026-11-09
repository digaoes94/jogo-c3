// src/particle/node/blocks/create-particle-block.ts
/**
* `CreateParticleBlock` — creates the {@link ParticleSystem} and fills the fixed creation slots
* (lifetime/emit-power, size/scale, angle, colour, dead colour + the derived per-step colour ramp) as
* column writes. The shape block fills position/direction.
*/
var createParticleBlock = { build(block, ctx) {
	const system = ctx.state.system;
	const buffer = system.buffer;
	const lifeTimeGetter = ctx.input(block, "lifeTime", () => 1);
	const emitPowerGetter = ctx.input(block, "emitPower", () => 1);
	const colorGetter = ctx.input(block, "color", () => ({
		r: 1,
		g: 1,
		b: 1,
		a: 1
	}));
	const colorDeadGetter = ctx.input(block, "colorDead", () => ({
		r: 0,
		g: 0,
		b: 0,
		a: 0
	}));
	const scaleGetter = ctx.input(block, "scale", () => ({
		x: 1,
		y: 1
	}));
	const angleGetter = ctx.input(block, "angle", () => 0);
	const sizeGetter = ctx.input(block, "size", () => 1);
	const lifeTime = buffer.lifeTime;
	const dirX = buffer.dirX;
	const dirY = buffer.dirY;
	const dirZ = buffer.dirZ;
	const size = buffer.size;
	const scaleX = buffer.scaleX;
	const scaleY = buffer.scaleY;
	const angle = buffer.angle;
	const colR = buffer.colorR;
	const colG = buffer.colorG;
	const colB = buffer.colorB;
	const colA = buffer.colorA;
	const stepR = buffer.colorStepR;
	const stepG = buffer.colorStepG;
	const stepB = buffer.colorStepB;
	const stepA = buffer.colorStepA;
	system.createLifeTime = (i) => {
		lifeTime[i] = lifeTimeGetter(i);
		system._emitPower = emitPowerGetter(i);
	};
	system.createEmitPower = (i) => {
		const p = system._emitPower;
		if (p === 0) {
			dirX[i] = 0;
			dirY[i] = 0;
			dirZ[i] = 0;
		} else {
			dirX[i] = dirX[i] * p;
			dirY[i] = dirY[i] * p;
			dirZ[i] = dirZ[i] * p;
		}
	};
	system.createSize = (i) => {
		const s = sizeGetter(i);
		size[i] = typeof s === "number" ? s : 1;
		const sc = scaleGetter(i);
		if (sc && typeof sc === "object") {
			const v = sc;
			scaleX[i] = v.x;
			scaleY[i] = v.y;
		} else {
			scaleX[i] = sc;
			scaleY[i] = sc;
		}
	};
	system.createAngle = (i) => {
		angle[i] = angleGetter(i);
	};
	system.createColor = (i) => {
		const c = colorGetter(i);
		if (c) {
			colR[i] = c.r;
			colG[i] = c.g;
			colB[i] = c.b;
			colA[i] = c.a;
		}
	};
	system.createColorDead = (i) => {
		const cd = colorDeadGetter(i);
		system._writeColorDead?.(i, cd);
		const invLife = 1 / lifeTime[i];
		stepR[i] = (cd.r - colR[i]) * invLife;
		stepG[i] = (cd.g - colG[i]) * invLife;
		stepB[i] = (cd.b - colB[i]) * invLife;
		stepA[i] = (cd.a - colA[i]) * invLife;
	};
} };
export { createParticleBlock };

//# sourceMappingURL=create-particle-block.js.map