import type { LoggerInterface } from "../../core/dist/jackrabbit_types.js";
import type { IncomingMessage, ServerResponse } from "http";
import type { Listeners } from "./listeners.js";

export class Logger implements LoggerInterface {
	failed: boolean = false;
	cancelled: boolean = false;

	log() {}
}

export function log(
	req: IncomingMessage,
	res: ServerResponse,
	listeners: Listeners,
) {
	let { method } = req;
	if ("POST" !== method) return;

	let { url } = req;
	if ("/log/start_module" === url) {
	}
	if ("/log/end_test" === url) {
	}
	if ("/log/end_module" === url) {
	}
	if ("/log/end_run" === url) {
		listeners.dispatchEvent(new Event("complete"));
	}
}
