import { LoggerAction } from "../../core/dist/jackrabbit_types.js";

export interface WebdriverSessionAction {
	id: string;
}

export interface WebdriverSessionStartAction extends WebdriverSessionAction {
	type: "session_start";
}

export interface WebdriverSessionErrorAction extends WebdriverSessionAction {
	type: "session_error";
	error: string;
}

export interface WebdriverSessionClosedAction extends WebdriverSessionAction {
	type: "session_closed";
}

export interface WebdriverRunCompleteAction extends WebdriverSessionAction {
	type: "run_complete";
}

export interface WebdriverLogAction extends WebdriverSessionAction {
	type: "log";
	urlStr: string | undefined;
	loggerAction: LoggerAction;
}

export interface WebdriverEndAction {
	type: "end";
}

export interface WebdriverActionMap {
	session_start: WebdriverSessionStartAction;
	session_error: WebdriverSessionErrorAction;
	session_closed: WebdriverSessionClosedAction;
	run_complete: WebdriverRunCompleteAction;
	log: WebdriverLogAction;
	end: WebdriverEndAction;
}

export type WebdriverActions =
	| WebdriverSessionStartAction
	| WebdriverSessionClosedAction
	| WebdriverSessionErrorAction
	| WebdriverRunCompleteAction
	| WebdriverEndAction
	| WebdriverLogAction;

interface TypedEventBusListener<
	K extends keyof WebdriverActionMap = keyof WebdriverActionMap,
> {
	(action: WebdriverActionMap[K]): void;
}

interface EventBusListener extends TypedEventBusListener {
	(action: WebdriverActions): void;
}

export interface EventBusInterface {
	addListener<K extends keyof WebdriverActionMap>(
		type: K,
		listener: TypedEventBusListener<K>,
	): void;
	dispatchAction(action: WebdriverActions): void;
}

export class EventBus implements EventBusInterface {
	#eventMap: Map<string, EventBusListener[]> = new Map();

	addListener<K extends keyof WebdriverActionMap>(
		type: K,
		cb: TypedEventBusListener<K>,
	) {
		let listeners = this.#eventMap.get(type);
		if (!listeners) {
			listeners = [];
			this.#eventMap.set(type, listeners);
		}
		listeners.push(cb as EventBusListener);
	}

	dispatchAction(action: WebdriverActions) {
		// console.log(action);
		let listeners = this.#eventMap.get(action.type);
		if (listeners)
			for (const listener of listeners) {
				listener(action);
			}
	}
}
