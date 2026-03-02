import type { ChildProcess } from "child_process";
import type { ConfigInterface, WebdriverParams } from "./config.js";
import type { EventBus } from "./eventbus.js";
import { exec } from "child_process";

let headers = new Headers([["Content-Type", "application/json"]]);

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
			if (action.id !== this.#config.webdrivers[this.#currentIndex]?.jrId)
				return;

			this.#currentIndex += 1;
			let webdriver = this.#webdrivers[this.#currentIndex];
			webdriver
				? webdriver.run()
				: this.#eventbus.dispatchAction({
						type: "end",
					});
		});

		let webdriver = this.#webdrivers[this.#currentIndex];
		webdriver
			? webdriver.run()
			: this.#eventbus.dispatchAction({
					type: "end",
				});
	}

	runAll() {
		this.#eventbus.addListener("session_closed", (action) => {
			let { id } = action;
			let [indexStr] = id.split(":");
			let index = parseInt(indexStr);
			if (this.#webdrivers[index]) {
				if (id === this.#config.webdrivers[index]?.jrId)
					this.#currentIndex += 1;
			}

			if (this.#currentIndex === this.#webdrivers.length) {
				this.#eventbus.dispatchAction({
					type: "end",
				});
			}
		});

		for (let webdriver of this.#webdrivers) {
			webdriver.run();
		}
	}
}

class WebdriverSession {
	#params: WebdriverParams;
	#hostAndPort: URL;
	#eventbus: EventBus;
	#process: ChildProcess | undefined;
	#signal: AbortSignal | undefined;
	#abortController: AbortController;
	#sessionId: string | undefined;

	constructor(params: WebdriverParams, hostAndPort: URL, eventbus: EventBus) {
		this.#params = params;
		this.#hostAndPort = hostAndPort;
		this.#eventbus = eventbus;
		this.#abortController = new AbortController();

		this.#eventbus.addListener("run_complete", (action) => {
			if ("run_complete" === action.type && action.id === this.#params.jrId)
				this.#down();
		});
	}

	async run() {
		if (this.#process) return;

		let { command, url, jrId, timeoutMs, capabilities } = this.#params;

		this.#eventbus.dispatchAction({
			id: jrId,
			type: "session_start",
		});

		this.#signal = AbortSignal.any([
			this.#abortController.signal,
			AbortSignal.timeout(timeoutMs),
		]);
		this.#signal.addEventListener("abort", () => {
			this.#eventbus.dispatchAction({
				type: "session_closed",
				id: jrId,
			});
		});

		this.#process = exec(command, { signal: this.#signal });
		this.#process.addListener("error", (error) => {
			this.#eventbus.dispatchAction({
				id: jrId,
				type: "session_error",
				error: error.toString(),
			});
		});
		this.#process.addListener("exit", (statusCode) => {
			if (statusCode) {
				this.#eventbus.dispatchAction({
					type: "session_error",
					id: this.#params.jrId,
					error: `Process returned status code: ${statusCode}`,
				});
			}
			this.#eventbus.dispatchAction({
				type: "session_closed",
				id: this.#params.jrId,
			});
		});

		try {
			await untilWebdriverReady(url, this.#signal);

			// needs to be browser specific
			let res = await fetch(new URL("/session", url), {
				method: "POST",
				headers,
				body: JSON.stringify({ capabilities: capabilities ?? {} }),
				signal: this.#signal,
			});
			if (200 !== res.status) {
				let cause = await res.text();
				throw new Error("Failed to create a session", { cause });
			}

			let json = await res.json();
			let { sessionId } = json?.value;
			if (typeof sessionId !== "string")
				throw new Error("session is not a string");
			this.#sessionId = sessionId;

			let cookieUrl = new URL("/ping", this.#hostAndPort);
			let getCookie = await fetch(
				new URL(`/session/${this.#sessionId}/url`, url),
				{
					method: "POST",
					headers,
					body: JSON.stringify({ url: cookieUrl }),
					signal: this.#signal,
				},
			);

			if (200 !== getCookie.status) {
				let cause = await getCookie.json();
				throw new Error("go-to-cookie request failed", { cause });
			}

			let cookieReq = await fetch(
				new URL(`/session/${this.#sessionId}/cookie`, url),
				{
					method: "POST",
					headers,
					body: JSON.stringify({
						cookie: {
							name: "jackrabbit",
							value: jrId,
							// domain: this.#hostAndPort (issues in firefox)
							path: "/",
							httpOnly: true,
						},
					}),
					signal: this.#signal,
				},
			);

			if (200 !== cookieReq.status) {
				let cause = await cookieReq.json();
				throw new Error("set-cookie request failed", { cause });
			}

			let goToUrlRes = await fetch(
				new URL(`/session/${this.#sessionId}/url`, url),
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
			this.#eventbus.dispatchAction({
				type: "session_error",
				id: this.#params.jrId,
				error: e?.toString() ?? "unknown error creating browser session",
			});
			this.#abortController.abort();
		}
	}

	async #down() {
		if (!this.#process) return;
		if (this.#sessionId) {
			let { url } = this.#params;
			try {
				let delReqest = await fetch(
					new URL(`/session/${this.#sessionId}`, url),
					{
						method: "DELETE",
						headers,
						body: null,
						signal: this.#signal,
					},
				);
				if (200 !== delReqest.status) {
					let cause = await delReqest.json();
					throw new Error("delete-cookie request failed", { cause });
				}
			} catch (e) {
				this.#eventbus.dispatchAction({
					type: "session_error",
					id: this.#params.jrId,
					error: e?.toString() ?? "failed to delete browser session error",
				});
			}
		}

		// true if success false otherwise
		this.#process.kill("SIGKILL");
		this.#process = undefined;
	}
}

async function untilWebdriverReady(
	url: URL,
	signal: AbortSignal | undefined,
): Promise<void> {
	while (signal && !signal.aborted) {
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
