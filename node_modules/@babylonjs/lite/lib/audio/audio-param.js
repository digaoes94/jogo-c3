// src/audio/audio-param.ts
var CurveLength = 100;
/**
* Minimum ramp duration in seconds. Below this the value is set immediately —
* there is no perceptual difference, so a curve is not scheduled.
*/
var MinRampDuration = 1e-6;
var TmpCurveValues = null;
var ExpCurve = null;
var LogCurve = null;
var TmpLineValues = new Float32Array([0, 0]);
function getExpCurve() {
	if (!ExpCurve) {
		ExpCurve = new Float32Array(CurveLength);
		const increment = 1 / 99;
		let x = increment;
		for (let i = 1; i < CurveLength; i++) {
			ExpCurve[i] = Math.exp(-11.512925464970227 * (1 - x));
			x += increment;
		}
	}
	return ExpCurve;
}
function getLogCurve() {
	if (!LogCurve) {
		LogCurve = new Float32Array(CurveLength);
		const increment = 1 / CurveLength;
		let x = increment;
		for (let i = 0; i < CurveLength; i++) {
			LogCurve[i] = 1 + Math.log10(x) / Math.log10(CurveLength);
			x += increment;
		}
	}
	return LogCurve;
}
/**
* Returns the value-curve array for a `setValueCurveAtTime` call ramping from
* `from` to `to` with the given shape. Linear returns a shared 2-element array;
* exp/log return a shared 100-element array. Both are reused buffers — copy if
* you need to retain the values.
* @internal
*/
function getRampCurveValues(shape, from, to) {
	if (shape === "linear") {
		TmpLineValues[0] = from;
		TmpLineValues[1] = to;
		return TmpLineValues;
	}
	if (!TmpCurveValues) TmpCurveValues = new Float32Array(CurveLength);
	const normalizedCurve = shape === "exponential" ? getExpCurve() : getLogCurve();
	const direction = Math.sign(to - from);
	const range = Math.abs(to - from);
	if (direction === 1) for (let i = 0; i < normalizedCurve.length; i++) TmpCurveValues[i] = from + range * normalizedCurve[i];
	else {
		let j = 99;
		for (let i = 0; i < normalizedCurve.length; i++, j--) TmpCurveValues[i] = from - range * (1 - normalizedCurve[j]);
	}
	return TmpCurveValues;
}
/** @internal */
function createRampParam(param, clock) {
	return {
		_param: param,
		_clock: clock,
		_targetValue: param.value,
		_rampEndTime: 0
	};
}
/** Whether the parameter is currently mid-ramp. @internal */
function isRamping(rp) {
	return rp._clock._currentTime < rp._rampEndTime;
}
var warnedRampFailure = false;
/**
* Sets the target value of the parameter, ramping with the given shape/duration.
* Faithful port of `_WebAudioParameterComponent.setTargetValue`.
* @internal
*/
function setRampTarget(rp, value, options) {
	if (!Number.isFinite(value)) {
		console.warn(`Attempted to set audio parameter to non-finite value: ${value}`);
		return;
	}
	rp._param.cancelScheduledValues(0);
	const shape = typeof options?.shape === "string" ? options.shape : "linear";
	const startTime = rp._clock._currentTime;
	if (shape === "none") {
		rp._param.value = rp._targetValue = value;
		rp._rampEndTime = startTime;
		return;
	}
	rp._targetValue = value;
	const rampDuration = rp._clock._rampDuration;
	let duration = typeof options?.duration === "number" ? Math.max(options.duration, rampDuration) : rampDuration;
	duration = Math.max(rampDuration, duration);
	if (duration < MinRampDuration) {
		rp._param.setValueAtTime(value, startTime);
		return;
	}
	try {
		const from = Number.isFinite(rp._param.value) ? rp._param.value : 0;
		rp._param.setValueCurveAtTime(getRampCurveValues(shape, from, value), startTime, duration);
		rp._rampEndTime = startTime + duration;
	} catch (e) {
		if (!warnedRampFailure) {
			console.warn(`Audio parameter ramping failed: ${e.message}`);
			warnedRampFailure = true;
		}
	}
}
export { createRampParam, getRampCurveValues, isRamping, setRampTarget };

//# sourceMappingURL=audio-param.js.map