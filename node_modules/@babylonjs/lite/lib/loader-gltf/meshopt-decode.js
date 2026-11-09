// src/loader-gltf/meshopt-decode.ts
/**
* Lazy EXT_meshopt_compression decoder.
*
* The meshoptimizer decoder (JS glue + embedded WASM) is loaded from
* `/meshopt_decoder.js` on first use via a `<script>` injection — exactly like
* the Draco decoder. This keeps bundle size at zero bytes for scenes that do
* not load meshopt-compressed glTF assets: the entire module (including this
* file) is dynamic-imported from the meshopt feature only when an asset's
* `extensionsUsed` lists EXT_meshopt_compression.
*/
var meshoptBaseUrl = "https://cdn.babylonjs.com/";
/** Override the base URL where meshopt_decoder.js is hosted. */
function setMeshoptBaseUrl(url) {
	meshoptBaseUrl = url.endsWith("/") ? url : url + "/";
}
var scriptLoadPromise = null;
function loadMeshoptScript() {
	if (scriptLoadPromise) return scriptLoadPromise;
	scriptLoadPromise = new Promise((resolve, reject) => {
		const existing = globalThis.MeshoptDecoder;
		if (existing) {
			resolve(existing);
			return;
		}
		const script = document.createElement("script");
		script.src = meshoptBaseUrl + "meshopt_decoder.js";
		const cleanup = () => {
			script.onload = null;
			script.onerror = null;
			script.remove();
		};
		const fail = (message) => {
			cleanup();
			reject(new Error(message));
		};
		script.onload = () => {
			const mod = globalThis.MeshoptDecoder;
			if (!mod) fail("meshopt_decoder.js loaded but MeshoptDecoder is undefined");
			else {
				cleanup();
				resolve(mod);
			}
		};
		script.onerror = () => fail("Failed to load meshopt_decoder.js from " + script.src);
		document.head.appendChild(script);
	});
	scriptLoadPromise.catch(() => {
		scriptLoadPromise = null;
	});
	return scriptLoadPromise;
}
/** Resolve the ready meshopt decoder module (WASM instantiated). */
async function getMeshoptDecoder() {
	const mod = await loadMeshoptScript();
	await mod.ready;
	return mod;
}
export { getMeshoptDecoder, setMeshoptBaseUrl };

//# sourceMappingURL=meshopt-decode.js.map