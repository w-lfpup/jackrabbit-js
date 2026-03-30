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
	let elementId = await findElementFromElementRequest(
		req,
		params,
		signal,
		sessionId,
	);
	if (elementId) {
		res.writeHead(200, { "content-type": "text/plain" });
		res.write(elementId);
		res.end();
		return;
	}

	res.writeHead(404, { "content-type": "text/plain" });
	res.end();
}

// need event bus to send errors to error log
async function findElementFromElementRequest(
	req: IncomingMessage,
	params: WebdriverParams,
	signal: AbortSignal | undefined,
	sessionId: string,
): Promise<string | undefined> {
	let { url } = params;

	let reqParams = await getRequestParams(req);
	if (!reqParams)
		throw new Error("Failed to deserialize find-element-from-element body.");

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
		for (let [key, value] of Object.entries(json.value)) {
			if (
				"string" === typeof key &&
				"string" === typeof value &&
				key.startsWith("element-")
			)
				// return key;
				return value;
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
