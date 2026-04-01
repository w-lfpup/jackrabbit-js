import type { IncomingMessage } from "http";
import type { WebdriverParams } from "../config.js";
import type { GetElementShadowRootParams } from "../../../browser/dist/mod.js";

import { getJsonFromRequestBody, headers, ActionParams } from "../flyweight.js";

export async function getElementShadowRoot(actionParams: ActionParams) {
	let { req, res, eventbus, signal, webdriverParams, sessionId } = actionParams;

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let elementId = await getElementShadowRootRequest(
		signal,
		webdriverParams,
		reqParams,
		sessionId,
	);
	if (!elementId) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end();
		return;
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.write(elementId);
	res.end();
}

async function getElementShadowRootRequest(
	signal: AbortSignal | undefined, // driver defined state
	params: WebdriverParams, // driver defined state
	reqParams: GetElementShadowRootParams,
	sessionId: string, // derived state associated with driver
): Promise<string | undefined> {
	let { webdriverUrl } = params;

	let { element_id } = reqParams;
	let response = await fetch(
		new URL(
			new URL(
				`/session/${sessionId}/element/${element_id}/shadow`,
				webdriverUrl,
			),
		),
		{
			method: "GET",
			headers,
			signal,
		},
	);

	// send error through event bus
	if (200 !== response.status) {
		let cause = await response.json();
		throw new Error("find-element request failed", { cause });
	}

	let json = await response.json();
	if ("object" !== typeof json?.value)
		throw new Error("GetElementShadowRoot return value is not an object");

	for (let [shadowHash, shadowRootId] of Object.entries(json.value)) {
		if ("string" === typeof shadowRootId && shadowHash.startsWith("shadow-"))
			return shadowRootId;
	}
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<GetElementShadowRootParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { element_id } = json;
	if ("string" === typeof element_id) {
		return { element_id };
	}
}
