import type { IncomingMessage } from "http";
import type { FindElementParams } from "../../../browser/dist/mod.js";

import {
	headers,
	getJsonFromRequestBody,
	ActionParams,
	dispatchSessionError,
} from "../flyweight.js";

export async function findElement(actionParams: ActionParams) {
	let { req, res } = actionParams;

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	// send error through event bus
	let elementId = await findElementRequest(actionParams, reqParams);

	// if elementId instanceof Error return error status code
	// dispatch error

	if (!elementId) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end();
		return;
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.write(elementId);
	res.end();
}

async function findElementRequest(
	actionParams: ActionParams,
	reqParams: FindElementParams,
): Promise<string | undefined> {
	let { webdriverParams, sessionId, signal, eventbus } = actionParams;
	let { webdriverUrl, jackrabbitId } = webdriverParams;
	let { css_selector } = reqParams;

	let response = await fetch(
		new URL(new URL(`/session/${sessionId}/element`, webdriverUrl)),
		{
			method: "POST",
			headers,
			body: JSON.stringify({ using: "css selector", value: css_selector }),
			signal,
		},
	);

	if (404 === response.status) return;

	if (200 !== response.status) {
		let reason = await response.json();
		let cause = `Find-element webdriver request failed: ${reason}`;
		dispatchSessionError(eventbus, jackrabbitId, cause);
		return;
	}

	let json = await response.json();
	if (json && "object" !== typeof json.value) {
		let cause = "Find-element return value is not an object.";
		dispatchSessionError(eventbus, jackrabbitId, cause);
		return;
	}

	// if (200 !== response.status) {
	// 	let cause = await response.json();
	// 	throw new Error("Find-element request failed", { cause });
	// }

	// let json = await response.json();
	// if ("object" !== typeof json?.value)
	// 	throw new Error("Find-element return value is not an object");

	for (let [elHash, elId] of Object.entries(json.value)) {
		if ("string" === typeof elId && elHash.startsWith("element-")) return elId;
	}
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<FindElementParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { css_selector } = json;
	if ("string" === typeof css_selector) {
		return { css_selector };
	}
}
