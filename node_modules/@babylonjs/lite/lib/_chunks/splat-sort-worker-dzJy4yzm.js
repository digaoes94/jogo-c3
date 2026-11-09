// src/loader-splat/splat-sort-worker.ts?worker&inline
var jsContent = "(()=>{function w(c,s,o,a,j){const m=o[0],u=o[1],b=o[2],d=o[3],f=j[0];let r=1/0,g=-1/0;for(let t=0;t<s;t++){f[t]=m*c[3*t]+u*c[3*t+1]+b*c[3*t+2]+d;const n=f[t];n-n===0&&(n<r&&(r=n),n>g&&(g=n))}const h=g-r;if(!(h>1e-12)){for(let t=0;t<s;t++)a[t]=t;return}const e=j[1];e.fill(0);const i=e.length-1,p=i/h;for(let t=0;t<s;t++){const n=f[t];let l;n-n===0?(l=(n-r)*p|0,l>i&&(l=i)):l=i,f[t]=l,e[l]++}let M=0;for(let t=i;t>=0;t--){const n=e[t];e[t]=M,M+=n}for(let t=0;t<s;t++){const n=f[t];a[e[n]++]=t}}let y,k;self.onmessage=c=>{const s=c.data;if(s.p){y=s.p;const a=y.length/3;k=[new Float32Array(a),new Uint32Array(1<<Math.max(10,Math.min(20,Math.round(Math.log2(a/4)))))];return}const o=s.o;w(y,o.length,s.t,o,k),self.postMessage({o},[o.buffer])};})();\n";
var blob = typeof self !== "undefined" && self.Blob && new Blob(["URL.revokeObjectURL(import.meta.url);", jsContent], { type: "text/javascript;charset=utf-8" });
function WorkerWrapper(options) {
	let objURL;
	try {
		objURL = blob && (self.URL || self.webkitURL).createObjectURL(blob);
		if (!objURL) throw "";
		const worker = new Worker(objURL, {
			type: "module",
			name: options?.name
		});
		worker.addEventListener("error", () => {
			(self.URL || self.webkitURL).revokeObjectURL(objURL);
		});
		return worker;
	} catch (e) {
		return new Worker("data:text/javascript;charset=utf-8," + encodeURIComponent(jsContent), {
			type: "module",
			name: options?.name
		});
	}
}
export { WorkerWrapper as t };

//# sourceMappingURL=splat-sort-worker-dzJy4yzm.js.map