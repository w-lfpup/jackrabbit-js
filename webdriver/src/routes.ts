import { METHODS, type IncomingMessage, type ServerResponse } from "http";
import * as path from "path";
import { Listeners } from "./listeners.js";
import { testHanger } from "./test_hangar.js";
import { ConfigInterface } from "./config.js";

let cwd = path.parse(process.cwd());

let repoParentPath = path.join(import.meta.url, "../../../");

export class Router {
	#listeners = new Listeners();
	#config: ConfigInterface;

	constructor(config: ConfigInterface) {
		this.#config = config;
	}

	route = this.#route.bind(this);

	#route(req: IncomingMessage, res: ServerResponse) {
		// router logic here

		// ROUTES
		//
		let { url, method } = req;
		// this assumes http 1.1
		if (url) {
			if (
				url.startsWith("/jackrabbit/core/") ||
				url.startsWith("/jackrabbit/browser/")
			) {
				// load jackrabbit library
			}

			if (url.startsWith("/log/")) {
				// pass to logger
			}

			// send "test" home page
			if (url === "/") {
				let hangar = testHanger({
					jackrabbit_url: this.#config.hostAndPort,
					test_collections: [],
				});

				res.setHeader("Content-Type", "text/html");
				res.writeHead(200);
				res.end(hangar);
			}

			// stretch goal
			if (url.startsWith("/webdriver/screenshot")) {
			}
			if (url.startsWith("/webdriver/close") && "POST" === method) {
				this.#listeners.dispatchEvent(new Event("complete"));
			}
		}
	}

	addEventListener(eventName: string, cb: EventListener) {
		// only have a callback for "end" or "error"
		this.#listeners.addEventListener(eventName, cb);
	}
}
