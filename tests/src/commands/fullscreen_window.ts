import { fullscreenWindow } from "@w-lfpup/jackrabbit";

async function testFullscreenWindow(): Promise<string | undefined> {
	let rectWasSet = await fullscreenWindow();
	if (!rectWasSet) return "failed to set window rect";
}

export const tests = [
	testFullscreenWindow,
];

export const options = {
	title: import.meta.url,
};
