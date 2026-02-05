import type { ConfigInterface } from "./config.js";
import { ChildProcess, exec } from "child_process";
import { Listeners } from "./listeners.js";

// Events
// - complete
// - output
// - error

// on ABORT needs to have a way of sill downing all the
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
	#process: ChildProcess;
	#boundOnOutput = this.#onOutput.bind(this);
	#sessionId: string | undefined;
	#boundOnSpawn = this.#onSpawn.bind(this);

	constructor(params: WebDriverSessionParams) {
		this.#params = params;
		let { signal: parentSignal, command, timeoutMs } = this.#params;

		const signal = AbortSignal.any([
			parentSignal,
			AbortSignal.timeout(timeoutMs),
		]);

		this.#process = exec(command, { signal }, this.#boundOnOutput);
		this.#onSpawn();
	}

	async abort() {
		// delete session
		await this.#onDown();
		this.#process.kill();
		await sleep(500);
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
		await sleep(500);

		let { hostAndPort, url } = this.#params;

		try {
			let res = await fetch(new URL("/session", url), {
				method: "POST",
				headers: new Headers([["Content-Type", "application/json"]]),
				body: JSON.stringify({ capabilities: {} }),
			});
			if (200 !== res.status) {
				throw new Error("/session request failed");
			}

			let json = await res.json();
			let { sessionId } = json?.value;
			console.log("session id:", sessionId);

			if (typeof sessionId !== "string")
				throw new Error("sessionId is not a string");

			this.#sessionId = sessionId;
			let goToUrlRes = await fetch(
				new URL(`/session/${this.#sessionId}/url`, url),
				{
					method: "POST",
					headers: new Headers([["Content-Type", "application/json"]]),
					body: JSON.stringify({ url: hostAndPort }),
				},
			);

			if (200 !== goToUrlRes.status)
				throw new Error("/session/<session_id>/url request failed");
		} catch (e) {
			this.#params.listeners.dispatchEvent(new Event("error"));
		}
	}

	async #onDown() {
		let { hostAndPort, url } = this.#params;
		if (this.#sessionId) return;
		console.log("trying to down session!");
		try {
			let res = await fetch(new URL(`/session/${this.#sessionId}`, url), {
				method: "DELETE",
				headers: new Headers([["Content-Type", "application/json"]]),
			});
			if (200 !== res.status) {
				throw new Error("/session DELETE request failed");
			}
		} catch (e) {
			this.#params.listeners.dispatchEvent(new Event("error"));
		}
	}
}

function sleep(timeMs: number): Promise<void> {
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			resolve();
		}, timeMs);
	});
}
