import {
	findElement,
	getElementShadowRoot,
} from "@w-lfpup/jackrabbit/browser/dist/mod.js";

let section = document.createElement("section");

// Safari needs mode open to return shadow root

class MyComponent extends HTMLElement {
	#shadow = this.attachShadow({ mode: "open" });
}

customElements.define("component-a", MyComponent);

function setup() {
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

function teardown() {
	section.remove();
}

// export tests
export const tests = [setup, testGetElementShadowRoot, teardown];

// export optional test details
export const options = {
	title: import.meta.url,
};
