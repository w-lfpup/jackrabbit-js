import { minimizeWindow } from "@w-lfpup/jackrabbit";

async function testMinimizeWindow(): Promise<string | undefined> {
	let rectWasSet = await minimizeWindow();
	if (!rectWasSet) return "failed to set window rect";
}

export const tests = [
	testMinimizeWindow,
];

export const options = {
	title: import.meta.url,
};
