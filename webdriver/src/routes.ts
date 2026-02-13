import { METHODS, type IncomingMessage, type ServerResponse } from "http";
import * as path from "path";
import { Listeners } from "./listeners.js";
import { testHanger } from "./test_hangar.js";
import { ConfigInterface } from "./config.js";
import { log } from "./logger.js";

let cwd = path.parse(process.cwd());

let repoParentPath = path.join(import.meta.url, "../../../");

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
	#route(req: IncomingMessage, res: ServerResponse) {
		// router logic here

		// ROUTES
		//
		let { url, method } = req;
		if (!url) return;
		// this assumes http 1.1
		if (url.startsWith("/jackrabbit/core/")) {
			// load jackrabbit library resource
		}
		if (url.startsWith("/jackrabbit/browser/")) {
			// load browser resource
		}
		if (url.startsWith("/log/")) {
			log(req, res, this.#listeners);
		}

		// send "test" home page
		if (url === "/") {
			let hangar = testHanger({
				jackrabbit_url: this.#config.hostAndPort,
				test_collections: process.argv.slice(3),
			});

			res.setHeader("Content-Type", "text/html");
			res.writeHead(200);
			res.end(hangar);
		}
	}

	addEventListener(eventName: string, cb: EventListener) {
		this.#listeners.addEventListener(eventName, cb);
	}
}
