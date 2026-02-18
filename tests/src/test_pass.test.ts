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

// export tests
export const tests = [
	testStuffAndPass,
	testMoreStuffAndPass,
	testStuffAndPassAsync,
	testMoreStuffAndPassAsync,
];

// export optional test details
export const options = {
	title: import.meta.url,
};
