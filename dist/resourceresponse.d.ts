import { iResponse, GenericResponse, SimplifiedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";
export declare class ResourceResponse extends GenericResponse implements iResponse {
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    select(path: string): Node;
    getType(): ResponseType;
}
