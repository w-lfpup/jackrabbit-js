import type { LoggerAction } from "../../core/dist/jackrabbit_types.js";
import type { WebdriverParams } from "./config.js";
import type { WebdriverActions } from "./eventbus.js";

export interface TestResults {
	loggerStartAction: LoggerAction;
	loggerEndAction: LoggerAction | undefined;
}

export interface ModuleResults {
	loggerAction: LoggerAction;
	fails: number;
	errors: number;
	expectedTests: number;
	completedTests: number;
	errorLogs: LoggerAction[];
	testResults: (TestResults | undefined)[];
}

export interface CollectionResults {
	loggerAction: LoggerAction;
	fails: number;
	errors: number;
	expectedTests: number;
	completedTests: number;
	expectedModules: number;
	completedModules: number;
	errorLogs: LoggerAction[];
	modules: (ModuleResults | undefined)[];
}

export interface RunResults {
	fails: number;
	errors: number;
	startTime: number;
	endTime: number;
	testTime: number;
	expectedTests: number;
	completedTests: number;
	expectedModules: number;
	completedModules: number;
	expectedCollections: number;
	completedCollections: number;
	errorLogs: WebdriverActions[];
	webdriverParams: WebdriverParams;
	collections: (CollectionResults | undefined)[];
}

export interface SessionResults {
	fails: number;
	errors: number;
	runs: Map<string, RunResults>;
}
