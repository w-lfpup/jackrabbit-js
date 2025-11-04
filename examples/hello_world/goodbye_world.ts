function test_that_passes() {
	return [];
}

function test_that_fails() {
	return ["this test will fail"];
}

export const tests = [test_that_passes, test_that_fails];
