import type {
	LoggerAction,
	LoggerInterface,
} from "../../core/dist/jackrabbit_types.js";
import type { IncomingMessage, ServerResponse } from "http";
import type { Listeners } from "./listeners.js";

export async function log(
	req: IncomingMessage,
	res: ServerResponse,
	logger: LoggerInterface,
	listeners: Listeners,
) {
	let data: Uint8Array[] = [];
	req.on("data", function (chunk) {
		data.push(chunk);
	});
	req.on("end", function () {
		let jsonStr = Buffer.concat(data).toString();
		let json = JSON.parse(jsonStr);

		if ("end_run" === json.type) {
			listeners.dispatchEvent(new Event("complete"));
		}

		if ("run_error" === json.type) {
			// listeners.dispatchEvent(new Event("error"));
			listeners.dispatchEvent(new Event("complete"));
		}

		res.writeHead(200);
		res.end();
	});
}

export class Logger implements LoggerInterface {
	failed: boolean = false;
	cancelled: boolean = false;

	log(action: LoggerAction) {
		if ("end_test" === action.type) {
			let { assertions } = action;

			if (Array.isArray(assertions)) {
				if (assertions.length) this.failed = true;
			} else {
				if (assertions) this.failed = true;
			}
		}
	}
}
