export interface LogParams {
    message: string;
}
export interface FindElementParams {
    css_selector: string;
}
export interface FindElementsParams {
    css_selector: string;
}
export interface FindElementFromElementParams {
    element_id: string;
    css_selector: string;
}
export interface FindElementsFromElementParams {
    element_id: string;
    css_selector: string;
}
export interface GetElementShadowRootParams {
    element_id: string;
}
export interface FindElementFromShadowRootParams {
    shadow_root_id: string;
    css_selector: string;
}
export interface FindElementsFromShadowRootParams {
    shadow_root_id: string;
    css_selector: string;
}
export interface ElementClickParams {
    element_id: string;
}
export interface ElementSendKeysParams {
    element_id: string;
    text: string;
}
export interface TakeElementScreenshotParams {
    element_id: string;
    target_filepath: string;
}
export declare function findElement(css_selector: string): Promise<string | undefined>;
export declare function elementClick(element_id: string): Promise<boolean>;
export declare function elementSendKeys(element_id: string, text: string): Promise<boolean>;
export declare function takeElementScreenshot(element_id: string, target_filepath: string): Promise<boolean>;
export declare function log(message: string): Promise<boolean>;
export declare function findElements(css_selector: string): Promise<string[] | undefined>;
export declare function findElementFromElement(element_id: string, css_selector: string): Promise<string | undefined>;
export declare function findElementsFromElement(element_id: string, css_selector: string): Promise<string[] | undefined>;
export declare function getElementShadowRoot(element_id: string): Promise<string | undefined>;
export declare function findElementFromShadowRoot(shadow_root_id: string, css_selector: string): Promise<string | undefined>;
export declare function findElementsFromShadowRoot(shadow_root_id: string, css_selector: string): Promise<string[] | undefined>;
export declare function nextFrame(): Promise<void>;
export declare function sleep(milliseconds: number): Promise<void>;
