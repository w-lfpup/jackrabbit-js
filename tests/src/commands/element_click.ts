import {
	findElement,
	elementClick,
} from "@w-lfpup/jackrabbit/browser/dist/mod.js";

let clickCounter = 0;
let section = document.createElement("section");

function setup() {
	section.setHTMLUnsafe(`
		<button>boop</button>
	`);

	let button = section.querySelector("button");
	button?.addEventListener("click", function () {
		clickCounter += 1;
	});

	let body = document.querySelector("body");
	body?.append(section);
}

async function testElementClick(): Promise<string | undefined> {
	let elementId = await findElement("button");
	if (!elementId) return "failed to find element";

	await elementClick(elementId);

	if (0 === clickCounter) return "click counter failed to click one time";
}

async function testMultipleElementClicks(): Promise<string | undefined> {
	clickCounter = 0;
	let elementId = await findElement("button");
	if (!elementId) return "failed to find element";

	await elementClick(elementId);
	await elementClick(elementId);
	await elementClick(elementId);

	if (3 !== clickCounter)
		return `click counter failed to click ${clickCounter}/3 times`;
}

// tear down
function teardown() {
	section.remove();
}

// export tests
export const tests = [
	setup,
	testElementClick,
	testMultipleElementClicks,
	teardown,
];

// export optional test details
export const options = {
	title: import.meta.url,
};
