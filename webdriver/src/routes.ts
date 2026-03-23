import type { IncomingMessage, ServerResponse } from "http";
import type { EventBusInterface } from "./eventbus.js";
import type { LogActions } from "./eventbus.js";
import type { ConfigInterface } from "./config.js";

import * as fs from "fs";
import * as path from "path";
import { testHanger } from "./test_hangar.js";
import { webdriverCommands } from "./commands.js";
import { Datastore } from "./datastore.js";

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

// needs access to state

export class Router {
	#config: ConfigInterface;
	#eventbus: EventBusInterface;
	#datastore: Datastore;

	constructor(
		config: ConfigInterface,
		eventbus: EventBusInterface,
		datastore: Datastore,
	) {
		this.#config = config;
		this.#eventbus = eventbus;
		this.#datastore = datastore;
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
		if (webdriverCommand(req, res, this.#eventbus, this.#datastore)) return;

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
	if (!id) {
		res.writeHead(401);
		res.end();
		return true;
	}

	getJsonFromRequestBody(req)
		.then(function (loggerAction: LogActions) {
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

	return true;
}

function getCookie() {}

function webdriverCommand(
	req: IncomingMessage,
	res: ServerResponse,
	eventbus: EventBusInterface,
	datastore: Datastore,
): boolean {
	let { url, method } = req;
	if (!url?.startsWith("/cmd/")) return false;

	// make "getting a cookie" its own function
	let id: string | undefined;
	let cookies = req.headers.cookie?.split(";") ?? [];
	for (const cookieLine of cookies) {
		if (cookieLine.startsWith("jackrabbit=")) {
			let [_name, value] = cookieLine.split("=");
			id = value;
		}
	}

	if (!id) {
		res.writeHead(401);
		res.end();
		return false;
	}

	let session = datastore.getState().runs.get(id);
	let sessionId = { session };
	if (!sessionId) {
		res.writeHead(401);
		res.end();
		return false;
	}

	// send commands here
	webdriverCommands()
		.catch(function () {
			res.writeHead(401);
		})
		.finally(function () {
			res.end();
		});

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

function getJsonFromRequestBody(req: IncomingMessage): Promise<any> {
	return new Promise(function (resolve, reject) {
		let data: Uint8Array[] = [];
		req.addListener("data", function (chunk) {
			data.push(chunk);
		});
		req.addListener("end", function () {
			let actionStr = Buffer.concat(data).toString();
			let action = JSON.parse(actionStr);

			resolve(action);
		});
		req.addListener("error", function (err: Error) {
			reject(err);
		});
	});
}

function getStringFromRequestBody(req: IncomingMessage): Promise<string> {
	return new Promise(function (resolve, reject) {
		let data: Uint8Array[] = [];
		req.addListener("data", function (chunk) {
			data.push(chunk);
		});
		req.addListener("end", function () {
			let actionStr = Buffer.concat(data).toString();

			resolve(actionStr);
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
