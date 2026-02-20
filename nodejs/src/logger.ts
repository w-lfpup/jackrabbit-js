import type { LoggerAction, LoggerInterface } from "../../core/dist/mod.js";

interface LoggerData {
	errored: boolean;
	failed: boolean;
	startTime: number;
	testTime: number;
}

export class Logger implements LoggerInterface {
	#data: LoggerData = {
		failed: false,
		errored: false,
		startTime: 0,
		testTime: 0,
	};

	#moduleReciepts = {
		numberOfTests: 0,
		numberOfFails: 0,
	};

	get failed() {
		return this.#data.failed;
	}

	get errored() {
		return this.#data.errored;
	}

	log(action: LoggerAction) {
		if ("start_run" === action.type) {
			this.#data.startTime = action.time;
			console.log(action.filepath);
		}

		if ("start_test" === action.type) {
			this.#moduleReciepts.numberOfTests += 1;
		}

		//  add to fails
		if ("end_test" === action.type) {
			this.#data.testTime += action.endTime - action.startTime;

			if (undefined === action.assertions) return;
			if (Array.isArray(action.assertions) && action.assertions.length === 0)
				return;

			this.#moduleReciepts.numberOfFails += 1;
			this.#data.failed = true;

			console.log(`    ${action.testName}`);
			if (Array.isArray(action.assertions)) {
				for (const assertion of action.assertions) {
					console.log(`      ${assertion}`);
				}
			} else {
				console.log(`      ${action.assertions}`);
			}
		}

		if ("test_error" === action.type) {
			this.#data.errored = true;
			this.#moduleReciepts.numberOfFails += 1;
			console.log(`      ${action.error}`);
		}

		if ("start_module" === action.type) {
			console.log(`  ${action.moduleName}`);
		}

		if ("end_module" === action.type) {
			let { numberOfFails, numberOfTests } = this.#moduleReciepts;
			let remaining = Math.max(0, numberOfTests - numberOfFails);
			console.log(`    results: ${remaining}/${numberOfTests}\n`);
			this.#moduleReciepts = {
				numberOfTests: 0,
				numberOfFails: 0,
			};
		}

		if ("module_error" === action.type) {
			this.#data.errored = true;
			console.log(`    ${action.error}\n`);
		}

		if ("end_run" === action.type) {
			logResults(this.#data, action.time);
		}

		if ("run_error" === action.type) {
			this.#data.errored = true;
			console.log(`RUN ERROR:\n${action.error}\n`);
		}
	}
}

function logResults(data: LoggerData, time: number) {
	let status_with_color = data.failed
		? yellow("\u{2717} failed")
		: blue("\u{2714} passed");

	if (data.errored) {
		status_with_color = gray("\u{2717} errored");
	}

	const overhead = time - data.startTime;
	console.log(`Results:
${status_with_color}
  duration: ${data.testTime.toFixed(4)} mS
  overhead: ${overhead.toFixed(4)} mS`);
}

// 39 - default foreground color
// 49 - default background color
function blue(text: string) {
	return `\x1b[44m\x1b[97m${text}\x1b[0m`;
}

function yellow(text: string) {
	return `\x1b[43m\x1b[97m${text}\x1b[0m`;
}

function gray(text: string) {
	return `\x1b[100m\x1b[97m${text}\x1b[0m`;
}
