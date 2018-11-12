import { Scenario } from "./scenario";
import { Node } from "./node";
import { iResponse, SimplifiedResponse, GenericResponse } from "./response";
export declare class HtmlResponse extends GenericResponse implements iResponse {
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    select(path: string, findIn?: any): Node;
    parents(selector?: string): Node;
    parent(): Node;
    closest(selector: string): Node;
    children(selector?: string): Node;
    siblings(selector?: string): Node;
    next(selector?: string): Node;
    prev(selector?: string): Node;
}
