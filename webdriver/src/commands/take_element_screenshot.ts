import type { IncomingMessage } from "http";
import type { TakeElementScreenshotParams } from "../../../browser/dist/mod.js";

import * as fs from "fs";
import * as path from "path";
import { getJsonFromRequestBody, headers, ActionParams } from "./flyweight.js";

export async function takeElementScreenshot(
	actionParams: ActionParams,
): Promise<void> {
	let { req, res, eventbus, signal, webdriverParams, sessionId } = actionParams;

	let { webdriverUrl, title } = webdriverParams;

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let { element_id, target_filepath } = reqParams;

	let response = await fetch(
		new URL(
			`/session/${sessionId}/element/${element_id}/screenshot`,
			webdriverUrl,
		),
		{
			method: "GET",
			headers,
			signal,
		},
	);

	if (200 !== response.status) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let json = await response.json();
	let base64 = json.value;
	if ("string" !== typeof base64)
		throw new Error("take-element-screeshot is not a base64 string");

	// confirm screenshot is saved in the scope of cwd
	let cwd = process.cwd();
	let filepath = path.join(cwd, target_filepath);
	if (!filepath.startsWith(cwd)) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let buffer = Buffer.from(base64, "base64");
	await saveFileToDisk(target_filepath, title, buffer);

	res.writeHead(200, { "content-type": "text/plain" });
	res.end();
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<TakeElementScreenshotParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { element_id, target_filepath } = json;
	if ("string" === typeof element_id && "string" === typeof target_filepath) {
		return { element_id, target_filepath };
	}
}

async function saveFileToDisk(
	filepath: string,
	title: string,
	buffer: Buffer,
): Promise<void> {
	// make sure path is in current working directory?
	let ext = path.extname(filepath);
	if (ext) filepath = filepath.substring(0, filepath.length - ext.length);

	let title_ext = title.toLowerCase().replaceAll(" ", "_");
	filepath = `${filepath}.${title_ext}.png`;

	let dir = path.dirname(filepath);
	await fs.promises.mkdir(dir, { recursive: true });
	await fs.promises.writeFile(filepath, buffer);
}
