import type {
	LoggerAction,
	LoggerInterface,
} from "jackrabbit/core/dist/mod.js";

interface LoggerData {
	cancelled: boolean;
	failed: boolean;
	startTime: number;
	testTime: number;
}

export class Logger implements LoggerInterface {
	#data: LoggerData = {
		cancelled: false,
		failed: false,
		startTime: -1,
		testTime: 0,
	};

	get failed() {
		return this.#data.failed;
	}

	get cancelled() {
		return this.#data.cancelled;
	}

	log(action: LoggerAction) {
		if ("start_run" === action.type) {
			// send fetch
		}

		if ("cancel_run" === action.type) {
		}

		//  add to fails
		if ("end_test" === action.type && action?.assertions) {
		}

		if ("start_module" === action.type) {
		}

		if ("end_module" === action.type) {
		}

		if ("end_run" === action.type) {
			// send "end_run"
			// then send "close_webdriver"
		}
	}
}
