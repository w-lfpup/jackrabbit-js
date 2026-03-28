interface Log {
	message: string;
}

interface FindElement {
	css_selector: string;
}

interface FindElements {
	css_selector: string;
}

interface FindElementFromElement {
	element_id: string;
	css_selector: string;
}

interface FindElementsFromElement {
	element_id: string;
	css_selector: string;
}

interface GetElementShadowRoot {
	element_id: string;
}

interface FindElementFromShadowRoot {
	shadow_root_id: string;
	css_selector: string;
}

interface FindElementsFromShadowRoot {
	shadow_root_id: string;
	css_selector: string;
}

interface ElementClick {
	element_id: string;
}

interface ElementSendKeys {
	element_id: string;
	text: string;
}

interface TakeElementScreenshot {
	element_id: string;
	target_filepath: string;
}

export async function findElement(
	css_selector: string,
): Promise<string | undefined> {
	let action: FindElement = {
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
	let action: ElementSendKeys = {
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
	let action: FindElementFromElement = {
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

export function nextFrame(): Promise<void> {
	return new Promise(function (resolve) {
		queueMicrotask(function () {
			resolve();
		});
	});
}
