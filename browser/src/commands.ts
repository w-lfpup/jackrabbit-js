export interface Log {
	message: string;
}

export interface FindElementParams {
	css_selector: string;
}

export interface FindElements {
	css_selector: string;
}

export interface FindElementFromElementParams {
	element_id: string;
	css_selector: string;
}

export interface FindElementsFromElement {
	element_id: string;
	css_selector: string;
}

export interface GetElementShadowRoot {
	element_id: string;
}

export interface FindElementFromShadowRoot {
	shadow_root_id: string;
	css_selector: string;
}

export interface FindElementsFromShadowRoot {
	shadow_root_id: string;
	css_selector: string;
}

export interface ElementClick {
	element_id: string;
}

export interface ElementSendKeysParams {
	element_id: string;
	text: string;
}

export interface TakeElementScreenshot {
	element_id: string;
	target_filepath: string;
}

export async function findElement(
	css_selector: string,
): Promise<string | undefined> {
	let action: FindElementParams = {
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
	let action: ElementSendKeysParams = {
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
	let action: FindElementFromElementParams = {
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
		element_id,
	};

	let res = await fetch(`/cmd/get_element_shadow_root`, {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	});

	if (200 === res.status) return await res.text();
}

export async function findElementFromShadowRoot(
	shadow_root_id: string,
	css_selector: string,
) {
	let action: FindElementFromShadowRoot = {
		css_selector,
		shadow_root_id,
	};

	let res = await fetch(`/cmd/find_element_from_shadow_root`, {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	});

	if (200 === res.status) return await res.text();
}

export async function findElementsFromShadowRoot(
	shadow_root_id: string,
	css_selector: string,
) {
	let action: FindElementsFromShadowRoot = {
		shadow_root_id,
		css_selector,
	};

	let res = await fetch(`/cmd/find_elements_from_shadow_root`, {
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

export function afterMicrotaskQueue(): Promise<void> {
	return new Promise(function (resolve) {
		queueMicrotask(function () {
			resolve();
		});
	});
}
