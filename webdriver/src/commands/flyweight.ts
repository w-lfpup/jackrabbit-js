import type { IncomingMessage, ServerResponse } from "http";
import type { EventBusInterface } from "../eventbus.js";
import type { WebdriverParams } from "../config.js";

export const headers = new Headers([["Content-Type", "application/json"]]);

export function getJsonFromRequestBody(req: IncomingMessage): Promise<any> {
	return new Promise(function (resolve, reject) {
		let data: Uint8Array[] = [];
		req.addListener("data", function (chunk) {
			data.push(chunk);
		});
		req.addListener("end", function () {
			let actionStr = Buffer.concat(data).toString();
			let action = JSON.parse(actionStr);

			resolve(action);
		});
		req.addListener("error", function (err: Error) {
			reject(err);
		});
	});
}

export function errorToString(e: any): string {
	let errOutput;
	if (e instanceof Error) {
		errOutput = e.name + "\n" + e.message + (e.cause ? "\n" + e.cause : "");
	}
	return e?.toString();
}

export interface ActionParams {
	req: IncomingMessage;
	res: ServerResponse;
	eventbus: EventBusInterface;
	signal: AbortSignal | undefined;
	webdriverParams: WebdriverParams;
	sessionId: string;
}
