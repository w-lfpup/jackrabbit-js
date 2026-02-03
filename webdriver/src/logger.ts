import type { LoggerInterface } from "../../core/dist/jackrabbit_types.js";

export class Logger implements LoggerInterface {
	failed: boolean = false;
	cancelled: boolean = false;

	log() {}
}
