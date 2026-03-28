// find element just needs a string in body (element-28902489215801)
//

interface Log {
	type: "log";
	message: string;
}

interface FindElement {
	type: "find_element";
	css_selector: string;
}

interface FindElements {
	type: "find_elements";
	css_selector: string;
}

interface FindElementFromElement {
	type: "find_element_from_element";
	element_id: string;
	css_selector: string;
}

interface FindElementsFromElement {
	type: "find_elements_from_element";
	element_id: string;
	css_selector: string;
}

interface GetElementShadowRoot {
	type: "get_element_shadow_root";
	element_id: string;
}

interface FindElementFromShadowRoot {
	type: "find_element_from_shadow_root";
	shadow_root_id: string;
	css_selector: string;
}

interface FindElementsFromShadowRoot {
	type: "find_elements_from_shadow_root";
	shadow_root_id: string;
	css_selector: string;
}

// /session/<session_id>/element
// find element can be just a string

interface ElementClick {
	type: "element_click";
	element_id: string;
}

// /session/{session id}/element/{element id}/click
// value can just be a string

interface ElementSendKeys {
	type: "element_send_keys";
	element_id: string;
	text: string;
}

// /session/{session id}/element/{element id}/value
// only need to send a string

interface TakeElementScreenshot {
	type: "take_element_screenshot";
	element_id: string;
	target_filepath: string;
}

// /session/{session id}/element/{element id}/screenshot

export type commands =
	| Log
	| FindElement
	| FindElements
	| GetElementShadowRoot
	| FindElementFromElement
	| FindElementsFromElement
	| FindElementFromShadowRoot
	| FindElementsFromShadowRoot
	| ElementClick
	| ElementSendKeys
	| TakeElementScreenshot;

export async function findElement(
	css_selector: string,
): Promise<string | undefined> {
	let action: FindElement = {
		type: "find_element",
		css_selector,
	};

	let res = await fetch(`/cmd/find_element`, {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	});

	if (200 === res.status) return await res.text();
}

export async function elementClick(element_id: string): Promise<boolean> {
	let action: ElementClick = {
		type: "element_click",
		element_id,
	};

	let res = await fetch(`/cmd/element_click`, {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	});

	return 200 === res.status;
}

export async function elementSendKeys(
	element_id: string,
	text: string,
): Promise<boolean> {
	let action: ElementSendKeys = {
		type: "element_send_keys",
		element_id,
		text,
	};

	let res = await fetch(`/cmd/element_send_keys`, {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	});

	return 200 === res.status;
}

export async function takeElementScreenshot(
	element_id: string,
	target_filepath: string,
): Promise<boolean> {
	let action: TakeElementScreenshot = {
		type: "take_element_screenshot",
		element_id,
		target_filepath,
	};

	let res = await fetch(`/cmd/take_element_screenshot`, {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	});

	return 200 === res.status;
}

export async function log(message: string): Promise<boolean> {
	let action: Log = {
		type: "log",
		message,
	};

	let res = await fetch(`/cmd/log`, {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	});

	return 200 === res.status;
}

export async function findElements(
	css_selector: string,
): Promise<string[] | undefined> {
	let action: FindElements = {
		type: "find_elements",
		css_selector,
	};

	let res = await fetch(`/cmd/find_elements`, {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	});

	if (200 !== res.status) return;

	let json = await res.json();
	if (!Array.isArray(json)) return;

	let elementIds: string[] = [];
	for (let item of json) {
		if ("string" === typeof item) elementIds.push(item);
	}

	return elementIds;
}

export async function findElementFromElement(
	element_id: string,
	css_selector: string,
): Promise<string | undefined> {
	let action: FindElementFromElement = {
		type: "find_element_from_element",
		css_selector,
		element_id,
	};

	let res = await fetch(`/cmd/find_element_from_element`, {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	});

	if (200 === res.status) return await res.text();
}

export async function findElementsFromElement(
	element_id: string,
	css_selector: string,
) {
	let action: FindElementsFromElement = {
		type: "find_elements_from_element",
		element_id,
		css_selector,
	};

	let res = await fetch(`/cmd/find_elements_from_element`, {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	});

	if (200 !== res.status) return;

	let json = await res.json();
	if (!Array.isArray(json)) return;

	let elementIds: string[] = [];
	for (let item of json) {
		if ("string" === typeof item) elementIds.push(item);
	}

	return elementIds;
}

export async function getElementShadowRoot(
	element_id: string,
): Promise<string | undefined> {
	let action: GetElementShadowRoot = {
		type: "get_element_shadow_root",
		element_id,
	};

	let res = await fetch(`/cmd/get_element_shadow_root`, {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	});

	if (200 === res.status) return await res.text();
}

export async function findElementFromShadowRoot() {}
export async function findElementsFromShadowRoot() {}
