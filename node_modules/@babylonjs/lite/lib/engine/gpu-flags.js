// src/engine/gpu-flags.ts
/**
* Short aliases for the WebGPU global flag namespaces.
*
* `GPUTextureUsage`, `GPUBufferUsage`, `GPUShaderStage`, and `GPUColorWrite`
* are global identifiers the minifier cannot rename, so every reference ships
* the full ~14-char name. Importing these one-letter aliases (which the
* minifier mangles to a single character per chunk) replaces the verbose
* global with a tiny token at every flag use, with identical runtime values.
*/
var TU = globalThis.GPUTextureUsage;
var BU = globalThis.GPUBufferUsage;
var SS = globalThis.GPUShaderStage;
var CW = globalThis.GPUColorWrite;
export { BU, CW, SS, TU };

//# sourceMappingURL=gpu-flags.js.map