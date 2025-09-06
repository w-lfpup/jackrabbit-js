import type {
	LoggerAction,
	LoggerInterface,
	TestModule,
} from "../../core/dist/mod.ts";

class TestLogger implements LoggerInterface {
	cancelled: boolean = false;
	failed: boolean = false;

	log(_testModule: TestModule[], action: LoggerAction) {
		if (hasTestFailed(action)) {
			this.failed = true;
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
