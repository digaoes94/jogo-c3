import { createParticleBuffer, killParticle, spawnParticle } from "./particle-buffer.js";
// src/particle/particle-system.ts
/**
* Data-oriented particle system and simulation loop.
*
* Matches Babylon.js emission counting, update, lifetime-clamp, recycle, and creation semantics, including
* `Math.random` consumption and creation-step order, while operating on a {@link ParticleBuffer} of columns
* via ordered {@link ParticleStep} lists. The creation and update steps
* are supplied by the graph build (or, in tests, hand-wired). Feature state lives in feature columns, so a
* system pays nothing for features it does not use.
*/
/** Create a data-oriented particle system with an empty buffer of the given capacity. */
function createParticleSystem(capacity) {
	return {
		buffer: createParticleBuffer(capacity),
		emitRate: 10,
		updateSpeed: .0167,
		targetStopDuration: 0,
		blendMode: 2,
		texture: null,
		createLifeTime: null,
		createPosition: null,
		createDirection: null,
		createEmitPower: null,
		createSize: null,
		createAngle: null,
		createColor: null,
		createColorDead: null,
		updateSteps: [],
		_scaledStep: 0,
		_emitPower: 1,
		_scaledUpdateSpeed: 0,
		_newPartsExcess: 0,
		_started: false,
		_stopped: false,
		_actualFrame: 0
	};
}
/** Start emission. Resets the simulated-time accumulator. */
function startParticleSystem(system) {
	system._started = true;
	system._stopped = false;
	system._actualFrame = 0;
}
/** Stop emission. Existing particles continue until they expire. */
function stopParticleSystem(system) {
	system._stopped = true;
}
/** Whether emission is started. Stopped systems may still contain draining particles. */
function isParticleSystemStarted(system) {
	return system._started && !system._stopped;
}
/**
* Advance the simulation by one step. `scaledRatio` multiplies the system's `updateSpeed`
* (scene animation ratio for a live frame, or the pre-warm step offset).
*/
function animateParticleSystem(system, scaledRatio) {
	if (!system._started) return;
	system._prepareFrame?.();
	const scaledUpdateSpeed = system.updateSpeed * scaledRatio;
	system._scaledUpdateSpeed = scaledUpdateSpeed;
	const emission = (system._emitRateGetter ? system._emitRateGetter() : system.emitRate) * scaledUpdateSpeed;
	let newParticles = emission >> 0;
	system._newPartsExcess += emission - newParticles;
	if (system._newPartsExcess > 1) {
		const extra = system._newPartsExcess >> 0;
		newParticles += extra;
		system._newPartsExcess -= extra;
	}
	if (system._stopped) newParticles = 0;
	else {
		system._actualFrame += scaledUpdateSpeed;
		if (system.targetStopDuration && system._actualFrame >= system.targetStopDuration) stopParticleSystem(system);
	}
	updateExisting(system, scaledUpdateSpeed);
	createNew(system, newParticles);
}
function updateExisting(system, scaledUpdateSpeed) {
	const buffer = system.buffer;
	const age = buffer.age;
	const lifeTime = buffer.lifeTime;
	const steps = system.updateSteps;
	for (let i = 0; i < buffer.alive; i++) {
		let stepSpeed = scaledUpdateSpeed;
		const previousAge = age[i];
		age[i] = previousAge + stepSpeed;
		if (age[i] > lifeTime[i]) {
			const diff = age[i] - previousAge;
			stepSpeed = (lifeTime[i] - previousAge) * stepSpeed / diff;
			age[i] = lifeTime[i];
		}
		system._scaledStep = stepSpeed;
		for (let s = 0; s < steps.length; s++) steps[s](i);
		if (age[i] >= lifeTime[i]) {
			killParticle(buffer, i);
			i--;
		}
	}
}
function createNew(system, count) {
	const buffer = system.buffer;
	for (let n = 0; n < count; n++) {
		const i = spawnParticle(buffer);
		if (i < 0) break;
		if (system.createLifeTime) system.createLifeTime(i);
		if (system.createPosition) system.createPosition(i);
		if (system.createDirection) system.createDirection(i);
		if (system.createEmitPower) system.createEmitPower(i);
		if (system.createSize) system.createSize(i);
		if (system.createAngle) system.createAngle(i);
		if (system.createColor) system.createColor(i);
		if (system.createColorDead) system.createColorDead(i);
	}
}
export { animateParticleSystem, createParticleSystem, isParticleSystemStarted, startParticleSystem, stopParticleSystem };

//# sourceMappingURL=particle-system.js.map