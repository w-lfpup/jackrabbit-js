import { findElement, elementClick } from "@w-lfpup/jackrabbit/mod.js";

let clickCounter = 0;

let section = document.createElement("section");
let button = document.createElement("button");
let body = document.querySelector("body");

button.setAttribute("data-element_click", "");
button.addEventListener("click", function () {
	clickCounter += 1;
});

section.append(button);
body?.append(section);

async function testElementClick(): Promise<string | undefined> {
	let elementId = await findElement("button[data-element_click]");
	if (!elementId) return "failed to find element";

	await elementClick(elementId);

	if (0 === clickCounter) return "click counter failed to click one time";
}

async function testMultipleElementClicks(): Promise<string | undefined> {
	clickCounter = 0;
	let elementId = await findElement("button[data-element_click]");
	if (!elementId) return "failed to find element";

	await elementClick(elementId);
	await elementClick(elementId);
	await elementClick(elementId);

	if (3 !== clickCounter)
		return `click counter failed to click ${clickCounter}/3 times`;
}

// tear down
function teardownElementClick() {
	section.remove();
}

// export tests
export const tests = [
	testElementClick,
	testMultipleElementClicks,
	teardownElementClick,
];

// export optional test details
export const options = {
	title: import.meta.url,
};
