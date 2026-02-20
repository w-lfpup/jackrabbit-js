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

interface StartRun {
	time: number;
	expected_collection_count: number;
	type: "run_start";
}

interface EndRun {
	time: number;
	type: "run_end";
}

interface StartTestCollection {
	collection_id: number;
	collection_url: string;
	expected_module_count: number;
	type: "collection_start";
}

interface EndTestCollection {
	collection_id: number;
	type: "collection_end";
}

interface TestCollectionError {
	collection_id: number;
	time: number;
	type: "collection_error";
}

interface StartModule {
	module_id: number;
	module_name: string;
	collection_id: number;
	expected_test_count: number;
	type: "module_start";
}

interface EndModule {
	module_id: number;
	collection_id: number;
	type: "module_end";
}

interface ModuleError {
	error: string;
	module_id: number;
	collection_id: number;
	type: "module_error";
}

interface StartTest {
	module_id: number;
	collection_id: number;
	test_id: number;
	test_name: string;
	type: "test_start";
}

interface TestError {
	error: string;
	module_id: number;
	collection_id: number;
	test_id: number;
	type: "test_error";
}

interface EndTest {
	assertions: Assertions;
	end_time: number;
	module_id: number;
	start_time: number;
	collection_id: number;
	test_id: number;
	type: "end_test";
}

export type LoggerAction =
	| StartRun
	| EndRun
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
