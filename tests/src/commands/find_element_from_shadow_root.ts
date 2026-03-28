import {
	findElement,
	findElementFromShadowRoot,
	getElementShadowRoot,
} from "@w-lfpup/jackrabbit/commands/dist/mod.js";

// cannot find element in shadow root
class MyComponent extends HTMLElement {
	#shadow = this.attachShadow({ mode: "open" });
	constructor() {
		super();
		this.#shadow.setHTMLUnsafe(`
			<button>hai</button>
		`);
	}
}

customElements.define("component-b", MyComponent);

let section = document.createElement("section");

function setup() {
	section.setHTMLUnsafe(`
		<component-b></component-b>
	`);

	// wait a frame?

	let body = document.querySelector("body");
	body?.append(section);
}

async function testFindElementFromElement(): Promise<string | undefined> {
	let componentId = await findElement("component-b");
	if (!componentId) return "failed to find componentId element";

	let shadowRootId = await getElementShadowRoot(componentId);
	if (!shadowRootId) return "failed to find shadow root";


	let buttonId = await findElementFromShadowRoot(shadowRootId, "button");
	if (!buttonId) return "failed to find button from component-b element";
}

function teardown() {
	section.remove();
}

// export tests
export const tests = [setup, testFindElementFromElement, teardown];

// export optional test details
export const options = {
	title: import.meta.url,
};
