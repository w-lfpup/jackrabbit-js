interface FindElement {
    type: "find_element";
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
export type commands = FindElement | ElementClick | ElementSendKeys | TakeElementScreenshot;
export declare function findElement(css_selector: string): Promise<string | undefined>;
export declare function elementClick(element_id: string): Promise<boolean>;
export declare function elementSendKeys(element_id: string, text: string): Promise<boolean>;
export declare function takeElementScreenshot(element_id: string, target_filepath: string): Promise<boolean>;
export {};
