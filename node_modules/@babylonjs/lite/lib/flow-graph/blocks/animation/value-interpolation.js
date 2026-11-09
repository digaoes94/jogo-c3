import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { FgAnimationValueType, animationTypeForFgType } from "../../rich-type.js";
import { activateSignal, addPending, cancelPendingForBlock, getDataValue, setDataValue, setExecVar } from "../../runtime.js";
import { sigIn, sigOut, sockIn, sockOut } from "../../sockets.js";
import { pointerTypesCompatible, resolveBlockPointer } from "../../pointer-template.js";
// src/flow-graph/blocks/animation/value-interpolation.ts
/** Spherical linear interpolation for quaternions (BJS-compatible). */
function slerpQuat(a, b, t) {
	let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
	let bx = b.x, by = b.y, bz = b.z, bw = b.w;
	if (dot < 0) {
		dot = -dot;
		bx = -bx;
		by = -by;
		bz = -bz;
		bw = -bw;
	}
	let s0;
	let s1;
	if (dot > .9995) {
		s0 = 1 - t;
		s1 = t;
	} else {
		const theta = Math.acos(dot);
		const sinTheta = Math.sin(theta);
		s0 = Math.sin((1 - t) * theta) / sinTheta;
		s1 = Math.sin(t * theta) / sinTheta;
	}
	return {
		x: s0 * a.x + s1 * bx,
		y: s0 * a.y + s1 * by,
		z: s0 * a.z + s1 * bz,
		w: s0 * a.w + s1 * bw
	};
}
/** Type-aware linear/spherical interpolation between two FgValues. */
function lerpFgValue(a, b, t, animType) {
	switch (animType) {
		case FgAnimationValueType.Float: {
			const na = typeof a === "number" ? a : 0;
			return na + t * ((typeof b === "number" ? b : 0) - na);
		}
		case FgAnimationValueType.Vector2: {
			const va = a;
			const vb = b;
			return {
				x: va.x + t * (vb.x - va.x),
				y: va.y + t * (vb.y - va.y)
			};
		}
		case FgAnimationValueType.Vector3: {
			const va = a;
			const vb = b;
			return {
				x: va.x + t * (vb.x - va.x),
				y: va.y + t * (vb.y - va.y),
				z: va.z + t * (vb.z - va.z)
			};
		}
		case FgAnimationValueType.Vector4: {
			const va = a;
			const vb = b;
			return {
				x: va.x + t * (vb.x - va.x),
				y: va.y + t * (vb.y - va.y),
				z: va.z + t * (vb.z - va.z),
				w: va.w + t * (vb.w - va.w)
			};
		}
		case FgAnimationValueType.Quaternion: return slerpQuat(a, b, t);
		case FgAnimationValueType.Color3: {
			const ca = a;
			const cb = b;
			return {
				r: ca.r + t * (cb.r - ca.r),
				g: ca.g + t * (cb.g - ca.g),
				b: ca.b + t * (cb.b - ca.b)
			};
		}
		case FgAnimationValueType.Color4: {
			const ca = a;
			const cb = b;
			return {
				r: ca.r + t * (cb.r - ca.r),
				g: ca.g + t * (cb.g - ca.g),
				b: ca.b + t * (cb.b - ca.b),
				a: ca.a + t * (cb.a - ca.a)
			};
		}
		default: return b;
	}
}
function cubicBezier(t, p1, p2) {
	const sample = (u, a, b) => ((3 * a - 3 * b + 1) * u + (-6 * a + 3 * b)) * u * u + 3 * a * u;
	const derivative = (u) => 3 * (3 * p1.x - 3 * p2.x + 1) * u * u + 2 * (-6 * p1.x + 3 * p2.x) * u + 3 * p1.x;
	let u = t;
	for (let i = 0; i < 8; i++) {
		const error = sample(u, p1.x, p2.x) - t;
		if (Math.abs(error) < 1e-7) return sample(u, p1.y, p2.y);
		const slope = derivative(u);
		if (Math.abs(slope) < 1e-7) break;
		u -= error / slope;
	}
	let low = 0;
	let high = 1;
	for (let i = 0; i < 24; i++) {
		u = (low + high) / 2;
		if (sample(u, p1.x, p2.x) < t) low = u;
		else high = u;
	}
	return sample(u, p1.y, p2.y);
}
function validControlPoint(value) {
	return typeof value === "object" && value !== null && "x" in value && "y" in value && typeof value.x === "number" && typeof value.y === "number" && isFinite(value.x) && isFinite(value.y);
}
/** Derive the `FgAnimationValueType` from config and/or the runtime start value. */
function resolveAnimType(startValue, config) {
	if (config?.useSlerp) return FgAnimationValueType.Quaternion;
	const configType = config?.type;
	if (configType) return animationTypeForFgType(configType);
	if (typeof startValue === "number" || startValue === null || startValue === void 0) return FgAnimationValueType.Float;
	if (typeof startValue === "object") {
		if ("r" in startValue && "a" in startValue) return FgAnimationValueType.Color4;
		if ("r" in startValue) return FgAnimationValueType.Color3;
		if ("w" in startValue) return FgAnimationValueType.Vector4;
		if ("z" in startValue) return FgAnimationValueType.Vector3;
		if ("y" in startValue) return FgAnimationValueType.Vector2;
	}
	return FgAnimationValueType.Float;
}
var valueInterpolationDef = {
	type: FgBlockType.ValueInterpolation,
	build: (config) => ({
		dataIn: [
			sockIn("startValue", FgType.Any),
			sockIn("endValue", FgType.Any),
			sockIn("duration", FgType.Number, 0),
			sockIn("p1", FgType.Vector2, {
				x: 0,
				y: 0
			}),
			sockIn("p2", FgType.Vector2, {
				x: 1,
				y: 1
			}),
			...(config?.pointerSegments ?? []).map((name) => sockIn(name, FgType.Any))
		],
		dataOut: [sockOut("value", FgType.Any)],
		signalIn: [sigIn("in")],
		signalOut: [
			sigOut("out"),
			sigOut("done"),
			sigOut("error")
		]
	}),
	updateOutputs(block, ctx) {
		const cv = ctx.executionVariables[`${block.id}:currentValue`];
		if (cv !== void 0) setDataValue(ctx, block, "value", cv);
	},
	execute(block, ctx, env, incomingSignal) {
		if (incomingSignal !== "in" && incomingSignal !== void 0) return;
		const duration = getDataValue(ctx, env, block, "duration");
		const p1 = getDataValue(ctx, env, block, "p1");
		const p2 = getDataValue(ctx, env, block, "p2");
		if (!isFinite(duration) || isNaN(duration) || duration < 0 || !validControlPoint(p1) || !validControlPoint(p2) || p1.x < 0 || p1.x > 1 || p2.x < 0 || p2.x > 1) {
			activateSignal(ctx, env, block, "error");
			return;
		}
		let targetKey = `block:${block.id}`;
		let startValue = getDataValue(ctx, env, block, "startValue");
		let writeTarget;
		let targetType;
		const variable = block.config?.variable;
		if (variable !== void 0) {
			if (!(variable in ctx.userVariables)) {
				activateSignal(ctx, env, block, "error");
				return;
			}
			targetKey = `variable:${variable}`;
			startValue = ctx.userVariables[variable];
			writeTarget = (value) => {
				ctx.userVariables[variable] = value;
			};
		} else if (block.config?.accessor || block.config?.pointerTemplate) {
			const resolved = resolveBlockPointer(block, ctx, env);
			if (!resolved?.accessor.set) {
				activateSignal(ctx, env, block, "error");
				return;
			}
			targetKey = `pointer:${resolved.pointer}`;
			startValue = resolved.accessor.get();
			writeTarget = resolved.accessor.set;
			targetType = resolved.accessor.type;
			const declaredType = block.config?.type;
			if (!pointerTypesCompatible(declaredType, targetType)) {
				activateSignal(ctx, env, block, "error");
				return;
			}
		}
		const endValue = getDataValue(ctx, env, block, "endValue");
		const animType = resolveAnimType(startValue, targetType ? {
			...block.config,
			type: targetType,
			useSlerp: targetType === FgType.Quaternion
		} : block.config);
		for (const task of ctx.pending) if (task.state.targetKey === targetKey) task.canceled = true;
		cancelPendingForBlock(ctx, block);
		setExecVar(ctx, block, "currentValue", startValue);
		setDataValue(ctx, block, "value", startValue);
		if (duration <= 0 && variable === void 0 && !block.config?.accessor && !block.config?.pointerTemplate) {
			setExecVar(ctx, block, "currentValue", endValue);
			setDataValue(ctx, block, "value", endValue);
			activateSignal(ctx, env, block, "out");
			activateSignal(ctx, env, block, "done");
			return;
		}
		addPending(ctx, block, {
			startValue,
			endValue,
			duration,
			elapsed: 0,
			animType,
			p1,
			p2,
			targetKey,
			writeTarget
		});
		activateSignal(ctx, env, block, "out");
	},
	onTick(block, ctx, env, deltaMs, task) {
		const elapsed = task.state.elapsed + deltaMs / 1e3;
		const duration = task.state.duration;
		const startValue = task.state.startValue;
		const endValue = task.state.endValue;
		const animType = task.state.animType;
		const writeTarget = task.state.writeTarget;
		if (elapsed >= duration) {
			task.done = true;
			setExecVar(ctx, block, "currentValue", endValue);
			setDataValue(ctx, block, "value", endValue);
			writeTarget?.(endValue);
			activateSignal(ctx, env, block, "done");
		} else {
			task.state.elapsed = elapsed;
			const t = elapsed / duration;
			if (t <= 0) return;
			const current = lerpFgValue(startValue, endValue, cubicBezier(t, task.state.p1, task.state.p2), animType);
			setExecVar(ctx, block, "currentValue", current);
			setDataValue(ctx, block, "value", current);
			writeTarget?.(current);
		}
	},
	cancelPending(_block, _ctx, _env) {}
};
export { valueInterpolationDef };

//# sourceMappingURL=value-interpolation.js.map