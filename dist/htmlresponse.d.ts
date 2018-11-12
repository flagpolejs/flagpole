import { Scenario } from "./scenario";
import { Node } from "./node";
import { iResponse, SimplifiedResponse, GenericResponse } from "./response";
export declare class HtmlResponse extends GenericResponse implements iResponse {
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    getRoot(): any;
    select(path: string, findIn?: any): Node;
}
