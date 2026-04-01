import type { IncomingMessage } from "http";
import type { WebdriverParams } from "../config.js";
import type { FindElementsFromShadowRootParams } from "../../../browser/dist/mod.js";

import { headers, getJsonFromRequestBody, ActionParams } from "../flyweight.js";

export async function findElementsFromShadowRoot(actionParams: ActionParams) {
	let { req, res, eventbus, signal, webdriverParams, sessionId } = actionParams;

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	// send error through event bus
	let elementIds = await findElementsFromShadowRootRequest(
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

// need event bus to send errors to error log
async function findElementsFromShadowRootRequest(
	params: WebdriverParams, // driver defined state
	reqParams: FindElementsFromShadowRootParams,
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string, // derived state associated with driver
): Promise<string[]> {
	let { webdriverUrl } = params;

	let { shadow_root_id, css_selector } = reqParams;

	let response = await fetch(
		new URL(
			new URL(
				`/session/${sessionId}/shadow/${shadow_root_id}/elements`,
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
): Promise<FindElementsFromShadowRootParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { css_selector, shadow_root_id } = json;
	if ("string" === typeof css_selector && "string" === typeof shadow_root_id) {
		return { css_selector, shadow_root_id };
	}
}
