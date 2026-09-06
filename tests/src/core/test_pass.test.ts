function testStuffAndPass(): undefined {
	return;
}

function testMoreStuffAndPass() {
	return [];
}

async function testStuffAndPassAsync(): Promise<undefined> {
	return;
}

async function testMoreStuffAndPassAsync(): Promise<string[]> {
	return [];
}

export const tests = [
	testStuffAndPass,
	testMoreStuffAndPass,
	testStuffAndPassAsync,
	testMoreStuffAndPassAsync,
];

export const options = {
	title: import.meta.url,
};
