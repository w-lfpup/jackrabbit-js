import { findElement, elementSendKeys } from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let input = document.createElement("input");
let body = document.querySelector("body");
body?.append(input);

async function testElementSendKeys(): Promise<string | undefined> {
	let elementId = await findElement("input");
	if (!elementId) return "failed to findElement";

	await elementSendKeys(elementId, "hellooo, nurse!");

	if ("hellooo, nurse!" !== input.value) return "failed to send element keys";
}

// export tests
export const tests = [testElementSendKeys];

// export optional test details
export const options = {
	title: import.meta.url,
};
