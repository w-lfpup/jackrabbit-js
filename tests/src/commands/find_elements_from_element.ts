import {
	findElement,
	findElementsFromElement,
} from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let section = document.createElement("section");

function setupFindElementsFromElement() {
	section.setHTMLUnsafe(`
		<article>
			<button>click me</button>
			<button>click me again</button>
			<button>click me more!</button>
		</article>
	`);

	let body = document.querySelector("body");
	body?.append(section);
}

async function testFindElementsFromElement(): Promise<string | undefined> {
	let elementId = await findElement("article");
	if (undefined === elementId) return "could not find article";

	let buttonIds = await findElementsFromElement(elementId, "button");
	if (undefined === buttonIds) return "query did not return array";

	if (3 !== buttonIds.length)
		return `only ${buttonIds.length} / 3 buttons were found`;
}

function teardownFindElements() {
	section.remove();
}

// export tests
export const tests = [
	setupFindElementsFromElement,
	testFindElementsFromElement,
	teardownFindElements,
];

// export optional test details
export const options = {
	title: import.meta.url,
};
