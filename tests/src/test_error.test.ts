function testStuffAndError(): undefined {
	throw Error("yo");
	return;
}

function testMoreStuffAndError() {
	throw Error("bro");
	return ["bro"];
}

async function testStuffAndErrorAsync(): Promise<undefined> {
	throw Error("what's");
	return;
}

async function testMoreStuffAndErrorAsync(): Promise<string[]> {
	throw Error("good");
	return ["good"];
}

// export tests
export const tests = [
	testStuffAndError,
	testMoreStuffAndError,
	testStuffAndErrorAsync,
	testMoreStuffAndErrorAsync,
];

// export optional test details
export const options = {
	title: import.meta.url,
};
