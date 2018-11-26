import { Scenario } from "./scenario";
import { Node } from "./node";
import { iResponse, SimplifiedResponse, GenericResponse, ResponseType } from "./response";
export declare class HtmlResponse extends GenericResponse implements iResponse {
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    getType(): ResponseType;
    getRoot(): any;
    select(path: string, findIn?: any): Node;
}
