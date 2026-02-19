import type {
	LoggerAction,
	LoggerInterface,
} from "../../core/dist/jackrabbit_types.js";

interface StartWebdriver {
	type: "start_env";
}

interface EndWebdriver {
	type: "end_env";
}

interface WebdriverError {
	type: "env_error";
}
type WebdriverActions = StartWebdriver | EndWebdriver | WebdriverError;

type SuperLoggerActions = LoggerAction | WebdriverActions;

interface LoggerData {
	cancelled: boolean;
	errored: boolean;
	failed: boolean;
	startTime: number;
	testTime: number;
}

interface ModuleData {
	numberOfTests: 0;
	numberOfFails: 0;
}

// A LOG Event would allow me to send actions
//

export class Logger implements LoggerInterface {
	failed: boolean = false;
	errored: boolean = false;
	cancelled: boolean = false;

	log(action: SuperLoggerActions) {
		console.log("action:\n", action);

		if ("start_env" === action.type) {
		}
		if ("end_env" === action.type) {
		}
		if ("env_error" === action.type) {
		}

		if ("start_run" === action.type) {
		}
		if ("end_run" === action.type) {
		}
		if ("run_error" === action.type) {
		}
		if ("start_module" === action.type) {
		}
		if ("end_module" === action.type) {
		}
		if ("module_error" === action.type) {
		}
		if ("start_test" === action.type) {
		}
		if ("end_test" === action.type) {
		}
		if ("test_error" === action.type) {
		}

		if ("end_test" === action.type) {
			let { assertions } = action;

			if (Array.isArray(assertions)) {
				if (assertions.length) this.failed = true;
			} else {
				if (undefined !== assertions) this.failed = true;
			}
		}
	}
}
