import { Suite } from "./suite";
import { SimplifiedResponse } from "./response";
export declare class Flagpole {
    static Suite(title: string): Suite;
    static heading(message: string): void;
    static message(message: string, color?: string): void;
    static toSimplifiedResponse(response: any, body: any): SimplifiedResponse;
    static isNullOrUndefined(obj: any): boolean;
    static toType(obj: any): string;
}
