import { findElement } from "@w-lfpup/jackrabbit";

let section = document.createElement("section");

function setup() {
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

function teardown() {
	section.remove();
}

export const tests = [setup, testFindElement, teardown];

export const options = {
	title: import.meta.url,
};
