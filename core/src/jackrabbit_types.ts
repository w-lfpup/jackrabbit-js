interface Stringable {
	toString: Object["toString"];
}

export type Assertions = Stringable | Stringable[] | undefined | null;

type SyncTest = () => Assertions;
type AsyncTest = () => Promise<Assertions>;
export type Test = SyncTest | AsyncTest;

export interface TestOptions {
	runAsynchronously?: boolean;
	timeoutMs?: number;
	title?: string;
}

export interface TestModule {
	options?: TestOptions;
	tests: Test[];
}

export interface StartRun {
	expected_collection_count: number;
	time: number;
	type: "start_run";
}

export interface EndRun {
	time: number;
	type: "end_run";
}

export interface RunError {
	error: string;
	type: "run_error";
}

export interface StartTestCollection {
	collection_id: number;
	collection_url: string;
	expected_module_count: number;
	type: "start_collection";
}

export interface EndTestCollection {
	collection_id: number;
	type: "end_collection";
}

export interface TestCollectionError {
	collection_id: number;
	error: string;
	type: "collection_error";
}

export interface StartModule {
	collection_id: number;
	expected_test_count: number;
	module_id: number;
	module_name: string;
	type: "start_module";
}

export interface EndModule {
	collection_id: number;
	module_id: number;
	type: "end_module";
}

export interface ModuleError {
	collection_id: number;
	error: string;
	module_id: number;
	type: "module_error";
}

export interface StartTest {
	collection_id: number;
	module_id: number;
	test_id: number;
	test_name: string;
	type: "start_test";
}

export interface EndTest {
	assertions: Assertions;
	collection_id: number;
	module_id: number;
	test_id: number;
	start_time: number;
	end_time: number;
	type: "end_test";
}

export interface TestError {
	collection_id: number;
	error: string;
	module_id: number;
	test_id: number;
	type: "test_error";
}

export type LoggerAction =
	| StartRun
	| EndRun
	| RunError
	| StartTestCollection
	| EndTestCollection
	| TestCollectionError
	| StartModule
	| ModuleError
	| EndModule
	| StartTest
	| EndTest
	| TestError;

export interface LoggerInterface {
	log(action: LoggerAction): void;
}
