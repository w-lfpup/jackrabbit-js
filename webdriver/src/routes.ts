import type { IncomingMessage, ServerResponse } from "http";
import * as fs from "fs";
import * as path from "path";
import { testHanger } from "./test_hangar.js";
import { ConfigInterface } from "./config.js";

import { LoggerAction } from "../../core/dist/jackrabbit_types.js";
import type { EventBus } from "./eventbus.js";

let cwd = process.cwd();

// better done with URL? feels weird
let corePath = path.join(import.meta.url.substring(5), "../../../core/dist/");
let browserPath = path.join(
	import.meta.url.substring(5),
	"../../../browser/dist/",
);

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
	#eventbus: EventBus;

	constructor(config: ConfigInterface, eventbus: EventBus) {
		this.#config = config;
		this.#eventbus = eventbus;
	}

	get route() {
		return this.#boundRoute;
	}

	#boundRoute = this.#route.bind(this);
	async #route(req: IncomingMessage, res: ServerResponse) {
		let { url, method } = req;

		if (!url) {
			res.setHeader("Content-Type", "text/html");
			res.writeHead(400);
			return res.end();
		}

		if (url === "/ping" && "GET" === method) {
			res.setHeader("Content-Type", "text/html");
			res.writeHead(200);
			return res.end("The cookie train has arrived!");
		}

		// "test" home page
		serveTestPage(req, res, this.#config);

		// log test actions
		logAction(req, res, this.#eventbus);

		await serveFile(req, res);
	}
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

async function getDirectoryScopedFile(
	filePath: string,
	basePath: string,
): Promise<fs.ReadStream | undefined> {
	if (!filePath.startsWith(basePath)) return;

	try {
		await fs.promises.access(filePath);
		return fs.createReadStream(filePath);
	} catch {}
}

function serveTestPage(
	req: IncomingMessage,
	res: ServerResponse,
	config: ConfigInterface,
) {
	let { url, method } = req;

	if (url === "/" && "GET" === method) {
		let hangar = testHanger({
			jackrabbit_url: config.hostAndPort,
			test_collections: process.argv.slice(3),
		});

		res.setHeader("Content-Type", "text/html");
		res.writeHead(200);
		return res.end(hangar);
	}
}

async function logAction(
	req: IncomingMessage,
	res: ServerResponse,
	eventbus: EventBus,
) {
	let { url, method } = req;

	if (url?.startsWith("/log/") && "POST" === method) {
		let id: string | undefined;
		let cookies = req.headers.cookie?.split(";") ?? [];
		for (const cookieLine of cookies) {
			if (cookieLine.startsWith("jackrabbit=")) {
				let [_name, value] = cookieLine.split("=");
				id = value;
			}
		}

		if (id) {
			let loggerAction = await getLoggerActionFromRequestBody(req);
			eventbus.dispatchAction({
				type: "log",
				loggerAction,
				id,
			});
			res.writeHead(200);
		} else {
			res.writeHead(403);
		}

		return res.end();
	}
}

async function serveFile(req: IncomingMessage, res: ServerResponse) {
	let { url, method } = req;

	if (!url) return;

	let ext = "";
	if (url.endsWith("/")) ext = "index.html";
	let urlNoPrefix = url;
	if (url.startsWith("/jackrabbit")) urlNoPrefix = url.substring(11);
	let filePath = path.join(cwd, urlNoPrefix, ext);

	let stream: fs.ReadStream | undefined;
	if (url.startsWith("/jackrabbit/core/") && "GET" === method) {
		stream = await getDirectoryScopedFile(filePath, corePath);
	}
	if (url.startsWith("/jackrabbit/browser/") && "GET" === method) {
		stream = await getDirectoryScopedFile(filePath, browserPath);
	}

	if (!url.startsWith("/jackrabbit") && "GET" === method) {
		stream = await getDirectoryScopedFile(filePath, cwd);
	}

	if (stream) {
		// throwing errors and stuff
		const ext = path.extname(filePath).substring(1).toLowerCase();
		let mimeType = MIME_TYPES[ext] ?? MIME_TYPES["octet"];
		res.setHeader("Content-Type", mimeType);
		res.writeHead(200);
		stream.pipe(res);
	} else {
		res.setHeader("Content-Type", MIME_TYPES["html"]);
		res.writeHead(404);
		res.end();
	}
}
