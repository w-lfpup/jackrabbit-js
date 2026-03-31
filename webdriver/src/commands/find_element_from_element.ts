import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";
import type { FindElementFromElementParams } from "../../../browser/dist/mod.js";

import { headers, getJsonFromRequestBody } from "./flyweight.js";

export async function findElementFromElement(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
) {
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
	let elementId = await findElementFromElementRequest(
		params,
		reqParams,
		signal,
		sessionId,
	);
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
	params: WebdriverParams,
	reqParams: FindElementFromElementParams,
	signal: AbortSignal | undefined,
	sessionId: string,
): Promise<string | undefined> {
	let { url } = params;

	let { element_id, css_selector } = reqParams;

	let response = await fetch(
		new URL(
			new URL(`/session/${sessionId}/element/${element_id}/element`, url),
		),
		{
			method: "POST",
			headers,
			body: JSON.stringify({ using: "css selector", value: css_selector }),
			signal,
		},
	);

	if (200 !== response.status) {
		let cause = await response.json();
		throw new Error("find-element-from-element request failed.", { cause });
	}

	let json = await response.json();
	if ("object" !== typeof json?.value)
		throw new Error("find-element-from-element return value is not an object.");

	if (json.value instanceof Object) {
		for (let [elHash, id] of Object.entries(json.value)) {
			if (
				"string" === typeof elHash &&
				"string" === typeof id &&
				elHash.startsWith("element-")
			)
				return id;
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
