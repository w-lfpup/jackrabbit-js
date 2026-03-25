import { findElement } from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let button = document.createElement("button");
let body = document.querySelector("body");
body?.append(button);

async function testFindElement(): Promise<string | undefined> {
	let elementId = await findElement("button");
	if (elementId) return;

	return "failed to findElement";
}

// export tests
export const tests = [testFindElement];

// export optional test details
export const options = {
	title: import.meta.url,
};
