import {
	findElement,
	elementSendKeys,
} from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let section = document.createElement("section");

function setupElementSendKeys() {
	section.setHTMLUnsafe(`<input>`);
	let body = document.querySelector("body");
	body?.append(section);
}

async function testElementSendKeys(): Promise<string | undefined> {
	let elementId = await findElement("input");
	if (!elementId) return "failed to findElement";

	await elementSendKeys(elementId, "hellooo, nurse!");

	let input = section.querySelector("input");
	if ("hellooo, nurse!" !== input?.value) return "failed to send element keys";
}

function teardownElementSendKeys() {
	section.remove();
}

// export tests
export const tests = [
	setupElementSendKeys,
	testElementSendKeys,
	teardownElementSendKeys,
];

// export optional test details
export const options = {
	title: import.meta.url,
};
