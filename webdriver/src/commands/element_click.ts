import type { IncomingMessage, ServerResponse } from "http";
import type { ElementClickParams } from "../../../browser/dist/mod.js";

import { headers, getJsonFromRequestBody, ActionParams } from "../flyweight.js";

export async function elementClick(actionParams: ActionParams): Promise<void> {
	let { req, res } = actionParams;

	res.setHeader("content-type", "text/plan");

	let reqParams = await getElementIdFromRequest(req);
	if (!reqParams) {
		res.writeHead(400);
		res.end();
		return;
	}

	let { signal, webdriverParams, sessionId } = actionParams;
	let { webdriverUrl } = webdriverParams;
	let { element_id } = reqParams;
	let response = await fetch(
		new URL(`/session/${sessionId}/element/${element_id}/click`, webdriverUrl),
		{
			method: "POST",
			headers,
			body: "{}",
			signal,
		},
	);

	res.writeHead(response.status);
	res.end();
}

async function getElementIdFromRequest(
	req: IncomingMessage,
): Promise<ElementClickParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let element_id = json?.element_id;
	if ("string" === typeof element_id) {
		return { element_id };
	}
}
