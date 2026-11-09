import { isDomCanvas } from "./surface.js";
// src/engine/enable-surface-resize-observer.ts
/**
* Cache a DOM surface's CSS dimensions with `ResizeObserver`, avoiding layout reads
* from the per-frame `resizeSurface` call. Returns a disposer.
*/
function enableSurfaceResizeObserver(surface) {
	if (!isDomCanvas(surface.canvas) || typeof ResizeObserver === "undefined") return () => void 0;
	surface._ro?.disconnect();
	const observer = surface._ro = new ResizeObserver(([entry]) => {
		surface._w = Math.round(entry.contentRect.width);
		surface._h = Math.round(entry.contentRect.height);
	});
	observer.observe(surface.canvas);
	return () => {
		observer.disconnect();
		if (surface._ro === observer) {
			surface._ro = void 0;
			surface._w = surface._h = void 0;
		}
	};
}
export { enableSurfaceResizeObserver };

//# sourceMappingURL=enable-surface-resize-observer.js.map