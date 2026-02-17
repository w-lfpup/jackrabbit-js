import type {
	LoggerAction,
	LoggerInterface,
} from "../../core/dist/jackrabbit_types.js";
import type { IncomingMessage, ServerResponse } from "http";
import type { Listeners } from "./listeners.js";

interface StartWebdriver {
	type: "start_env";
}

interface EndWebdriver {
	type: "end_env";
}

interface WebdriverError {
	type: "env_error";
}
type WebdriverActions = StartWebdriver | EndWebdriver | WebdriverError;

type SuperLoggerActions = LoggerAction | WebdriverActions;

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
		let actionStr = Buffer.concat(data).toString();
		let action = JSON.parse(actionStr);

		logger.log(action);

		if ("end_run" === action.type) {
			listeners.dispatchEvent(new Event("complete"));
		}

		if ("run_error" === action.type) {
			listeners.dispatchEvent(new Event("error"));
			listeners.dispatchEvent(new Event("complete"));
		}

		res.writeHead(200);
		res.end();
	});
}

export class Logger implements LoggerInterface {
	failed: boolean = false;
	errored: boolean = false;
	cancelled: boolean = false;

	log(action: SuperLoggerActions) {
		console.log("action:\n", action);

		if ("start_env" === action.type) {
		}
		if ("end_env" === action.type) {
		}
		if ("env_error" === action.type) {
		}

		if ("start_run" === action.type) {
		}
		if ("end_run" === action.type) {
		}
		if ("run_error" === action.type) {
		}
		if ("start_module" === action.type) {
		}
		if ("end_module" === action.type) {
		}
		if ("module_error" === action.type) {
		}
		if ("start_test" === action.type) {
		}
		if ("end_test" === action.type) {
		}
		if ("test_error" === action.type) {
		}

		if ("end_test" === action.type) {
			let { assertions } = action;

			if (Array.isArray(assertions)) {
				if (assertions.length) this.failed = true;
			} else {
				if (undefined !== assertions) this.failed = true;
			}
		}
	}
}
