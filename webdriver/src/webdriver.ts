import type { ConfigInterface } from "./config.js";
import { ChildProcess, exec } from "child_process";
import { Listeners } from "./listeners.js";

// Events
// - complete
// - error

interface WebDriverSessionParams {
	host: URL;
	command: string;
	signal: AbortSignal;
}

export class WebDrivers {
	#listeners = new Listeners();
	#config: ConfigInterface;
	#configIndex: number;
	#signal: AbortSignal;
	#processSignal: AbortController | undefined;
	#process: ChildProcess | undefined;

	constructor(config: ConfigInterface, signal: AbortSignal) {
		this.#config = config;
		this.#configIndex = 0;
		this.#signal = signal;
	}

	next() {
		this.#processSignal?.abort();

		if (this.#config.webdrivers.length <= this.#configIndex) {
			return this.#listeners.dispatchEvent(new Event("complete"));
		}

		let driverCmd = this.#config.webdrivers[this.#configIndex];
		this.#configIndex += 1;
		if (driverCmd) {
			let [command, url] = driverCmd;
		}
	}

	addEventListener(eventName: string, cb: EventListener) {
		this.#listeners.addEventListener(eventName, cb);
	}
}

class WebdriverSession {
	#params: WebDriverSessionParams;
	#session: string | undefined;
	#process: ChildProcess | undefined;
	#abortController: AbortController | undefined;

	constructor(params: WebDriverSessionParams) {
		this.#params = params;
	}

	upWebdriver() {
		this.#abortController = new AbortController();
		const signal = AbortSignal.any([
			this.#params.signal,
			this.#abortController.signal,
		]);

		this.#process = exec(
			this.#params.command,
			{ signal },
			function (error, stdout, stderr) {
				if (error) {
					console.log("WebDriverSession error:\n", error, "\n");
					console.log(stderr);
				} else {
					console.log("Webdriver stdout:\n");
					console.log(stdout);
				}
			},
		);
		this.#process.on("spawn", function () {
			// fetch get session
			// fetch go to url
		});

		// create session
		// goToUrl
	}

	downWebdriver() {
		// delete session
		// DELETE /session/<session_id>
		// abort signal
		// remove abort signal
	}

	createSession() {
		// POST /session
		// response {
		// 	"value": {
		// 		"sessionId": "1234567890",
		// 		"capabilities": {...}
		// 	}
		// }
	}

	goToUrl(url: string) {
		// POST /session/<session_id>/url
		// null response
		// status code 200
	}
}
