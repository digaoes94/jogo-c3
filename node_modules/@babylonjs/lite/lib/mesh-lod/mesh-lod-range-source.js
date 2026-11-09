import { createMeshLoDError } from "./mesh-lod-errors.js";
// src/mesh-lod/mesh-lod-range-source.ts
/** First bootstrap read spans the header + directory (+ often all metadata). */
var BOOTSTRAP_FIRST_END = 65535;
/** @internal Throw `MLOD_ABORTED` if the signal is already aborted. */
function throwIfAborted(signal) {
	if (signal?.aborted) throw createMeshLoDError("MLOD_ABORTED", "operation aborted");
}
function isAbortError(cause) {
	return typeof cause === "object" && cause !== null && cause.name === "AbortError";
}
function sliceRange(bytes, start, end) {
	const clampedEnd = Math.min(end, bytes.length - 1);
	if (start < 0 || start > clampedEnd) throw createMeshLoDError("MLOD_INVALID_LAYOUT", "requested range is outside the file", {
		expected: bytes.length,
		actual: start
	});
	return bytes.subarray(start, clampedEnd + 1);
}
function parseContentRange(value) {
	if (!value) return null;
	const match = /^bytes\s+(\d+)-(\d+)\/(\d+)$/.exec(value.trim());
	if (!match) return null;
	const start = Number(match[1]);
	const end = Number(match[2]);
	const total = Number(match[3]);
	return Number.isSafeInteger(start) && Number.isSafeInteger(end) && Number.isSafeInteger(total) && total > 0 ? {
		start,
		end,
		total
	} : null;
}
function throwIfSourceDisposed(disposed) {
	if (disposed) throw createMeshLoDError("MLOD_DISPOSED", "range source has been disposed");
}
function createMemorySource(input) {
	let bytes = input;
	return {
		totalBytes: input.length,
		get completeBytes() {
			return bytes;
		},
		downloadedBytes: 0,
		async read(start, end, signal) {
			throwIfSourceDisposed(bytes === null);
			throwIfAborted(signal);
			return sliceRange(bytes, start, end);
		},
		dispose() {
			bytes = null;
		}
	};
}
function createUrlSource(url, request) {
	const fetchImpl = request?.fetch ?? globalThis.fetch;
	let totalBytes = null;
	let completeBytes = null;
	let downloadedBytes = 0;
	let disposed = false;
	async function readBody(response, signal) {
		try {
			return new Uint8Array(await response.arrayBuffer());
		} catch (cause) {
			throwIfSourceDisposed(disposed);
			if (isAbortError(cause) || signal?.aborted) throw createMeshLoDError("MLOD_ABORTED", "range response body aborted", {
				url,
				cause
			});
			throw createMeshLoDError("MLOD_HTTP_STATUS", "range response body failed", {
				url,
				cause
			});
		}
	}
	async function read(start, end, signal) {
		throwIfSourceDisposed(disposed);
		throwIfAborted(signal);
		if (completeBytes) return sliceRange(completeBytes, start, end);
		const headers = new Headers(request?.headers);
		headers.set("Range", `bytes=${start}-${end}`);
		const init = {
			headers,
			signal
		};
		if (request?.credentials !== void 0) init.credentials = request.credentials;
		let response;
		try {
			response = await fetchImpl(url, init);
		} catch (cause) {
			throwIfSourceDisposed(disposed);
			if (isAbortError(cause) || signal?.aborted) throw createMeshLoDError("MLOD_ABORTED", "range request aborted", {
				url,
				cause
			});
			throw createMeshLoDError("MLOD_HTTP_STATUS", "range request failed", {
				url,
				cause
			});
		}
		throwIfSourceDisposed(disposed);
		if (response.status !== 200 && response.status !== 206) throw createMeshLoDError("MLOD_HTTP_STATUS", response.status === 304 ? "unexpected 304 Not Modified" : "unexpected response status", {
			url,
			actual: response.status
		});
		const encoding = response.headers.get("Content-Encoding");
		if (encoding && encoding.toLowerCase() !== "identity") throw createMeshLoDError("MLOD_HTTP_ENCODING", "response used a non-identity content encoding", {
			url,
			actual: encoding
		});
		if (response.status === 206) {
			if ((response.headers.get("Content-Type") ?? "").toLowerCase().includes("multipart/byteranges")) throw createMeshLoDError("MLOD_HTTP_RANGE", "multipart range responses are not supported", { url });
			const range = parseContentRange(response.headers.get("Content-Range"));
			if (!range) throw createMeshLoDError("MLOD_HTTP_RANGE", "missing or malformed Content-Range", { url });
			const expectedEnd = Math.min(end, range.total - 1);
			if (range.start !== start || range.end !== expectedEnd || range.end < range.start) throw createMeshLoDError("MLOD_HTTP_RANGE", "Content-Range does not match the request", {
				url,
				expected: `${start}-${expectedEnd}`,
				actual: `${range.start}-${range.end}`
			});
			if (totalBytes !== null && totalBytes !== range.total) throw createMeshLoDError("MLOD_HTTP_RANGE", "Content-Range total changed between requests", {
				url,
				expected: totalBytes,
				actual: range.total
			});
			const body = await readBody(response, signal);
			throwIfSourceDisposed(disposed);
			if (body.length !== range.end - range.start + 1) throw createMeshLoDError("MLOD_HTTP_RANGE", "response length disagrees with Content-Range", {
				url,
				expected: range.end - range.start + 1,
				actual: body.length
			});
			totalBytes = range.total;
			downloadedBytes += body.length;
			return body;
		}
		const body = await readBody(response, signal);
		throwIfSourceDisposed(disposed);
		downloadedBytes += body.length;
		if (totalBytes !== null && totalBytes !== body.length) throw createMeshLoDError("MLOD_HTTP_RANGE", "full response length disagrees with the known total", {
			url,
			expected: totalBytes,
			actual: body.length
		});
		totalBytes = body.length;
		completeBytes = body;
		return sliceRange(body, start, end);
	}
	return {
		get totalBytes() {
			return totalBytes;
		},
		get completeBytes() {
			return completeBytes;
		},
		get downloadedBytes() {
			return downloadedBytes;
		},
		read,
		dispose() {
			disposed = true;
			completeBytes = null;
		}
	};
}
/** Create a range source for a URL, `ArrayBuffer`, or `Blob`. `ArrayBuffer`/`Blob`
*  inputs are materialized as complete-file sources; a `Blob` is read fully into
*  memory. */
async function createMeshLoDRangeSource(source, request) {
	if (typeof source === "string") return createUrlSource(source, request);
	if (source instanceof Blob) return createMemorySource(new Uint8Array(await source.arrayBuffer()));
	return createMemorySource(new Uint8Array(source));
}
/** Concatenate two byte ranges into a contiguous buffer. */
function concatBytes(a, b) {
	const out = new Uint8Array(a.length + b.length);
	out.set(a, 0);
	out.set(b, a.length);
	return out;
}
export { BOOTSTRAP_FIRST_END, concatBytes, createMeshLoDRangeSource, throwIfAborted };

//# sourceMappingURL=mesh-lod-range-source.js.map