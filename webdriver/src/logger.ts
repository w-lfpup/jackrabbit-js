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

interface TestResults {
	loggerStartAction: LoggerAction;
	loggerEndAction: LoggerAction | undefined;
}

interface ModuleResults {
	loggerAction: LoggerAction;
	fails: number;
	errors: number;
	tests: number;
	startedTests: number;
	testResults: (TestResults | undefined)[];
}

interface CollectionResults {
	loggerAction: LoggerAction;
	fails: number;
	errors: number;
	tests: number;
	startedTests: number;
	modules: (ModuleResults | undefined)[];
}

interface RunResults {
	startTime: number;
	fails: number;
	errors: number;
	tests: number;
	startedTests: number;
	webdriverName: string;
	collections: (CollectionResults | undefined)[];
}

export class Logger {
	failed: boolean = false;
	errored: boolean = false;
	#webdriverActions: WebdriverActions[] = [];
	#boundLog = this.#log.bind(this);

	#eventbus: EventBus;

	constructor(eventbus: EventBus) {
		this.#eventbus = eventbus;
		this.#eventbus.addListener("session_error", this.#boundLog);
		this.#eventbus.addListener("log", this.#boundLog);
	}

	// get output
	// output being a array of a string

	#log(action: WebdriverActions) {
		if ("session_start" === action.type) {
			this.#webdriverActions.push(action);
		}
		if ("session_closed" === action.type) {
			this.#webdriverActions.push(action);
		}
		if ("session_error" === action.type) {
			this.errored = true;
			this.#webdriverActions.push(action);
		}
		if ("log" !== action.type) return;

		let { loggerAction, id, urlStr } = action;

		console.log("loggerAction:\n", loggerAction);

		if ("start_run" === loggerAction.type) {
			this.#webdriverActions.push(action);
		}

		if ("end_run" === loggerAction.type) {
			this.#webdriverActions.push(action);

			this.#eventbus.dispatchAction({
				type: "run_complete",
				id,
			});
		}

		if ("run_error" === loggerAction.type) {
			this.errored = true;
			this.#webdriverActions.push(action);
		}

		if ("start_module" === loggerAction.type) {
			this.#webdriverActions.push(action);
		}

		if ("end_module" === loggerAction.type) {
		}

		if ("module_error" === loggerAction.type) {
			this.errored = true;
			this.#webdriverActions.push(action);
		}

		if ("start_test" === loggerAction.type) {
			this.#webdriverActions.push(action);
		}

		if ("end_test" === loggerAction.type) {
			this.#webdriverActions.push(action);
		}

		if ("test_error" === loggerAction.type) {
			this.errored = true;
			this.#webdriverActions.push(action);
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
