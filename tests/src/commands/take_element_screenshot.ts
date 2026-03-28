import {
	findElement,
	takeElementScreenshot,
} from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let section = document.createElement("section");

function setup() {
	section.setHTMLUnsafe(`
		<p><span>Beasts tread softly underfoot.</span></p>
	`);

	let body = document.querySelector("body");
	body?.append(section);
}

async function testTakeElementScreenshot(): Promise<string | undefined> {
	let elementId = await findElement("span");
	if (!elementId) return "failed to findElement before take-element-screenshot";

	let result = await takeElementScreenshot(
		elementId,
		"./tests/screenshots/paragraph.png",
	);

	if (!result) return "failed to take element screenshot";
}

function teardown() {
	section.remove();
}

// export tests
export const tests = [setup, testTakeElementScreenshot, teardown];

// export optional test details
export const options = {
	title: import.meta.url,
};
