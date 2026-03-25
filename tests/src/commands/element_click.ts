import {
	findElement,
	elementClick,
} from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let clickCounter = 0;

let button = document.createElement("button");
button.setAttribute("data-element_click", "");
button.addEventListener("click", function () {
	clickCounter += 1;
});

let body = document.querySelector("body");
body?.append(button);

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

// export tests
export const tests = [testElementClick, testMultipleElementClicks];

// export optional test details
export const options = {
	title: import.meta.url,
};
