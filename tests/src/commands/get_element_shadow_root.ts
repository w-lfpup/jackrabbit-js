import {
	findElement,
	getElementShadowRoot,
} from "@w-lfpup/jackrabbit/commands/dist/mod.js";

let section = document.createElement("section");

// Safari needs mode open to return shadow root

class MyComponent extends HTMLElement {
	#shadow = this.attachShadow({ mode: "closed" });
	constructor() {
		super();
		let text = document.createTextNode("hello world!");
		this.#shadow.append(text);
	}
}

customElements.define("my-component", MyComponent);

function setupFindElement() {
	section.setHTMLUnsafe(`
		<my-component></my-component>
	`);

	let body = document.querySelector("body");
	body?.append(section);
}

async function testFindElement(): Promise<string | undefined> {
	let formId = await findElement("my-component");
	if (!formId) return "failed to find my-component element";

	let shadowId = await getElementShadowRoot(formId);
	if (!shadowId) return "failed to find shadow root";
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
