import type { IncomingMessage } from "http";
import type { WebdriverParams } from "../config.js";
import type { FindElementsParams } from "../../../browser/dist/mod.js";

import { headers, getJsonFromRequestBody, ActionParams } from "../flyweight.js";

// FIND ELEMENTS
export async function findElements(actionParams: ActionParams) {
	let { req, res, eventbus, signal, webdriverParams, sessionId } = actionParams;

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	// send error through event bus
	let elementIds = await findElementsRequest(
		webdriverParams,
		reqParams,
		signal,
		sessionId,
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

async function findElementsRequest(
	params: WebdriverParams, // driver defined state
	reqParams: FindElementsParams,
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string, // derived state associated with driver
): Promise<string[]> {
	let { webdriverUrl } = params;

	let { css_selector } = reqParams;
	let response = await fetch(
		new URL(new URL(`/session/${sessionId}/elements`, webdriverUrl)),
		{
			method: "POST",
			headers,
			body: JSON.stringify({ using: "css selector", value: css_selector }),
			signal,
		},
	);

	if (200 !== response.status) {
		let cause = await response.json();
		throw new Error("find-element request failed", { cause });
	}

	let json = await response.json();
	if (!Array.isArray(json?.value))
		throw new Error("getElements return value is not an array");

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
): Promise<FindElementsParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { css_selector } = json;
	if ("string" === typeof css_selector) {
		return { css_selector };
	}
}
