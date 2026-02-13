interface Queueable {
	(): Promise<unknown>;
}

export class FetchQueue {
	#inbound: Queueable[] = [];
	#outbound: Queueable[] = [];
	#inRoute: Queueable | undefined;

	enqueue(queueable: Queueable) {
		this.#inbound.push(queueable);
		if (!this.#inRoute) this.#queueAtom();
	}

	#queueAtom() {
		if (!this.#outbound.length) {
			while (this.#inbound.length) {
				let pip = this.#inbound.pop();
				if (pip) this.#outbound.push(pip);
			}
		}

		this.#inRoute = this.#outbound.pop();
		this.#execAtom();
	}

	async #execAtom() {
		if (this.#inRoute) {
			await this.#inRoute();
			this.#queueAtom();
		}
	}
}
