import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";

import * as fs from "fs";
import * as path from "path";
import { getJsonFromRequestBody, headers } from "./flyweight.js";

export async function takeElementScreenshot(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
): Promise<void> {
	let { url, title } = params;

	let reqParams = await getTakeElementScreenshotBody(req);
	if (!reqParams)
		throw new Error("Failed to deserialize TakeElementScreenshot body.");

	let { element_id, target_filepath } = reqParams;

	let response = await fetch(
		new URL(`/session/${sessionId}/element/${element_id}/screenshot`, url),
		{
			method: "GET",
			headers,
			signal,
		},
	);

	if (200 !== response.status) {
		let cause = await response.json();
		throw new Error("take-element-screenshot request failed", { cause });
	}

	let json = await response.json();
	let base64 = json.value;
	if ("string" !== typeof base64)
		throw new Error("element screenshot is not a base64 string");

	// get path relative to cwd
	// if /absolute path
	//
	// join process.cwd() + target_filepath;
	let buffer = Buffer.from(base64, "base64");
	await saveFileToDisk(target_filepath, title, buffer);

	res.writeHead(200, { "content-type": "text/plain" });
	res.end();
}

interface TakeElementScreenshotParams {
	element_id: string;
	target_filepath: string;
}

async function getTakeElementScreenshotBody(
	req: IncomingMessage,
): Promise<TakeElementScreenshotParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { element_id, target_filepath } = json;
	if ("string" === typeof element_id && "string" === typeof target_filepath) {
		return { element_id, target_filepath };
	}
}

async function saveFileToDisk(
	target_filepath: string,
	title: string,
	buffer: Buffer,
): Promise<void> {
	// make sure path is in current working directory?
	let cwd = process.cwd();
	let filepath = path.join(cwd, target_filepath);
	if (!filepath.startsWith(cwd))
		throw new Error("Screenshot filepath is out of scope (not in cwd)");

	let ext = path.extname(filepath);
	if (ext) filepath = filepath.substring(0, filepath.length - ext.length);

	let title_ext = title.toLowerCase().replaceAll(" ", "_");
	filepath = `${filepath}.${title_ext}.png`;

	// create directories
	let dir = path.dirname(filepath);
	await fs.promises.mkdir(dir, { recursive: true });
	// write file
	await fs.promises.writeFile(filepath, buffer);
}
