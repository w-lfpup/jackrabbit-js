import {
	findElement,
	findElementFromElement,
} from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let section = document.createElement("section");

function setupFindElement() {
	section.setHTMLUnsafe(`
		<form>
			<button>click me softly</button>
		</form>
	`);

	let body = document.querySelector("body");
	body?.append(section);
}

async function testFindElement(): Promise<string | undefined> {
	let formId = await findElement("form");
	if (!formId) return "failed to find form element";

	let buttonId = await findElementFromElement(formId, "button");
	if (!buttonId) return "failed to find button from form element";
}

function teardownFindElement() {
	section.remove();
}

// export tests
export const tests = [setupFindElement, testFindElement, teardownFindElement];

// export optional test details
export const options = {
	title: import.meta.url,
};
