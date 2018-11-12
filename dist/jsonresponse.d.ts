import { iResponse, SimplifiedResponse, GenericResponse } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";
export declare class JsonResponse extends GenericResponse implements iResponse {
    protected json: {};
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
