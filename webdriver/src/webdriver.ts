import type { ConfigInterface, WebdriverParams } from "./config.js";
import { ChildProcess, exec } from "child_process";
import type { EventBus, WebdriverActions } from "./eventbus.js";

// Events
// - complete
// - output
// - error

let headers = new Headers([["Content-Type", "application/json"]]);

// create prmises for every session
// start end rejection
export class WebDrivers {
	#config: ConfigInterface;
	#eventbus: EventBus;
	#webdrivers: WebdriverSession[] = [];
	#currentIndex = 0;

	constructor(config: ConfigInterface, eventbus: EventBus) {
		this.#eventbus = eventbus;
		this.#config = config;

		for (const params of config.webdrivers) {
			this.#webdrivers.push(
				new WebdriverSession(params, config.hostAndPort, eventbus),
			);
		}
	}

	run() {
		this.#eventbus.addListener("session_closed", (action) => {
			let webdriver = this.#webdrivers[this.#currentIndex];
			this.#currentIndex += 1;

			if (webdriver) {
				webdriver.run();
			} else {
				this.#eventbus.dispatchAction({
					type: "end",
				});
			}
		});

		let webdriver = this.#webdrivers[this.#currentIndex];
		this.#currentIndex += 1;
		if (webdriver) {
			webdriver.run();
		} else {
			this.#eventbus.dispatchAction({
				type: "end",
			});
		}
	}

	runAll() {
		this.#eventbus.addListener("session_closed", (action) => {
			if ("session_closed" === action.type) {
				let { id } = action;
				let [indexStr] = id.split(":");
				let index = parseInt(indexStr);
				let webdriverTarget = this.#webdrivers[index];
				if (webdriverTarget) {
					if (id === this.#config.webdrivers[index]?.sessionID)
						this.#currentIndex += 1;
				}

				if (this.#currentIndex === this.#webdrivers.length) {
					this.#eventbus.dispatchAction({
						type: "end",
					});
				}
			}
		});

		for (let webdriver of this.#webdrivers) {
			webdriver.run();
		}
	}
}

// in sync world this does not matter
//
// let { id } = action;
// let [indexStr, hash] = id.split(":");
// let index = parseInt(indexStr);
// let webdriverTarget = this.#webdrivers[index];
// if (webdriverTarget) {
// 	if (id === this.#config.webdrivers[index]?.sessionID){
// 		resolve()
// 	}
// }
class WebdriverSession {
	#params: WebdriverParams;
	#hostAndPort: URL;
	#eventbus: EventBus;
	#signal: AbortSignal | undefined;
	#abortController: AbortController;
	#session: string | undefined;

	constructor(params: WebdriverParams, hostAndPort: URL, eventbus: EventBus) {
		this.#params = params;
		this.#hostAndPort = hostAndPort;
		this.#eventbus = eventbus;
		this.#abortController = new AbortController();

		this.#eventbus.addListener("run_complete", (action) => {
			if (
				"run_complete" === action.type &&
				action.id === this.#params.sessionID
			)
				this.#down();
		});
	}

	async run() {
		// check if already running

		let { command, url, sessionID, timeoutMs } = this.#params;

		this.#eventbus.dispatchAction({
			id: this.#params.sessionID,
			type: "session_start",
		});

		this.#signal = AbortSignal.any([
			this.#abortController.signal,
			AbortSignal.timeout(timeoutMs),
		]);

		this.#signal.addEventListener("abort", () => {
			this.#eventbus.dispatchAction({
				type: "session_closed",
				id: this.#params.sessionID,
			});
		});

		let process = exec(command, { signal: this.#signal });
		process.addListener("error", (error) => {
			this.#eventbus.dispatchAction({
				id: this.#params.sessionID,
				type: "session_error",
				error,
			});
			this.#abortController.abort();
		});

		try {
			await untilWebdriverReady(url, this.#signal);

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
				throw new Error("session is not a string");
			this.#session = sessionId;

			let cookie = {
				name: "jackrabbit",
				value: sessionID,
				path: "/",
				domain: this.#hostAndPort.hostname,
				httpOnly: true,
			};

			console.log("set cookie", cookie);
			let cookieReq = await fetch(
				new URL(`/session/${this.#session}/cookie`, url),
				{
					method: "POST",
					headers,
					body: JSON.stringify({
						cookie,
					}),
					signal: this.#signal,
				},
			);

			if (200 !== cookieReq.status)
				throw new Error("set-cookie request failed");

			let goToUrlRes = await fetch(
				new URL(`/session/${this.#session}/url`, url),
				{
					method: "POST",
					headers,
					body: JSON.stringify({ url: this.#hostAndPort }),
					signal: this.#signal,
				},
			);

			if (200 !== goToUrlRes.status)
				throw new Error("go-to-url request failed");
		} catch (e) {
			let error = e instanceof Error ? e : new Error("unknown session error");
			this.#eventbus.dispatchAction({
				type: "session_error",
				id: this.#params.sessionID,
				error,
			});
			this.#abortController.abort();
		}
	}

	async #down() {
		if (this.#session) {
			let { url } = this.#params;
			try {
				await fetch(new URL(`/session/${this.#session}`, url), {
					method: "DELETE",
					headers,
					body: null,
					signal: this.#signal,
				});
			} catch (e) {
				this.#eventbus.dispatchAction({
					type: "session_error",
					id: this.#params.sessionID,
					error:
						e instanceof Error
							? e
							: new Error("failed to delete session unknown error"),
				});
			}
		}

		this.#abortController.abort();
	}
}

async function untilWebdriverReady(
	url: URL,
	signal: AbortSignal | undefined,
): Promise<void> {
	if (!signal) return;

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

		await sleep(30);
	}

	throw new Error("Webdriver was never ready.");
}

function sleep(timeMs: number): Promise<void> {
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve();
		}, timeMs);
	});
}
