import type { ConfigInterface } from "./config.js";
import { ChildProcess, exec } from "child_process";
import { Listeners } from "./listeners.js";

// Events
// - complete
// - output
// - error

export class WebDrivers {
	#listeners = new Listeners();
	#config: ConfigInterface;
	#configIndex: number;
	#session: WebdriverSession | undefined;

	constructor(config: ConfigInterface) {
		this.#config = config;
		this.#configIndex = 0;
	}

	addEventListener(eventName: string, cb: EventListener) {
		this.#listeners.addEventListener(eventName, cb);
	}

	next() {
		this.#session?.abort();

		let driverCmd = this.#config.webdrivers[this.#configIndex];
		if (!driverCmd) return this.#listeners.dispatchEvent(new Event("complete"));

		this.#configIndex += 1;
		let [command, url] = driverCmd;
		let { timeoutMs, hostAndPort } = this.#config;
		let signal = AbortSignal.timeout(timeoutMs);
		this.#session = new WebdriverSession({
			command,
			hostAndPort,
			listeners: this.#listeners,
			signal,
			timeoutMs,
			url,
		});
	}
}

interface WebDriverSessionParams {
	command: string;
	hostAndPort: URL;
	listeners: Listeners;
	signal: AbortSignal;
	timeoutMs: number;
	url: URL;
}

class WebdriverSession {
	#params: WebDriverSessionParams;
	#abortController: AbortController;
	#process: ChildProcess;
	#boundOnOutput = this.#onOutput.bind(this);
	#boundOnSpawn = this.#onSpawn.bind(this);

	constructor(params: WebDriverSessionParams) {
		console.log("webdriver params:", params);
		this.#params = params;
		let { signal: parentSignal, command, timeoutMs } = this.#params;

		this.#abortController = new AbortController();
		const signal = AbortSignal.any([
			parentSignal,
			this.#abortController.signal,
			AbortSignal.timeout(timeoutMs),
		]);

		this.#process = exec(command, { signal }, this.#boundOnOutput);
		this.#process.on("spawn", this.#boundOnSpawn);
	}

	abort() {
		this.#abortController.abort();
	}

	#onOutput(error: Error | null, stdout: string, stderr: string) {
		if (error) {
			console.log("WebDriverSession error:\n", error, "\n");
			console.log(stderr);
			this.#params.listeners.dispatchEvent(new Event("error"));
		} else {
			console.log("Webdriver stdout:\n");
			console.log(stdout);
			this.#params.listeners.dispatchEvent(new Event("output"));
		}
	}

	async #onSpawn() {
		console.log("webdriver process has spawned");
		let { hostAndPort, url } = this.#params;

		try {
			let basedUrl = new URL("/session", url);
			console.log("based_URL:", basedUrl);
			let res = await fetch(new URL("/session", url), {
				method: "POST",
				body: JSON.stringify({ capabilities: {} }),
			});
			console.log("res", res);
			if (200 !== res.status) {
				throw new Error("/session request failed");
			}

			let json = await res.json();
			let { sessionId } = json?.value;
			if (typeof sessionId !== "string")
				throw new Error("sessionId is not a string");

			let goToUrlRes = await fetch(new URL(`/session/${sessionId}/url`, url), {
				body: JSON.stringify({ url: hostAndPort }),
			});
			if (200 !== goToUrlRes.status)
				throw new Error("/session/<session_id>/url request failed");
		} catch (e) {
			console.log(e);
			this.#params.listeners.dispatchEvent(new Event("error"));
		}
	}
}
