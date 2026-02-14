import { Logger } from "./logger.js";
import { run } from "./runner.js";

let jackrabbitMap = document.querySelector("script[type=jackrabbitmap]");
if (null === jackrabbitMap) throw new Error("jackrabbitmap not found");
let jackrabbitConfig = JSON.parse(jackrabbitMap.textContent);

let logger = new Logger();
run(jackrabbitConfig.test_collections, logger);
