import {
	findElement,
	findElementsFromShadowRoot,
	getElementShadowRoot,
} from "@w-lfpup/jackrabbit/commands/dist/mod.js";

// cannot find element in shadow root
class MyComponent extends HTMLElement {
	#shadow = this.attachShadow({ mode: "open" });
	constructor() {
		super();
		this.#shadow.setHTMLUnsafe(`
			<button>hai</button>
			<button>haii</button>
			<button>haaii</button>
			<button>haaiii</button>
			<button>haaaiii</button>
		`);
	}
}

customElements.define("component-c", MyComponent);

let section = document.createElement("section");

function setup() {
	section.setHTMLUnsafe(`
		<component-c></component-c>
	`);

	// wait a frame?

	let body = document.querySelector("body");
	body?.append(section);
}

async function testFindElementsFromShadowRoot(): Promise<string | undefined> {
	let componentId = await findElement("component-c");
	if (!componentId) return "failed to find componentId element";

	let shadowRootId = await getElementShadowRoot(componentId);
	if (!shadowRootId) return "failed to find shadow root";

	let elementIds = await findElementsFromShadowRoot(shadowRootId, "button");
	if (undefined === elementIds) return "query did not return array";

	if (5 !== elementIds.length)
		return `only ${elementIds.length} / 5 were found`;
}

function teardown() {
	section.remove();
}

// export tests
export const tests = [setup, testFindElementsFromShadowRoot, teardown];

// export optional test details
export const options = {
	title: import.meta.url,
};
