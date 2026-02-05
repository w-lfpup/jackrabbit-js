import type { IncomingMessage, ServerResponse } from "http";
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
		let { url } = req;
		if (url) {
			if (url.startsWith("/jackrabbit/core/")) {
				// load jackrabbit library
				// based on repo path
			}

			if (url.startsWith("/jackrabbit/browser/")) {
				// load jackrabbit library
			}

			if (url.startsWith("/log/")) {
				// if "end_run"
				// abortController.abort();
				// server.close();
				// send signal success / fail

				this.#listeners.dispatchEvent(new Event("complete"));
			}

			if (url === "/") {
				console.log("get homepage!!");
				// send "test" home page
				let hangar = testHanger({
					jackrabbit_url: this.#config.hostAndPort,
					test_collections: [],
				});

				res.setHeader("Content-Type", "text/html");
				res.writeHead(200);
				res.end(hangar);
			}

			// otherwise send file based on cwd
		}
	}

	addEventListener(eventName: string, cb: EventListener) {
		// only have a callback for "end" or "error"
		this.#listeners.addEventListener(eventName, cb);
	}
}
