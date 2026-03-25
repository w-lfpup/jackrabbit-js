function testStuffAndFail() {
	return "this test failed!";
}

function testMoreStuffAndFail() {
	return ["this test also failed!"];
}

async function testStuffAndFailAsync() {
	return "this test failed!";
}

async function testMoreStuffAndFailAsync() {
	return ["this test also failed!"];
}

// export tests
export const tests = [
	testStuffAndFail,
	testMoreStuffAndFail,
	testStuffAndFailAsync,
	testMoreStuffAndFailAsync,
];

// export optional test details
export const options = {
	title: import.meta.url,
};
