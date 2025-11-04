function test_will_pass() {
	return;
}

function test_will_fail() {
	return "this test will fail";
}

export const tests = [test_will_pass, test_will_fail];

export const options = {
	title: import.meta.url,
};
