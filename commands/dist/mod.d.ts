interface FindElement {
    type: "find_element";
    css_selector: string;
}
interface ElementClick {
    type: "element_click";
    element_id: string;
}
interface ElementSendKeys {
    type: "element_click";
    element_id: string;
    value: string;
}
interface TakeElementScreenshot {
    type: "take_element_screenshot";
    element_id: string;
    value: string;
}
export type commands = FindElement | ElementClick | ElementSendKeys | TakeElementScreenshot;
export declare function findElement(css_selector: string): Promise<string | undefined>;
export {};
