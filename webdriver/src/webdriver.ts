import type { ChildProcess } from "child_process";
import type { ConfigInterface, WebdriverParams } from "./config.js";
import type { EventBusInterface } from "./eventbus.js";

import { exec } from "child_process";
import {
	deleteSession,
	newSession,
	addCookie,
	navigateTo,
} from "./commands/mod.js";
import { untilWebdriverReady } from "./operations.js";

export class WebDrivers {
	#config: ConfigInterface;
	#eventbus: EventBusInterface;
	#webdrivers: WebdriverSession[] = [];
	#currentIndex = 0;

	constructor(config: ConfigInterface, eventbus: EventBusInterface) {
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
			if (
				action.jackrabbitId !==
				this.#config.webdrivers[this.#currentIndex]?.jackrabbitId
			)
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
			let { jackrabbitId } = action;
			let [indexStr] = jackrabbitId.split(":");
			let index = parseInt(indexStr);
			if (this.#webdrivers[index]) {
				if (jackrabbitId === this.#config.webdrivers[index]?.jackrabbitId)
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
	#eventbus: EventBusInterface;
	#process: ChildProcess | undefined; // belongs in state
	#signal: AbortSignal | undefined; // belongs in state
	#abortController: AbortController; // belongs in state
	#sessionId: string | undefined;

	constructor(
		params: WebdriverParams,
		hostAndPort: URL,
		eventbus: EventBusInterface,
	) {
		this.#params = params;
		this.#hostAndPort = hostAndPort;
		this.#eventbus = eventbus;
		this.#abortController = new AbortController();

		this.#eventbus.addListener("run_complete", (action) => {
			if (action.jackrabbitId === this.#params.jackrabbitId) this.#down();
		});
	}

	async run() {
		if (this.#process) return;

		let { jackrabbitId } = this.#params;

		this.#eventbus.dispatchAction({
			jackrabbitId,
			type: "session_start",
		});

		this.#signal = setupSignal(
			this.#params,
			this.#eventbus,
			this.#abortController.signal,
		);
		this.#process = setupProcess(
			this.#params,
			this.#eventbus,
			this.#abortController.signal,
		);

		try {
			await untilWebdriverReady(this.#params, this.#signal);
			this.#sessionId = await newSession(this.#params, this.#signal);
			this.#eventbus.dispatchAction({
				jackrabbitId,
				type: "log",
				loggerAction: {
					type: "session_synced",
					sessionId: this.#sessionId,
				},
			});
			// session needs to be, go stored in state
			await navigateTo(
				this.#params,
				this.#signal,
				this.#sessionId,
				this.#hostAndPort,
				"/ping",
			);
			await addCookie(this.#params, this.#signal, this.#sessionId);
			await navigateTo(
				this.#params,
				this.#signal,
				this.#sessionId,
				this.#hostAndPort,
				"/",
			);
		} catch (e) {
			let errOutput;
			if (e instanceof Error) {
				errOutput = e.name + "\n" + e.message + (e.cause ? "\n" + e.cause : "");
			}
			if (!errOutput) errOutput = e?.toString();

			this.#eventbus.dispatchAction({
				type: "log",
				jackrabbitId: this.#params.jackrabbitId,
				loggerAction: {
					type: "session_error",
					error: errOutput ?? "Unknown error creating browser session",
				},
			});
			this.#abortController.abort();
		}
	}

	async #down() {
		if (!this.#process) return;
		await deleteSession(
			this.#params,
			this.#signal,
			this.#eventbus,
			this.#sessionId,
		);

		this.#process.kill();
		this.#process = undefined;
	}
}

function setupSignal(
	params: WebdriverParams,
	eventbus: EventBusInterface,
	externalSignal: AbortSignal,
): AbortSignal {
	let { jackrabbitId, timeoutMs } = params;

	let signal = AbortSignal.any([
		externalSignal,
		AbortSignal.timeout(timeoutMs),
	]);
	signal.addEventListener("abort", function () {
		eventbus.dispatchAction({
			type: "session_closed",
			jackrabbitId,
		});
	});

	return signal;
}

function setupProcess(
	params: WebdriverParams,
	eventbus: EventBusInterface,
	externalSignal: AbortSignal,
): ChildProcess {
	let { command, jackrabbitId } = params;

	let process = exec(
		command,
		{ signal: externalSignal },
		(_error, _stdout, stderr) => {
			if (stderr) {
				eventbus.dispatchAction({
					jackrabbitId,
					type: "stderr",
					output: stderr,
				});
			}
		},
	);
	process.addListener("error", function (error) {
		eventbus.dispatchAction({
			type: "log",
			jackrabbitId,
			loggerAction: {
				type: "session_error",
				error: error.toString(),
			},
		});
	});
	process.addListener("exit", function (statusCode) {
		if (statusCode) {
			eventbus.dispatchAction({
				type: "log",
				jackrabbitId,
				loggerAction: {
					type: "session_error",
					error: `Process returned status code: ${statusCode}`,
				},
			});
		}
		eventbus.dispatchAction({
			type: "session_closed",
			jackrabbitId,
		});
	});

	return process;
}
