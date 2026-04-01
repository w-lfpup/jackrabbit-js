import type { IncomingMessage } from "http";
import type { FindElementFromElementParams } from "../../../browser/dist/mod.js";

import {
	headers,
	getJsonFromRequestBody,
	ActionParams,
	dispatchSessionError,
} from "../flyweight.js";

export async function findElementFromElement(actionParams: ActionParams) {
	let { req, res } = actionParams;
	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let elementId = await findElementFromElementRequest(actionParams, reqParams);
	if (elementId) {
		res.writeHead(200, { "content-type": "text/plain" });
		res.end(elementId);
		return;
	}

	res.writeHead(404, { "content-type": "text/plain" });
	res.end();
}

async function findElementFromElementRequest(
	actionParams: ActionParams,
	reqParams: FindElementFromElementParams,
): Promise<string | undefined> {
	let { webdriverParams, sessionId, signal, eventbus } = actionParams;
	let { webdriverUrl, jackrabbitId } = webdriverParams;
	let { element_id, css_selector } = reqParams;

	let response = await fetch(
		new URL(
			new URL(
				`/session/${sessionId}/element/${element_id}/element`,
				webdriverUrl,
			),
		),
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
		let cause = `Find-element-from-element webdriver request failed: ${reason}`;
		dispatchSessionError(eventbus, jackrabbitId, cause);
		return;
	}

	let json = await response.json();
	if (json && "object" !== typeof json.value) {
		let cause = "Find-element-from-element return value is not an object.";
		dispatchSessionError(eventbus, jackrabbitId, cause);
		return;
	}

	for (let [elHash, id] of Object.entries(json.value)) {
		if ("string" === typeof id && elHash.startsWith("element-")) return id;
	}
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<FindElementFromElementParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { css_selector, element_id } = json;
	if ("string" === typeof css_selector && "string" === typeof element_id) {
		return { css_selector, element_id };
	}
}
