import { U8 } from "../engine/typed-arrays.js";
// src/loader-splat/splat-ply-header.ts
/** PLY header sniffing shared by the splat loaders.
*
*  Kept apart from `splat-ply-parser.ts` so `loadSplat` can recognise a PLY asset
*  statically while the parser itself stays behind a dynamic import: `.splat`
*  scenes never ship the PLY decoding code. */
/** Terminator of the ASCII PLY header. */
var PLY_HEADER_END = /end_header\r?\n/;
/** True when the buffer starts with a complete PLY ASCII header. */
function isPly(data) {
	const ubuf = new U8(data, 0, Math.min(data.byteLength, 10240));
	const header = new TextDecoder().decode(ubuf);
	return header.startsWith("ply") && PLY_HEADER_END.test(header);
}
export { PLY_HEADER_END, isPly };

//# sourceMappingURL=splat-ply-header.js.map