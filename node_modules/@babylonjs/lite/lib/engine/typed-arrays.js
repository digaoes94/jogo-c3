// src/engine/typed-arrays.ts
/**
* Short aliases for global typed-array / DataView constructors.
*
* These globals cannot be renamed by the minifier, so each `new Float32Array`
* ships the full constructor name. Importing these aliases (mangled to a single
* character per chunk) shrinks every `new`/`instanceof` use to a tiny token with
* identical runtime semantics. Aliases are value-only and used solely in value
* positions (construction / `instanceof`); type annotations keep the real names.
*/
var F32 = Float32Array;
var F64 = Float64Array;
var U32 = Uint32Array;
var I32 = Int32Array;
var U16 = Uint16Array;
var I16 = Int16Array;
var U8 = Uint8Array;
var I8 = Int8Array;
var U8C = Uint8ClampedArray;
var DV = DataView;
export { DV, F32, F64, I16, I32, I8, U16, U32, U8, U8C };

//# sourceMappingURL=typed-arrays.js.map