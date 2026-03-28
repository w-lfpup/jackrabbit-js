import { findElement } from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let section = document.createElement("section");

function setupFindElement() {
	section.setHTMLUnsafe(`
		<button>click me softly</button>
	`);

	let body = document.querySelector("body");
	body?.append(section);
}

async function testFindElement(): Promise<string | undefined> {
	let elementId = await findElement("button");
	if (elementId) return;

	return "failed to findElement";
}

function teardownFindElement() {
	section.remove();
}

// export tests
export const tests = [setupFindElement, testFindElement, teardownFindElement];

// export optional test details
export const options = {
	title: import.meta.url,
};
