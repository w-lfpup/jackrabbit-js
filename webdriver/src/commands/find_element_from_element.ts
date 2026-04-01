import type { IncomingMessage } from "http";
import type { WebdriverParams } from "../config.js";
import type { FindElementFromElementParams } from "../../../browser/dist/mod.js";
import type { EventBusInterface } from "../eventbus.js";

import {
	headers,
	getJsonFromRequestBody,
	ActionParams,
	dispatchSessionError,
} from "../flyweight.js";

export async function findElementFromElement(actionParams: ActionParams) {
	let { req, res } = actionParams;

	// put request body here
	// needs to return a 400, 200, 404
	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}
	// just return elementId undefined or error
	// if error write a response about it
	let { eventbus, signal, webdriverParams, sessionId } = actionParams;

	// if instanceof error send to event bus
	let elementId = await findElementFromElementRequest(actionParams, reqParams);

	if (elementId) {
		res.writeHead(200, { "content-type": "text/plain" });
		res.end(elementId);
		return;
	}

	res.writeHead(404, { "content-type": "text/plain" });
	res.end();
}

// need event bus to send errors to error log
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

	// whwat if it's just "return" here?
	if (200 !== response.status) {
		let cause = await response.json();
		let reason = `Find-element-from-element webdriver request failed: ${cause}`;
		dispatchSessionError(eventbus, jackrabbitId, reason);
		return;
	}

	let json = await response.json();
	if ("object" !== typeof json?.value) {
		dispatchSessionError(
			eventbus,
			jackrabbitId,
			"Find-element-from-element return value is not an object.",
		);
		return;
	}

	if (json.value instanceof Object) {
		for (let [elHash, id] of Object.entries(json.value)) {
			if ("string" === typeof id && elHash.startsWith("element-")) return id;
		}
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
