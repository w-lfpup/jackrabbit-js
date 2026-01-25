import type { LoggerAction, LoggerInterface, TestModule } from "../../core/dist/mod.js";
export declare class Logger implements LoggerInterface {
    #private;
    get failed(): boolean;
    get cancelled(): boolean;
    log(testModules: TestModule[], action: LoggerAction): void;
}
