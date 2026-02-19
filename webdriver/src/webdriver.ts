import type { ConfigInterface } from "./config.js";
import { ChildProcess, exec } from "child_process";
import { Listeners } from "./listeners.js";

// Events
// - complete
// - output
// - error

let headers = new Headers([["Content-Type", "application/json"]]);

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
		let { command, url, timeoutMs } = driverCmd;
		let { hostAndPort } = this.#config;
		this.#session = new WebdriverSession({
			command,
			hostAndPort,
			listeners: this.#listeners,
			timeoutMs,
			url,
		});
	}
}

interface WebDriverSessionParams {
	command: string;
	hostAndPort: URL;
	listeners: Listeners;
	timeoutMs: number;
	url: URL;
}

// async conditions feel off
class WebdriverSession {
	#params: WebDriverSessionParams;
	#process: ChildProcess;
	#signal: AbortSignal;
	#abortController: AbortController;
	#sessionId: string | undefined;

	constructor(params: WebDriverSessionParams) {
		this.#params = params;
		let { command, timeoutMs } = this.#params;

		// something like this to keep stuff moving
		this.#abortController = new AbortController();
		this.#signal = AbortSignal.any([
			this.#abortController.signal,
			AbortSignal.timeout(timeoutMs),
		]);

		this.#process = exec(command, { signal: this.#signal });

		this.#onSpawn();
	}

	async abort() {
		// something to prevent already aborted stuff
		await this.#onDown();
		this.#abortController.abort();
	}

	async #onSpawn() {
		let { hostAndPort, url } = this.#params;

		try {
			// wait until /status returns {"value": {"ready": true} }
			await untilReady(url, this.#signal);

			let res = await fetch(new URL("/session", url), {
				method: "POST",
				headers,
				body: JSON.stringify({ capabilities: {} }),
				signal: this.#signal,
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
					headers,
					body: JSON.stringify({ url: hostAndPort }),
					signal: this.#signal,
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
			await fetch(new URL(`/session/${this.#sessionId}`, url), {
				method: "DELETE",
				headers,
				body: null,
				signal: this.#signal,
			});
		} catch {}
	}
}

function sleep(timeMs: number): Promise<void> {
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve();
		}, timeMs);
	});
}

async function untilReady(url: URL, signal: AbortSignal): Promise<void> {
	while (!signal.aborted) {
		try {
			let res = await fetch(new URL("/status", url), {
				method: "GET",
				headers,
				body: null,
				signal,
			});

			if (200 === res.status) {
				let json = await res.json();
				let { ready } = json?.value;
				if (typeof ready === "boolean" && ready) return;
			}
		} catch {}

		await sleep(10);
	}

	throw new Error("Webdriver was never ready.");
}
