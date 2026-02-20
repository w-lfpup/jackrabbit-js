interface Stringable {
	toString: Object["toString"];
}

export type Assertions = Stringable | Stringable[] | undefined;

type SyncTest = () => Assertions;
type AsyncTest = () => Promise<Assertions>;
export type Test = SyncTest | AsyncTest;

export interface Options {
	runAsynchronously?: boolean;
	timeoutMs?: number;
	title?: string;
}

export interface TestModule {
	options?: Options;
	tests: Test[];
}

interface StartRun {
	time: number;
	filepath: string;
	type: "start_run";
}

interface EndRun {
	time: number;
	type: "end_run";
}

interface StartTestCollection {
	time: number;
	filepath: string;
	type: "start_test_collection";
}

interface EndTestCollection {
	time: number;
	type: "end_test_collection";
}

interface TestCollectionError {
	time: number;
	type: "test_collection_error";
}

interface StartModule {
	moduleId: number;
	moduleName: string;
	type: "start_module";
}

interface EndModule {
	moduleId: number;
	moduleName: string;
	type: "end_module";
}

interface ModuleError {
	error: string;
	moduleId: number;
	moduleName: string;
	type: "module_error";
}

interface StartTest {
	moduleId: number;
	moduleName: string;
	testId: number;
	testName: string;
	type: "start_test";
}

interface TestError {
	error: string;
	moduleId: number;
	moduleName: string;
	testId: number;
	testName: string;
	type: "test_error";
}

interface EndTest {
	assertions: Assertions;
	endTime: number;
	moduleId: number;
	moduleName: string;
	startTime: number;
	testId: number;
	testName: string;
	type: "end_test";
}

interface RunError {
	type: "run_error";
	error: string;
}

export type LoggerAction =
	| StartRun
	| RunError
	| EndRun
	| StartModule
	| ModuleError
	| EndModule
	| StartTest
	| EndTest
	| TestError;

export interface LoggerInterface {
	log(action: LoggerAction): void;
}
