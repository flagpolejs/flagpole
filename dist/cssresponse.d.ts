import { iResponse, GenericResponse, SimplifiedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
export declare class CssResponse extends GenericResponse implements iResponse {
    protected css: any;
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    getType(): ResponseType;
    protected validate(): void;
}
