import { findElements } from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let section = document.createElement("section");

function setupFindElements() {
	section.setHTMLUnsafe(`
		<button>click me</button>
		<button>click me again</button>
		<button>click me more!</button>
	`);

	let body = document.querySelector("body");
	body?.append(section);
}

async function testFindElements(): Promise<string | undefined> {
	let elementIds = await findElements("button");
	if (undefined === elementIds) return "query did not return array";

	if (3 !== elementIds.length) return `only ${elementIds.length} were found`;

	return "failed to findElement";
}

function teardownFindElements() {
	section.remove();
}

// export tests
export const tests = [
	setupFindElements,
	testFindElements,
	teardownFindElements,
];

// export optional test details
export const options = {
	title: import.meta.url,
};
