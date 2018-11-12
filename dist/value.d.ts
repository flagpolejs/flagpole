import { Property } from "./property";
import { Element } from "./element";
import { iResponse } from "./response";
export declare class Value extends Property {
    select(path: string, findIn?: any): Element;
    and(): Element;
    length(): Value;
    text(): Value;
    parseFloat(): Value;
    parseInt(): Value;
    trim(): Value;
    toLowerCase(): Value;
    toUpperCase(): Value;
    replace(search: string | RegExp, replace: string): Value;
    greaterThan(value: number): iResponse;
    greaterThanOrEquals(value: any): iResponse;
    lessThan(value: number): iResponse;
    lessThanOrEquals(value: any): iResponse;
}
