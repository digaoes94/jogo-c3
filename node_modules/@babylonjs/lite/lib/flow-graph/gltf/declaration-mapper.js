import { FgBlockType } from "../block-type.js";
// src/flow-graph/gltf/declaration-mapper.ts
/** Default glTF value-output socket name (used when a reference omits `socket`). */
var DEFAULT_VALUE_SOCKET = "value";
/** Default glTF flow-input socket name (used when a flow omits `socket`). */
var DEFAULT_FLOW_SOCKET = "in";
/** Frames-per-second used to convert animation seconds → frames (glTF default). */
var ANIMATION_FPS = 60;
var FPS = (arr) => [(arr[0] ?? 0) * 60];
/** Native (no-extension) KHR_interactivity op → Lite block mapping. */
var NATIVE_OPS = {
	"event/onStart": {
		block: FgBlockType.SceneStart,
		flowOutputs: { out: "done" }
	},
	"event/onTick": {
		block: FgBlockType.SceneTick,
		outputValues: { timeSinceLastTick: "deltaTime" },
		flowOutputs: { out: "done" }
	},
	"flow/branch": {
		block: FgBlockType.Branch,
		flowOutputs: {
			true: "onTrue",
			false: "onFalse"
		}
	},
	"flow/sequence": {
		block: FgBlockType.Sequence,
		dynamicSequence: true
	},
	"flow/switch": {
		block: FgBlockType.Switch,
		valueInputs: { selection: "case" },
		configArrayKeys: { cases: "cases" },
		switchOutputs: true
	},
	"flow/for": {
		block: FgBlockType.ForLoop,
		configKeys: { initialIndex: "initialIndex" },
		flowOutputs: { loopBody: "executionFlow" }
	},
	"flow/while": {
		block: FgBlockType.WhileLoop,
		flowOutputs: { loopBody: "executionFlow" }
	},
	"flow/doN": {
		block: FgBlockType.DoN,
		valueInputs: { n: "maxExecutions" },
		outputValues: { currentCount: "executionCount" }
	},
	"flow/multiGate": {
		block: FgBlockType.MultiGate,
		dynamicSequence: true,
		configKeys: {
			isRandom: "isRandom",
			isLoop: "isLoop"
		}
	},
	"flow/waitAll": {
		block: FgBlockType.WaitAll,
		configKeys: { inputFlows: "inputSignalCount" }
	},
	"flow/throttle": {
		block: FgBlockType.Throttle,
		flowOutputs: { err: "error" }
	},
	"flow/setDelay": {
		block: FgBlockType.SetDelay,
		flowOutputs: { err: "error" },
		outputValues: { lastDelay: "lastDelayIndex" }
	},
	"flow/cancelDelay": {
		block: FgBlockType.CancelDelay,
		valueInputs: { delay: "delayIndex" }
	},
	"math/add": { block: FgBlockType.Add },
	"math/sub": { block: FgBlockType.Subtract },
	"math/mul": { block: FgBlockType.Multiply },
	"math/div": { block: FgBlockType.Divide },
	"math/rem": { block: FgBlockType.Modulo },
	"math/abs": { block: FgBlockType.Abs },
	"math/floor": { block: FgBlockType.Floor },
	"math/lt": { block: FgBlockType.LessThan },
	"math/clamp": { block: FgBlockType.Clamp },
	"math/combine2": { block: FgBlockType.CombineVector2 },
	"math/extract2": {
		block: FgBlockType.ExtractVector2,
		outputValues: {
			"0": "x",
			"1": "y"
		}
	},
	"math/neg": { block: FgBlockType.Negation },
	"math/sign": { block: FgBlockType.Sign },
	"math/ceil": { block: FgBlockType.Ceil },
	"math/round": { block: FgBlockType.Round },
	"math/trunc": { block: FgBlockType.Trunc },
	"math/fract": { block: FgBlockType.Fraction },
	"math/saturate": { block: FgBlockType.Saturate },
	"math/sqrt": { block: FgBlockType.SquareRoot },
	"math/cbrt": { block: FgBlockType.CubeRoot },
	"math/exp": { block: FgBlockType.Exponential },
	"math/log": { block: FgBlockType.Log },
	"math/log2": { block: FgBlockType.Log2 },
	"math/log10": { block: FgBlockType.Log10 },
	"math/rad": { block: FgBlockType.DegToRad },
	"math/deg": { block: FgBlockType.RadToDeg },
	"math/sin": { block: FgBlockType.Sin },
	"math/cos": { block: FgBlockType.Cos },
	"math/tan": { block: FgBlockType.Tan },
	"math/asin": { block: FgBlockType.Asin },
	"math/acos": { block: FgBlockType.Acos },
	"math/atan": { block: FgBlockType.Atan },
	"math/sinh": { block: FgBlockType.Sinh },
	"math/cosh": { block: FgBlockType.Cosh },
	"math/tanh": { block: FgBlockType.Tanh },
	"math/asinh": { block: FgBlockType.Asinh },
	"math/acosh": { block: FgBlockType.Acosh },
	"math/atanh": { block: FgBlockType.Atanh },
	"math/min": { block: FgBlockType.Min },
	"math/max": { block: FgBlockType.Max },
	"math/pow": { block: FgBlockType.Power },
	"math/atan2": { block: FgBlockType.Atan2 },
	"math/eq": { block: FgBlockType.Equality },
	"math/le": { block: FgBlockType.LessThanOrEqual },
	"math/gt": { block: FgBlockType.GreaterThan },
	"math/ge": { block: FgBlockType.GreaterThanOrEqual },
	"math/isNaN": { block: FgBlockType.IsNaN },
	"math/isInf": { block: FgBlockType.IsInfinity },
	"math/and": { block: FgBlockType.BitwiseAnd },
	"math/or": { block: FgBlockType.BitwiseOr },
	"math/xor": { block: FgBlockType.BitwiseXor },
	"math/not": { block: FgBlockType.BitwiseNot },
	"math/lsl": { block: FgBlockType.BitwiseLeftShift },
	"math/asr": { block: FgBlockType.BitwiseRightShift },
	"math/clz": { block: FgBlockType.LeadingZeros },
	"math/ctz": { block: FgBlockType.TrailingZeros },
	"math/popcnt": { block: FgBlockType.OneBitsCounter },
	"math/length": { block: FgBlockType.Length },
	"math/normalize": { block: FgBlockType.Normalize },
	"math/dot": { block: FgBlockType.Dot },
	"math/cross": { block: FgBlockType.Cross },
	"math/rotate3D": { block: FgBlockType.Rotate3D },
	"math/mix": { block: FgBlockType.MathInterpolation },
	"math/smoothStep": { block: FgBlockType.SmoothStep },
	"math/rgbToOkLCh": {
		block: FgBlockType.RGBToOkLCh,
		outputValues: {
			l: "l",
			c: "c",
			h: "h"
		}
	},
	"math/rgbFromOkLCh": {
		block: FgBlockType.RGBFromOkLCh,
		outputValues: {
			r: "r",
			g: "g",
			b: "b"
		}
	},
	"math/quatSlerp": { block: FgBlockType.MathSlerp },
	"math/slerp": { block: FgBlockType.VectorSlerp },
	"math/combine3": { block: FgBlockType.CombineVector3 },
	"math/combine4": { block: FgBlockType.CombineVector4 },
	"math/E": { block: FgBlockType.E },
	"math/Pi": { block: FgBlockType.PI },
	"math/Tau": { block: FgBlockType.Tau },
	"math/Inf": { block: FgBlockType.Inf },
	"math/NaN": { block: FgBlockType.NaN },
	"math/random": { block: FgBlockType.Random },
	"type/boolToFloat": { block: FgBlockType.BooleanToFloat },
	"type/boolToInt": { block: FgBlockType.BooleanToInt },
	"type/floatToBool": { block: FgBlockType.FloatToBoolean },
	"type/intToBool": { block: FgBlockType.IntToBoolean },
	"type/intToFloat": { block: FgBlockType.IntToFloat },
	"type/floatToInt": { block: FgBlockType.FloatToInt },
	"math/extract3": {
		block: FgBlockType.ExtractVector3,
		outputValues: {
			"0": "x",
			"1": "y",
			"2": "z"
		}
	},
	"math/extract4": {
		block: FgBlockType.ExtractVector4,
		outputValues: {
			"0": "x",
			"1": "y",
			"2": "z",
			"3": "w"
		}
	},
	"math/rotate2D": {
		block: FgBlockType.Rotate2D,
		valueInputs: { angle: "b" }
	},
	"math/select": {
		block: FgBlockType.Conditional,
		valueInputs: {
			condition: "condition",
			a: "onTrue",
			b: "onFalse"
		}
	},
	"math/switch": {
		block: FgBlockType.DataSwitch,
		configArrayKeys: { cases: "cases" }
	},
	"math/transform": { block: FgBlockType.TransformVector },
	"math/transpose": { block: FgBlockType.Transpose },
	"math/determinant": { block: FgBlockType.Determinant },
	"math/inverse": { block: FgBlockType.InvertMatrix },
	"math/matMul": { block: FgBlockType.MatrixMultiplication },
	"math/matCompose": {
		block: FgBlockType.MatrixCompose,
		valueInputs: {
			translation: "position",
			rotation: "rotationQuaternion",
			scale: "scaling"
		}
	},
	"math/matDecompose": {
		block: FgBlockType.MatrixDecompose,
		valueInputs: { a: "input" },
		outputValues: {
			translation: "position",
			rotation: "rotationQuaternion",
			scale: "scaling"
		}
	},
	"math/combine2x2": {
		block: FgBlockType.CombineMatrix2D,
		valueInputs: {
			a: "input_0",
			b: "input_1",
			c: "input_2",
			d: "input_3"
		}
	},
	"math/combine3x3": {
		block: FgBlockType.CombineMatrix3D,
		valueInputs: {
			a: "input_0",
			b: "input_1",
			c: "input_2",
			d: "input_3",
			e: "input_4",
			f: "input_5",
			g: "input_6",
			h: "input_7",
			i: "input_8"
		}
	},
	"math/combine4x4": {
		block: FgBlockType.CombineMatrix,
		valueInputs: {
			a: "input_0",
			b: "input_1",
			c: "input_2",
			d: "input_3",
			e: "input_4",
			f: "input_5",
			g: "input_6",
			h: "input_7",
			i: "input_8",
			j: "input_9",
			k: "input_10",
			l: "input_11",
			m: "input_12",
			n: "input_13",
			o: "input_14",
			p: "input_15"
		}
	},
	"math/extract2x2": {
		block: FgBlockType.ExtractMatrix2D,
		valueInputs: { a: "input" },
		outputValues: {
			"0": "output_0",
			"1": "output_1",
			"2": "output_2",
			"3": "output_3"
		}
	},
	"math/extract3x3": {
		block: FgBlockType.ExtractMatrix3D,
		valueInputs: { a: "input" },
		outputValues: {
			"0": "output_0",
			"1": "output_1",
			"2": "output_2",
			"3": "output_3",
			"4": "output_4",
			"5": "output_5",
			"6": "output_6",
			"7": "output_7",
			"8": "output_8"
		}
	},
	"math/extract4x4": {
		block: FgBlockType.ExtractMatrix,
		valueInputs: { a: "input" },
		outputValues: {
			"0": "output_0",
			"1": "output_1",
			"2": "output_2",
			"3": "output_3",
			"4": "output_4",
			"5": "output_5",
			"6": "output_6",
			"7": "output_7",
			"8": "output_8",
			"9": "output_9",
			"10": "output_10",
			"11": "output_11",
			"12": "output_12",
			"13": "output_13",
			"14": "output_14",
			"15": "output_15"
		}
	},
	"math/quatConjugate": { block: FgBlockType.Conjugate },
	"math/quatAngleBetween": { block: FgBlockType.AngleBetween },
	"math/quatFromAxisAngle": {
		block: FgBlockType.QuaternionFromAxisAngle,
		valueInputs: {
			axis: "a",
			angle: "b"
		}
	},
	"math/quatToAxisAngle": { block: FgBlockType.AxisAngleFromQuaternion },
	"math/quatFromDirections": { block: FgBlockType.QuaternionFromDirections },
	"math/quatFromUpForward": {
		block: FgBlockType.QuaternionFromUpForward,
		valueInputs: {
			up: "a",
			forward: "b"
		}
	},
	"math/quatFromAngles": {
		block: FgBlockType.QuaternionFromAngles,
		valueInputs: {
			x: "a",
			y: "b",
			z: "c"
		},
		configKeys: { order: "order" }
	},
	"math/quatMul": { block: FgBlockType.QuaternionMultiplication },
	"variable/get": {
		block: FgBlockType.GetVariable,
		variableConfigKey: "variable"
	},
	"variable/set": {
		block: FgBlockType.SetVariable,
		configArrayKeys: { variables: "variables" }
	},
	"pointer/get": {
		block: FgBlockType.GetProperty,
		pointer: true
	},
	"pointer/set": {
		block: FgBlockType.SetProperty,
		pointer: true,
		flowOutputs: { err: "error" }
	},
	"animation/start": {
		block: FgBlockType.PlayAnimation,
		valueInputs: {
			startTime: "from",
			endTime: "to"
		},
		valueTransform: {
			startTime: FPS,
			endTime: FPS
		},
		connectedValueScale: {
			startTime: 60,
			endTime: 60
		},
		flowOutputs: { err: "error" }
	},
	"animation/stop": {
		block: FgBlockType.StopAnimation,
		flowOutputs: { err: "error" }
	},
	"animation/stopAt": {
		block: FgBlockType.StopAnimation,
		valueInputs: { stopTime: "stopAtFrame" },
		valueTransform: { stopTime: FPS },
		connectedValueScale: { stopTime: 60 },
		flowOutputs: { err: "error" }
	},
	"debug/log": {
		block: FgBlockType.ConsoleLog,
		configKeys: { message: "messageTemplate" }
	},
	"event/send": {
		block: FgBlockType.SendCustomEvent,
		configKeys: { event: "eventId" }
	},
	"event/receive": {
		block: FgBlockType.ReceiveCustomEvent,
		configKeys: { event: "eventId" },
		flowOutputs: { out: "done" }
	},
	"event/stopPropagation": { block: FgBlockType.StopEventPropagation },
	"ref/eq": { block: FgBlockType.Equality },
	"variable/interpolate": {
		block: FgBlockType.ValueInterpolation,
		variableConfigKey: "variable",
		valueInputs: {
			value: "endValue",
			duration: "duration",
			p1: "p1",
			p2: "p2"
		},
		configKeys: { useSlerp: "useSlerp" },
		flowOutputs: { err: "error" }
	},
	"pointer/interpolate": {
		block: FgBlockType.ValueInterpolation,
		pointer: true,
		valueInputs: {
			value: "endValue",
			duration: "duration",
			p1: "p1",
			p2: "p2"
		},
		flowOutputs: { err: "error" }
	}
};
/** Extension-namespaced op tables, keyed by `declaration.extension`. */
var EXTENSION_OPS = {
	BABYLON: { "flow/log": { block: FgBlockType.ConsoleLog } },
	KHR_node_selectability: { "event/onSelect": {
		block: FgBlockType.OnSelect,
		nodeConfigKey: "nodeIndex"
	} }
};
/** Look up the Lite mapping for a glTF op, honoring the declaration `extension`.
*  Returns `null` for an unknown op so the parser can fail loudly. */
function getOpMapping(op, extension) {
	if (extension) return EXTENSION_OPS[extension]?.[op] ?? null;
	return NATIVE_OPS[op] ?? null;
}
/** Every distinct Lite block type referenced by some op mapping (native or
*  extension). Used by a coverage guard to prove every mapped op resolves to a
*  registered block def. */
function allMappedBlockTypes() {
	const types = /* @__PURE__ */ new Set();
	for (const m of Object.values(NATIVE_OPS)) types.add(m.block);
	for (const table of Object.values(EXTENSION_OPS)) for (const m of Object.values(table)) types.add(m.block);
	return [...types];
}
export { ANIMATION_FPS, DEFAULT_FLOW_SOCKET, DEFAULT_VALUE_SOCKET, allMappedBlockTypes, getOpMapping };

//# sourceMappingURL=declaration-mapper.js.map