import type {
	LoggerAction,
	LoggerInterface,
	TestModule,
} from "../../../core/dist/mod.js";

class TestLogger implements LoggerInterface {
	cancelled: boolean = false;
	errored: boolean = false;
	failed: boolean = false;

	log(action: LoggerAction) {
		if (hasTestFailed(action)) {
			this.failed = true;
		}

		if ("test_error" === action.type) {
			this.errored = true;
		}
	}
}

function hasTestFailed(action: LoggerAction) {
	if ("end_test" !== action.type) return false;

	if (action.assertions === undefined) return false;
	if (Array.isArray(action.assertions) && action.assertions.length === 0)
		return false;

	return true;
}

export { TestLogger };
