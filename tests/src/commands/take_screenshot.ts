import { findElement, takeScreenshot } from "@w-lfpup/jackrabbit";

let section = document.createElement("section");

function setup() {
	section.setHTMLUnsafe(`
		<p>
			Beasts tread softly underfoot.
			This night is alive.
		</p>
	`);

	let body = document.querySelector("body");
	body?.append(section);
}

async function testTakeScreenshot(): Promise<string | undefined> {
	let elementId = await findElement("span");
	if (!elementId) return "failed to findElement before take-element-screenshot";

	let result = await takeScreenshot("./tests/screenshots/window.png");

	if (!result) return "failed to take element screenshot";
}

function teardown() {
	section.remove();
}

// export tests
export const tests = [setup, testTakeScreenshot, teardown];

// export optional test details
export const options = {
	title: import.meta.url,
};
