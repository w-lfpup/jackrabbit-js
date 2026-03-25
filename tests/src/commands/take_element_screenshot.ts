import {
	findElement,
	takeElementScreenshot,
} from "jackrabbit/commands/dist/mod.js";

let text = document.createTextNode("Beasts tread softly underfoot");
let paragraph = document.createElement("p");
paragraph.append(text);
let body = document.querySelector("body");
body?.append(paragraph);

async function testTakeElementScreenshot(): Promise<string | undefined> {
	let elementId = await findElement("p");
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
