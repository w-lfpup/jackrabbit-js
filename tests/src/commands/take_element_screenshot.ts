import {
	findElement,
	takeElementScreenshot,
} from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let text = document.createTextNode("Beasts tread softly underfoot");
let span = document.createElement("span");
let paragraph = document.createElement("p");
let body = document.querySelector("body");

span.append(text);
paragraph.append(span);
body?.append(paragraph);

async function testTakeElementScreenshot(): Promise<string | undefined> {
	let elementId = await findElement("span");
	if (!elementId) return "failed to findElement before take-element-screenshot";

	let result = await takeElementScreenshot(
		elementId,
		"./tests/screenshots/paragraph.png",
	);

	if (!result) return "failed to take element screenshot";
}

// export tests
export const tests = [testTakeElementScreenshot];

// export optional test details
export const options = {
	title: import.meta.url,
};
