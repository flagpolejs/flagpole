import { iProperty, iResponse } from "./index";
import { Property } from "./property";
export declare class Value extends Property implements iProperty {
    constructor(response: iResponse, name: string, obj: any);
    greaterThan(value: number): iResponse;
    greaterThanOrEquals(value: any): iResponse;
    lessThan(value: number): iResponse;
    lessThanOrEquals(value: any): iResponse;
    equals(value: any, permissiveMatching?: boolean): iResponse;
    similarTo(value: any): iResponse;
}
