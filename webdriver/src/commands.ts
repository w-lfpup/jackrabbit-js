import type { IncomingMessage, ServerResponse } from "http";

// BELOW ARE ACTIONS FROM TESTS THEMSELVES
import type { ChildProcess } from "child_process";
import type { ConfigInterface, WebdriverParams } from "./config.js";
import type { EventBusInterface } from "./eventbus.js";

let headers = new Headers([["Content-Type", "application/json"]]);

export async function webdriverCommands(
	req: IncomingMessage,
	res: ServerResponse,
	params: WebdriverParams,
) {
	let { url } = params;
	let urlStr = url.toString();
	if (urlStr === "/cmd/find_element") {
		// findElement request
	}
	if (urlStr === "/cmd/element_click") {
	}
	if (urlStr === "/cmd/element_send_keys") {
	}
	if (urlStr === "/cmd/send_keys") {
	}
	if (urlStr === "/cmd/take_element_screenshot") {
	}
}

export async function deleteSession(
	params: WebdriverParams,
	signal: AbortSignal | undefined,
	eventbus: EventBusInterface,
	sessionId: string | undefined,
) {
	let { url, jackrabbitId } = params;
	try {
		let delReqest = await fetch(new URL(`/session/${sessionId}`, url), {
			method: "DELETE",
			headers,
			body: null,
			signal: signal,
		});
		if (200 !== delReqest.status) {
			let cause = await delReqest.json();
			throw new Error("delete-cookie request failed", { cause });
		}
	} catch (e) {
		eventbus.dispatchAction({
			type: "log",
			jackrabbitId,
			loggerAction: {
				type: "session_error",
				error: e?.toString() ?? "failed to delete browser session error",
			},
		});
	}
}

function getJsonFromRequestBody(req: IncomingMessage): Promise<any> {
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
