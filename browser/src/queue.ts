class FetchQueue {
	#incoming: Promise<void>[] = [];
	#outgoing: Promise<void>[] = [];
	#current: Promise<void> | undefined;

	queue(fetcher: Promise<void>) {
		this.#incoming.push(fetcher);
	}
}
