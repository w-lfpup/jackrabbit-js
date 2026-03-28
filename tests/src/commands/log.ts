import { log } from "@w-lfpup/jackrabbit/commands/dist/mod.js";

async function testLogMessage(): Promise<string | undefined> {
	let confirmed = await log("aarruuuuff!!");
	if (!confirmed) return "failed to log message";
}

// export tests
export const tests = [testLogMessage];

// export optional test details
export const options = {
	title: import.meta.url,
};
