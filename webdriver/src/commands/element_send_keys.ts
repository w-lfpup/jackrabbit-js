import type { IncomingMessage } from "http";
import type { ElementSendKeysParams } from "../../../browser/dist/mod.js";

import { headers, getJsonFromRequestBody, ActionParams } from "../flyweight.js";

export async function elementSendKeys(
	actionParams: ActionParams,
): Promise<void> {
	let { req, res } = actionParams;

	res.setHeader("content-type", "text/plan");

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400);
		res.end();
		return;
	}

	let { signal, webdriverParams, sessionId } = actionParams;
	let { webdriverUrl } = webdriverParams;
	let { element_id, text } = reqParams;

	let response = await fetch(
		new URL(`/session/${sessionId}/element/${element_id}/value`, webdriverUrl),
		{
			method: "POST",
			headers,
			body: JSON.stringify({ text }),
			signal,
		},
	);

	res.writeHead(response.status, { "content-type": "text/plain" });
	res.end();
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<ElementSendKeysParams | undefined> {
	let { element_id, text } = await getJsonFromRequestBody(req);
	if ("string" === typeof element_id && "string" === typeof text) {
		return { element_id, text };
	}
}
