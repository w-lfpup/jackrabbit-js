import type { IncomingMessage, ServerResponse } from "http";
import type { EventBusInterface } from "./eventbus.js";
import type { LoggerAction } from "../../core/dist/jackrabbit_types.js";

import * as fs from "fs";
import * as path from "path";
import { testHanger } from "./test_hangar.js";
import { ConfigInterface } from "./config.js";

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

export class Router {
	#config: ConfigInterface;
	#eventbus: EventBusInterface;

	constructor(config: ConfigInterface, eventbus: EventBusInterface) {
		this.#config = config;
		this.#eventbus = eventbus;
	}

	get route() {
		return this.#boundRoute;
	}

	#boundRoute = this.#route.bind(this);
	async #route(req: IncomingMessage, res: ServerResponse) {
		if (serveBadRequest(req, res)) return;
		if (servePing(req, res)) return;
		if (serveTestPage(req, res, this.#config)) return;
		if (logAction(req, res, this.#eventbus)) return;

		// async woes don't await if not correct
		// if (webdriverAction(req, res, this.#config, this.#eventbus))

		await serveFile(req, res);
	}
}

function serveBadRequest(req: IncomingMessage, res: ServerResponse): boolean {
	let { url } = req;
	if (url) return false;

	res.setHeader("Content-Type", "text/html");
	res.writeHead(400);
	res.end();

	return true;
}

function servePing(req: IncomingMessage, res: ServerResponse): boolean {
	let { url, method } = req;
	if (url !== "/ping" || "GET" !== method) return false;

	res.setHeader("Content-Type", "text/html");
	res.writeHead(200);
	res.end("The cookie train has arrived!");

	return true;
}

function serveTestPage(
	req: IncomingMessage,
	res: ServerResponse,
	config: ConfigInterface,
): boolean {
	let { url, method } = req;
	if (url !== "/" || "GET" !== method) return false;

	let hangar = testHanger({
		jackrabbit_url: config.hostAndPort,
		test_collections: process.argv.slice(3),
	});

	res.setHeader("Content-Type", "text/html");
	res.writeHead(200);
	res.end(hangar);

	return true;
}

function logAction(
	req: IncomingMessage,
	res: ServerResponse,
	eventbus: EventBusInterface,
): boolean {
	let { url, method } = req;
	if (!url?.startsWith("/log/") || "POST" !== method) return false;

	let id: string | undefined;
	let cookies = req.headers.cookie?.split(";") ?? [];
	for (const cookieLine of cookies) {
		if (cookieLine.startsWith("jackrabbit=")) {
			let [_name, value] = cookieLine.split("=");
			id = value;
		}
	}

	if (id) {
		getLoggerActionFromRequestBody(req)
			.then(function (loggerAction: LoggerAction) {
				eventbus.dispatchAction({
					type: "log",
					loggerAction,
					id,
				});
				res.writeHead(201);
			})
			.catch(function () {
				res.writeHead(401);
			})
			.finally(function () {
				res.end();
			});
	} else {
		res.writeHead(401);
		res.end();
	}

	return true;
}

async function serveFile(req: IncomingMessage, res: ServerResponse) {
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

function getLoggerActionFromRequestBody(
	req: IncomingMessage,
): Promise<LoggerAction> {
	return new Promise(function (resolve, reject) {
		let data: Uint8Array[] = [];
		req.addListener("data", function (chunk) {
			data.push(chunk);
		});
		req.addListener("end", function () {
			let actionStr = Buffer.concat(data).toString();
			let action = JSON.parse(actionStr) as LoggerAction;

			resolve(action);
		});
		req.addListener("error", function (err: Error) {
			reject(err);
		});
	});
}

async function getFile(filePath: string): Promise<fs.ReadStream | undefined> {
	try {
		await fs.promises.access(filePath);
		return fs.createReadStream(filePath);
	} catch {}
}
