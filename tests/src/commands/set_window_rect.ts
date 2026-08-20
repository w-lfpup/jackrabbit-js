import { setWindowRect } from "@w-lfpup/jackrabbit";

async function testSetWindowRect(): Promise<string | undefined> {
	let rectWasSet = await setWindowRect({ x: 5, y: 5, width: 1080, height: 1080});
	if (!rectWasSet) return "failed to set window rect";
}

export const tests = [
	testSetWindowRect,
];

export const options = {
	title: import.meta.url,
};
