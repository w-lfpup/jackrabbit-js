import { findElements } from "@w-lfpup/jackrabbit";

let section = document.createElement("section");

function setup() {
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
}

function teardown() {
	section.remove();
}

// export tests
export const tests = [setup, testFindElements, teardown];

// export optional test details
export const options = {
	title: import.meta.url,
};
