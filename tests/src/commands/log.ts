import { log } from "@w-lfpup/jackrabbit";

async function testLogMessage(): Promise<string | undefined> {
	let confirmed = await log("aarruuuuff!!");
	if (!confirmed) return "failed to log message";
}

export const tests = [testLogMessage];

export const options = {
	title: import.meta.url,
};
