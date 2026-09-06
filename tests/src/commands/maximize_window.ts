import { maximizeWindow } from "@w-lfpup/jackrabbit";

async function testMaximizeWindow(): Promise<string | undefined> {
	let rectWasSet = await maximizeWindow();
	if (!rectWasSet) return "failed to set window rect";
}

export const tests = [
	testMaximizeWindow,
];

export const options = {
	title: import.meta.url,
};
