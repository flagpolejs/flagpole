import { iResponse, GenericResponse, SimplifiedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";

export class ResourceResponse extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.status().between(200, 299);
    }

    public getType(): ResponseType {
        return ResponseType.resource;
    }

}
