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
	type: "start_run";
}

interface EndRun {
	time: number;
	type: "end_run";
}

interface CancelRun {
	time: number;
	type: "cancel_run";
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

interface StartTest {
	moduleId: number;
	moduleName: string;
	testId: number;
	testName: string;
	type: "start_test";
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

interface TestError {
	type: "error";
	error: string;
}
export type LoggerAction =
	| StartRun
	| EndRun
	| CancelRun
	| StartModule
	| EndModule
	| StartTest
	| EndTest
	| TestError;

export interface LoggerInterface {
	readonly cancelled: boolean;
	log(action: LoggerAction): void;
}
