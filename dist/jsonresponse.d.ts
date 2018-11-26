import { iResponse, SimplifiedResponse, GenericResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";
export declare class JsonResponse extends GenericResponse implements iResponse {
    protected json: {};
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    getType(): ResponseType;
    protected valid(): iResponse;
    getRoot(): any;
    select(path: string, findIn?: any): Node;
}
