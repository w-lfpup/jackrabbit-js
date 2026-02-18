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

	async next() {
		await this.#session?.abort();

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
	#sessionId: string | undefined;

	constructor(params: WebDriverSessionParams) {
		this.#params = params;
		let { signal: parentSignal, command, timeoutMs } = this.#params;

		// doubled up, remove
		const signal = AbortSignal.any([
			parentSignal,
			AbortSignal.timeout(timeoutMs),
		]);

		this.#process = exec(command, { signal });
		this.#onSpawn();
	}

	async abort() {
		await this.#onDown();
		this.#process.kill();
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
				throw new Error("Failed to create a session");
			}

			let json = await res.json();
			let { sessionId } = json?.value;

			if (typeof sessionId !== "string")
				throw new Error("SessionId is not a string");

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
				throw new Error("go-to-url request failed");
		} catch (e) {
			console.log(e);
			this.#params.listeners.dispatchEvent(new Event("error"));
		}
	}

	async #onDown() {
		let { url } = this.#params;
		if (!this.#sessionId) return;

		try {
			let res = await fetch(new URL(`/session/${this.#sessionId}`, url), {
				method: "DELETE",
				headers: new Headers([["Content-Type", "application/json"]]),
				body: null,
			});
			if (200 !== res.status) {
				// throw new Error("Failed to DELETE session");
				this.#params.listeners.dispatchEvent(new Event("error"));
			}
		} catch (e) {
			console.log(e);
			// this.#params.listeners.dispatchEvent(new Event("error"));
		}
	}
}

function sleep(timeMs: number): Promise<void> {
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve();
		}, timeMs);
	});
}
