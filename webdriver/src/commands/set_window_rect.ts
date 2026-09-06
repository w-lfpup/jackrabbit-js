import type { IncomingMessage } from "http";
import type { SetWindowRectParams } from "../../../browser/dist/mod.js";

import * as fs from "fs";
import * as path from "path";
import { getJsonFromRequestBody, headers, ActionParams } from "../flyweight.js";

export async function setWindowRect(actionParams: ActionParams): Promise<void> {
	let { req, res, eventbus, signal, webdriverParams, sessionId } = actionParams;

	let { webdriverUrl, title } = webdriverParams;

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let response = await fetch(
		new URL(`/session/${sessionId}/window/rect`, webdriverUrl),
		{
			method: "POST",
			headers,
			signal,
			body: JSON.stringify(reqParams),
		},
	);

	if (200 !== response.status) {
		res.writeHead(response.status, { "content-type": "text/plain" });
		res.end();
		return;
	}

	res.writeHead(response.status, { "content-type": "application/json" });
	res.write(response.body);
	res.end();
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<SetWindowRectParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { x, y, width, height } = json;

	if (
		"number" === typeof x &&
		"number" === typeof y &&
		"number" === typeof width &&
		"number" === typeof height
	) {
		return { x, y, width, height };
	}
}
