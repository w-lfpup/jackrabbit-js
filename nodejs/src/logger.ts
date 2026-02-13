import type {
	LoggerAction,
	LoggerInterface,
	TestModule,
} from "../../core/dist/mod.js";

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

	#moduleReciepts = {
		numberOfTests: 0,
		numberOfFails: 0,
	};

	get failed() {
		return this.#data.failed;
	}

	get cancelled() {
		return this.#data.cancelled;
	}

	log(action: LoggerAction) {
		if ("start_run" === action.type) {
			this.#data.startTime = action.time;
			console.log("start run");
		}

		if ("cancel_run" === action.type) {
			this.#data.cancelled = true;
			console.log("run cancelled");
		}

		//  add to fails
		if ("end_test" === action.type && action?.assertions) {
			this.#moduleReciepts.numberOfTests += 1;

			if (Array.isArray(action.assertions) && action.assertions.length === 0)
				return;

			this.#data.testTime += action.endTime - action.startTime;
			this.#moduleReciepts.numberOfFails += 1;
			this.#data.failed = true;

			console.log("test failed:");
			console.log(action.assertions);
		}

		if ("start_module" === action.type) {
			console.log("start module:", action.moduleName);
		}

		if ("end_module" === action.type) {
			console.log("module ended");
			let { numberOfFails, numberOfTests } = this.#moduleReciepts;
			console.log(`${numberOfFails}/${numberOfTests}`);
			this.#moduleReciepts = {
				numberOfTests: 0,
				numberOfFails: 0,
			};
		}

		if ("end_run" === action.type) {
			// logAssertions(testModules, this.#assertions);
			logResults(this.#data, action.time);
		}
	}
}

function logAssertions(
	testModules: TestModule[],
	fails: Map<number, Map<number, LoggerAction>>,
) {
	for (let [moduleID, module] of testModules.entries()) {
		let failedTests = fails.get(moduleID);
		if (undefined === failedTests) continue;

		const { tests, options } = module;

		console.log(`${options?.title ?? `module index: ${moduleID}`}`);

		let numFailedTests = fails.get(moduleID)?.size ?? 0;
		console.log(`${numFailedTests}/${tests.length} tests failed`);

		for (let [index, test] of tests.entries()) {
			let action = failedTests.get(index);
			if (!action || action.type !== "end_test") continue;

			console.log(`\t${test.name}\n\t\t${action.assertions}`);
		}

		console.log("\n");
	}
}

function logResults(data: LoggerData, time: number) {
	let status_with_color = data.failed
		? yellow("\u{2717} failed")
		: blue("\u{2714} passed");

	if (data.cancelled) {
		status_with_color = gray("\u{2717} cancelled");
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

function logTestModule(moduleID: number, title?: string) {
	console.log(`module: ${title ?? `module index: ${moduleID}`}`);
}
