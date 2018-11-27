import { iResponse, GenericResponse, SimplifiedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";
export declare class CssResponse extends GenericResponse implements iResponse {
    protected css: any;
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    select(path: string): Node;
    getType(): ResponseType;
    protected validate(): void;
}
