import { iResponse, SimplifiedResponse, GenericResponse } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";
export declare class JsonResponse extends GenericResponse implements iResponse {
    protected json: {};
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    getRoot(): any;
    select(path: string, findIn?: any): Node;
}
