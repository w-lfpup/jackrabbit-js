import type { IncomingMessage, ServerResponse } from "http";
import * as path from "path";
import { Listeners } from "./listeners.js";

let cwd = path.parse(process.cwd());

let repoParentPath = path.join(import.meta.url, "../../../");

export class Router {
	#listeners = new Listeners();

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
				// send "test" home page
			}

			// otherwise send file based on cwd
		}
	}

	addEventListener(eventName: string, cb: EventListener) {
		// only have a callback for "end" or "error"
		this.#listeners.addEventListener(eventName, cb);
	}
}
