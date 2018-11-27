import { iResponse, GenericResponse, SimplifiedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";

export class ResourceResponse extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.status().between(200, 299);
    }
    public select(path: string): Node {
        return new Node(this, path, null);
    }

    public getType(): ResponseType {
        return ResponseType.resource;
    }

}
