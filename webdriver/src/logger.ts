import type {
	LoggerAction,
	LoggerInterface,
} from "../../core/dist/jackrabbit_types.js";
import type { ConfigInterface } from "./config.js";
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
	webdriverSession: WebdriverActions | undefined;
	collections: (CollectionResults | undefined)[];
}

// Session (chrome firefox etc)
//   Collection
//.    Modules
//.      Tests

export class Logger {
	#boundLog = this.#log.bind(this);

	#eventbus: EventBus;

	#results: RunResults = {
		startTime: 0,
		fails: 0,
		errors: 0,
		tests: 0,
		startedTests: 0,
		webdriverSession: undefined,
		collections: [],
	};

	constructor(config: ConfigInterface, eventbus: EventBus) {
		this.#eventbus = eventbus;
		this.#eventbus.addListener("session_error", this.#boundLog);
		this.#eventbus.addListener("log", this.#boundLog);
	}

	get errored() {
		// for any session is their run errored?
		return this.#results.errors !== 0;
	}

	get failed() {
		// for any session did their run fail?
		return this.#results.fails !== 0;
	}

	// get output
	// output being a array of a string

	#log(action: WebdriverActions) {
		if ("session_start" === action.type) {
			this.#results.webdriverSession = action;
		}
		if ("session_closed" === action.type) {
		}
		if ("session_error" === action.type) {
		}
		if ("log" !== action.type) return;

		let { loggerAction, id, urlStr } = action;

		console.log("loggerAction:\n", loggerAction);

		if ("start_run" === loggerAction.type) {
		}

		if ("end_run" === loggerAction.type) {
			this.#eventbus.dispatchAction({
				type: "run_complete",
				id,
			});
		}

		if ("run_error" === loggerAction.type) {
		}

		if ("start_module" === loggerAction.type) {
		}

		if ("end_module" === loggerAction.type) {
		}

		if ("module_error" === loggerAction.type) {
		}

		if ("start_test" === loggerAction.type) {
		}

		if ("end_test" === loggerAction.type) {
		}

		if ("test_error" === loggerAction.type) {
		}

		if ("end_test" === loggerAction.type) {
		}
	}
}
