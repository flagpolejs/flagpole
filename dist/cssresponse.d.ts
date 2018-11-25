import { iResponse, GenericResponse, SimplifiedResponse } from "./response";
import { Scenario } from "./scenario";
export declare class CssResponse extends GenericResponse implements iResponse {
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    protected validate(): void;
}
