import { METHODS, type IncomingMessage, type ServerResponse } from "http";
import * as fs from "fs";
import * as path from "path";
import { testHanger } from "./test_hangar.js";
import { ConfigInterface } from "./config.js";

import {
	LoggerAction,
	LoggerInterface,
} from "../../core/dist/jackrabbit_types.js";
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

export class RouterEvent extends Event {
	webdriverID: string;
	constructor(type: string, webdriverID: string, eventInitDict?: EventInit) {
		super(type, eventInitDict);
		this.webdriverID = webdriverID;
	}
}

export class Router {
	// #listeners = new Listeners();
	#config: ConfigInterface;
	#logger: LoggerInterface;

	constructor(config: ConfigInterface, eventbus: EventBus) {
		this.#config = config;
		this.#logger = logger;
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

		// "test" home page
		if (url === "/" && "GET" === method) {
			let hangar = testHanger({
				jackrabbit_url: this.#config.hostAndPort,
				test_collections: process.argv.slice(3),
			});

			res.setHeader("Content-Type", "text/html");
			res.writeHead(200);
			return res.end(hangar);
		}

		// log test actions
		if (url.startsWith("/log/") && "POST" === method) {
			// send listeners, logger
			//

			// get the session cookie
			// get the json body
			// confirm the url with action.type

			// log event
			return log(req, res, this.#logger, this.#listeners);
		}

		let ext = "";
		if (url.endsWith("/")) ext = "index.html";
		let urlNoPrefix = url;
		if (url.startsWith("/jackrabbit")) urlNoPrefix = url.substring(11);

		let filePath = path.join(cwd, urlNoPrefix, ext);
		// this assumes http 1.1
		//
		// only serve core and browser packages
		let stream: fs.ReadStream | undefined;
		if (url.startsWith("/jackrabbit/core/") && "GET" === method) {
			stream = await getFile(filePath, corePath);
		}
		if (url.startsWith("/jackrabbit/browser/") && "GET" === method) {
			stream = await getFile(filePath, browserPath);
		}

		if (!url.startsWith("/jackrabbit") && "GET" === method) {
			stream = await getFile(filePath, cwd);
		}

		if (stream) {
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
}

async function getFile(
	filePath: string,
	basePath: string,
): Promise<fs.ReadStream | undefined> {
	if (!filePath.startsWith(basePath)) return;

	try {
		await fs.promises.access(filePath);
		return fs.createReadStream(filePath);
	} catch {}
}

// events like "complete" don't make sense in async

async function log(
	req: IncomingMessage,
	res: ServerResponse,
	logger: LoggerInterface,
	listeners: Listeners,
) {
	console.log("cookie?", req.headers.cookie);

	let data: Uint8Array[] = [];
	req.on("data", function (chunk) {
		data.push(chunk);
	});
	req.on("end", function () {
		let actionStr = Buffer.concat(data).toString();
		let action = JSON.parse(actionStr);

		logger.log(action);

		if ("end_run" === action.type) {
			listeners.dispatchEvent(new Event("complete"));
		}

		if ("run_error" === action.type) {
			listeners.dispatchEvent(new Event("error"));
			listeners.dispatchEvent(new Event("complete"));
		}

		res.writeHead(200);
		res.end();
	});
	// req.on("error", function(){})
}
