import { iResponse, GenericResponse, SimplifiedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
export declare class ImageResponse extends GenericResponse implements iResponse {
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    getType(): ResponseType;
}
