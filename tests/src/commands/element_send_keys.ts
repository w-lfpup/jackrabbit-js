import { findElement, elementSendKeys } from "@w-lfpup/jackrabbit";

let section = document.createElement("section");

function setup() {
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

function teardown() {
	section.remove();
}

// export tests
export const tests = [setup, testElementSendKeys, teardown];

// export optional test details
export const options = {
	title: import.meta.url,
};
