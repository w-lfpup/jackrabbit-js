import type { IncomingMessage, ServerResponse } from "http";
import * as path from "path";

let cwd = path.parse(process.cwd());

let repoParentPath = path.join(import.meta.url, "../../../");

export class Router {
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
			}

			if (url === "/") {
				// send "test" home page
			}

			// otherwise send file based on cwd
		}
	}

	addEventListener(eventName: string, cb: EventListener) {
		// only have a callback for "end" or "error"
	}

	#dispatchEvent(eventName: string) {
		// iterate through
	}
	// begin cycling tests and dependences
	start() {}
}

function route(req: Request, res: Response) {
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
		}

		if (url === "/") {
			// send "test" home page
		}

		// otherwise send file based on cwd
	}
}
