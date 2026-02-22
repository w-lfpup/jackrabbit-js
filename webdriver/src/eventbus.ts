import { LoggerAction } from "../../core/dist/jackrabbit_types.js";

interface WebdriverSessionAction {
	id: string;
}

interface WebdriverSessionStartAction extends WebdriverSessionAction {
	type: "session_start";
}

interface WebdriverSessionErrorAction extends WebdriverSessionAction {
	type: "session_error";
	error: string;
}

interface WebdriverSessionClosedAction extends WebdriverSessionAction {
	type: "session_closed";
}

interface WebdriverRunCompleteAction extends WebdriverSessionAction {
	type: "run_complete";
}

interface WebdriverLogAction extends WebdriverSessionAction {
	type: "log";
	urlStr: string | undefined;
	loggerAction: LoggerAction;
}

interface WebdriverEndAction {
	type: "end";
}

export type WebdriverActions =
	| WebdriverSessionStartAction
	| WebdriverSessionClosedAction
	| WebdriverSessionErrorAction
	| WebdriverRunCompleteAction
	| WebdriverEndAction
	| WebdriverLogAction;

interface EventBusListener {
	(action: WebdriverActions): void;
}

export interface EventBusInterface {
	addListener(type: string, listener: EventBusListener): void;
	dispatchAction(action: WebdriverActions): void;
}

export class EventBus implements EventBusInterface {
	#eventMap: Map<string, EventBusListener[]> = new Map();

	addListener(type: string, cb: EventBusListener) {
		let listeners = this.#eventMap.get(type);
		if (!listeners) {
			listeners = [];
			this.#eventMap.set(type, listeners);
		}
		listeners.push(cb);
	}

	dispatchAction(action: WebdriverActions) {
		console.log(action);
		let listeners = this.#eventMap.get(action.type);
		if (listeners)
			for (const listener of listeners) {
				listener(action);
			}
	}
}
