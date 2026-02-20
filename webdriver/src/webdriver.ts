import type { ConfigInterface, WebdriverParams } from "./config.js";
import { ChildProcess, exec } from "child_process";
import type { EventBus } from "./eventbus.js";

// Events
// - complete
// - output
// - error

let headers = new Headers([["Content-Type", "application/json"]]);

// create prmises for every session
// start end rejection
export class WebDrivers {
	#config: ConfigInterface;
	#session: WebdriverSession | undefined;

	// create promises with listeners and abort singals

	constructor(config: ConfigInterface) {
		this.#config = config;
	}

	async start() {}
}

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
			if (action.id === this.#params.sessionID) this.#down();
		});
	}

	async run() {
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

		exec(command, { signal: this.#signal }, (error) => {
			if (error)
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
			let { session } = json?.value;
			if (typeof session !== "string")
				throw new Error("session is not a string");
			this.#session = session;

			let cookieReq = await fetch(
				new URL(`/session/${this.#session}/cookie`, url),
				{
					method: "POST",
					headers,
					body: JSON.stringify({
						cookie: {
							name: "jackrabbit",
							value: sessionID,
							path: "/",
							domain: this.#hostAndPort.host,
						},
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
			} catch {}
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
