interface Log {
    type: "log";
    message: string;
}
interface FindElement {
    type: "find_element";
    css_selector: string;
}
interface FindElements {
    type: "find_elements";
    css_selector: string;
}
interface FindElementFromElement {
    type: "find_element_from_element";
    element_id: string;
    css_selector: string;
}
interface FindElementsFromElement {
    type: "find_elements_from_element";
    css_selector: string;
}
interface GetElementShadowRoot {
    type: "get_element_shadow_root";
    element_id: string;
}
interface FindElementFromShadowRoot {
    type: "find_element_from_shadow_root";
    shadow_root_id: string;
    css_selector: string;
}
interface FindElementsFromShadowRoot {
    type: "find_elements_from_shadow_root";
    shadow_root_id: string;
    css_selector: string;
}
interface ElementClick {
    type: "element_click";
    element_id: string;
}
interface ElementSendKeys {
    type: "element_send_keys";
    element_id: string;
    text: string;
}
interface TakeElementScreenshot {
    type: "take_element_screenshot";
    element_id: string;
    target_filepath: string;
}
export type commands = Log | FindElement | FindElements | GetElementShadowRoot | FindElementFromElement | FindElementsFromElement | FindElementFromShadowRoot | FindElementsFromShadowRoot | ElementClick | ElementSendKeys | TakeElementScreenshot;
export declare function findElement(css_selector: string): Promise<string | undefined>;
export declare function elementClick(element_id: string): Promise<boolean>;
export declare function elementSendKeys(element_id: string, text: string): Promise<boolean>;
export declare function takeElementScreenshot(element_id: string, target_filepath: string): Promise<boolean>;
export declare function log(message: string): Promise<boolean>;
export declare function findElements(css_selector: string): Promise<string[] | undefined>;
export declare function findElementFromElement(element_id: string, css_selector: string): Promise<string | undefined>;
export declare function findElementsFromElements(): Promise<void>;
export declare function findShadowRoot(): Promise<void>;
export declare function findElementFromShadowRoot(): Promise<void>;
export declare function findElementsFromShadowRoot(): Promise<void>;
export {};
