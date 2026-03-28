import {
	findElement,
	getElementShadowRoot,
} from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let section = document.createElement("section");

// Safari needs mode open to return shadow root

class MyComponent extends HTMLElement {
	#shadow = this.attachShadow({ mode: "open" });
}

customElements.define("component-a", MyComponent);

function setupFindElement() {
	section.setHTMLUnsafe(`
		<component-a></component-a>
	`);

	let body = document.querySelector("body");
	body?.append(section);
}

async function testGetElementShadowRoot(): Promise<string | undefined> {
	let formId = await findElement("component-a");
	if (!formId) return "failed to find component-a element";

	let shadowId = await getElementShadowRoot(formId);
	if (!shadowId) return "failed to find shadow root";
}

function teardownFindElement() {
	section.remove();
}

// export tests
export const tests = [
	setupFindElement,
	testGetElementShadowRoot,
	teardownFindElement,
];

// export optional test details
export const options = {
	title: import.meta.url,
};
