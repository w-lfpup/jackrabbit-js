"use strict";

export class Route {
	route = this.#route.bind(this);
	callbacks: [string, EventListener][] = [];

	#route(req: Request, res: Response) {
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

	addEventListener(eventName: string, cb: (e: Event) => {}) {}
}
