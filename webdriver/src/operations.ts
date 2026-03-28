import type { WebdriverParams } from "./config.js";
import type { IncomingMessage, ServerResponse } from "http";

import * as fs from "fs";
import * as path from "path";

let headers = new Headers([["Content-Type", "application/json"]]);
let cwd = process.cwd();
const parentPath = path.join(import.meta.url.substring(5), "../../../");

const MIME_TYPES: Record<string, string> = {
	octet: "application/octet-stream",
	html: "text/html; charset=UTF-8",
	js: "text/javascript",
	json: "application/json",
	css: "text/css",
	png: "image/png",
	jpg: "image/jpeg",
	ico: "image/x-icon",
	svg: "image/svg+xml",
};

export async function untilWebdriverReady(
	params: WebdriverParams,
	signal: AbortSignal | undefined,
): Promise<void> {
	let { url } = params;

	while (signal && !signal.aborted) {
		try {
			// this should be a command
			let res = await fetch(new URL("/status", url), {
				method: "GET",
				headers,
				body: null,
				signal,
			});

			if (200 === res.status) {
				let json = await res.json();
				let { ready } = json?.value;
				if (typeof ready === "boolean" && ready) return;
			}
		} catch {}

		await sleep(30);
	}

	throw new Error("Webdriver was never ready.");
}

function sleep(timeMs: number): Promise<void> {
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve();
		}, timeMs);
	});
}

export async function serveFile(req: IncomingMessage, res: ServerResponse) {
	let { url, method } = req;

	if (!url || "GET" !== method) {
		res.setHeader("Content-Type", MIME_TYPES["html"]);
		res.writeHead(400);
		res.end();
		return;
	}

	// assume http 1.1
	let urlFilePath = path.join(url);

	let extStr = "";
	if (urlFilePath.endsWith("/")) extStr = "index.html";

	if (urlFilePath.startsWith("/jackrabbit")) {
		let strippedUrl = urlFilePath.substring("/jackrabbit".length);
		urlFilePath = path.join(parentPath, strippedUrl, extStr);
	} else {
		urlFilePath = path.join(cwd, urlFilePath, extStr);
	}

	let stream = await getFile(urlFilePath);
	if (!stream) {
		res.setHeader("Content-Type", MIME_TYPES["html"]);
		res.writeHead(404);
		res.end();
		return;
	}

	// throws errors if not a string
	// filepath is always a string
	const ext = path.extname(urlFilePath).substring(1).toLowerCase();
	let mimeType = MIME_TYPES[ext] ?? MIME_TYPES["octet"];
	res.setHeader("Content-Type", mimeType);
	res.writeHead(200);
	stream.pipe(res);
}

async function getFile(filePath: string): Promise<fs.ReadStream | undefined> {
	try {
		await fs.promises.access(filePath);
		return fs.createReadStream(filePath);
	} catch {}
}
