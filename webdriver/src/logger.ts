import type {
	LoggerAction,
	LoggerInterface,
} from "../../core/dist/jackrabbit_types.js";
import type { EventBus, WebdriverActions } from "./eventbus.js";

// A LOG Event would allow me to send actions
//

// log sync -> print out results as they happen
// log async -> save results print when all done

// need config for webdriver names and stuff

// need to track each web driver

export class Logger {
	failed: boolean = false;
	errored: boolean = false;

	#boundLog = this.#log.bind(this);
	#eventbus: EventBus;

	constructor(eventbus: EventBus) {
		this.#eventbus = eventbus;
		this.#eventbus.addListener("log", this.#boundLog);
	}

	#log(action: WebdriverActions) {
		if ("session_error" === action.type) {
			this.errored = true;
			console.log();
		}
		if ("log" !== action.type) return;

		let { loggerAction, id, urlStr } = action;

		console.log("loggerAction:\n", loggerAction);

		// if ("start_env" === loggerAction.type) {
		// }
		// if ("end_env" === loggerAction.type) {
		// }
		// if ("env_error" === loggerAction.type) {
		// }

		if ("start_run" === loggerAction.type) {
		}
		if ("end_run" === loggerAction.type) {
			this.#eventbus.dispatchAction({
				type: "run_complete",
				id,
			});
		}
		if ("run_error" === loggerAction.type) {
			this.errored = true;
		}

		if ("start_module" === loggerAction.type) {
		}
		if ("end_module" === loggerAction.type) {
		}
		if ("module_error" === loggerAction.type) {
			this.errored = true;
		}
		if ("start_test" === loggerAction.type) {
		}
		if ("end_test" === loggerAction.type) {
		}
		if ("test_error" === loggerAction.type) {
			this.errored = true;
		}

		if ("end_test" === loggerAction.type) {
			let { assertions } = loggerAction;

			if (Array.isArray(assertions)) {
				this.failed = assertions.length !== 0;
			} else {
				this.failed = undefined !== assertions;
			}
		}
	}
}
