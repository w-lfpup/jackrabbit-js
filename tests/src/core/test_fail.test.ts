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

export const tests = [
	testStuffAndFail,
	testMoreStuffAndFail,
	testStuffAndFailAsync,
	testMoreStuffAndFailAsync,
];

export const options = {
	title: import.meta.url,
};
