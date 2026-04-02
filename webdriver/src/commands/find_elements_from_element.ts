import type { IncomingMessage } from "http";
import type { FindElementFromElementParams } from "../../../browser/dist/mod.js";

import {
	headers,
	getJsonFromRequestBody,
	ActionParams,
	dispatchSessionError,
} from "../flyweight.js";

export async function findElementsFromElement(actionParams: ActionParams) {
	let { req, res } = actionParams;

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let elementIds = await findElementsFromElementRequest(
		actionParams,
		reqParams,
	);
	if (!elementIds) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end();
		return;
	}

	res.setHeader("Content-Type", "application/json");
	res.writeHead(200);
	res.end(JSON.stringify(elementIds));
}

async function findElementsFromElementRequest(
	actionParams: ActionParams,
	reqParams: FindElementFromElementParams,
): Promise<string[]> {
	let { webdriverParams, sessionId, signal, eventbus } = actionParams;
	let { webdriverUrl, jackrabbitId } = webdriverParams;
	let { element_id, css_selector } = reqParams;

	let response = await fetch(
		new URL(
			new URL(
				`/session/${sessionId}/element/${element_id}/elements`,
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

	if (404 === response.status) return [];

	if (200 !== response.status) {
		let reason = await response.json();
		let cause = `Find-elements webdriver request failed: ${reason}`;
		dispatchSessionError(eventbus, jackrabbitId, cause);
		return [];
	}

	let json = await response.json();
	if (!Array.isArray(json?.value)) {
		let cause = "Find-elements return value is not an array.";
		dispatchSessionError(eventbus, jackrabbitId, cause);
		return [];
	}

	let elementIds = [];
	for (let elObj of json.value) {
		if (typeof elObj === "object") {
			for (let [elHash, elId] of Object.entries(elObj)) {
				if ("string" === typeof elId && elHash.startsWith("element-")) {
					elementIds.push(elId);
				}
			}
		}
	}

	return elementIds;
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
