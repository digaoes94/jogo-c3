// src/shader/wgsl.ts
/** Identity tag that marks a template literal as WGSL for build-time processing. */
function wgsl(strings, ...values) {
	let source = strings[0];
	for (let i = 0; i < values.length; i++) source += String(values[i]) + strings[i + 1];
	return source;
}
export { wgsl };

//# sourceMappingURL=wgsl.js.map