async function test_that_passes() {
	return [];
}

async function test_that_fails() {
	return ["this test will fail"];
}

export const tests = [test_that_passes, test_that_fails];

export const options = {
	title: import.meta.url,
	runAsynchronously: true,
	timeoutMs: 2000,
};
