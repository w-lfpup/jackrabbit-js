import { METHODS, type IncomingMessage, type ServerResponse } from "http";
import * as fs from "fs";
import * as path from "path";
import { Listeners } from "./listeners.js";
import { testHanger } from "./test_hangar.js";
import { ConfigInterface } from "./config.js";
import { log } from "./logger.js";

let cwd = process.cwd();

let corePath = path.join(import.meta.url, "../../../core/dist/");
let browserPath = path.join(import.meta.url, "../../../browser/dist/");

const MIME_TYPES: Record<string, string> = {
	octet: "application/octet-stream",
	html: "text/html; charset=UTF-8",
	js: "text/javascript",
	css: "text/css",
	png: "image/png",
	jpg: "image/jpeg",
	ico: "image/x-icon",
	svg: "image/svg+xml",
};

export class Router {
	#listeners = new Listeners();
	#config: ConfigInterface;

	constructor(config: ConfigInterface) {
		this.#config = config;
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
			res.end();
			return;
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
			return log(req, res, this.#listeners);
		}

		let ext = "";
		if (url.endsWith("/")) ext = "index.html";
		let filePath = path.join(cwd, url, ext);

		// this assumes http 1.1
		//
		// only serve core and browser packages
		let stream: fs.ReadStream | undefined;
		if (filePath.startsWith("/jackrabbit/core/") && "GET" === method) {
			stream = await getFile(filePath, corePath);
		}
		if (filePath.startsWith("/jackrabbit/browser/") && "GET" === method) {
			stream = await getFile(filePath, browserPath);
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
		}
	}

	addEventListener(eventName: string, cb: EventListener) {
		this.#listeners.addEventListener(eventName, cb);
	}
}

async function getFile(
	filePath: string,
	basePath: string,
): Promise<fs.ReadStream | undefined> {
	if (!filePath.startsWith(basePath)) return;

	let exists = await fs.promises.access(filePath, fs.constants.R_OK).then(
		function () {
			return true;
		},
		function () {
			return false;
		},
	);

	if (exists) return fs.createReadStream(filePath);
}
