import { iResponse, GenericResponse, NormalizedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";

export class ResourceResponse extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        this.status().between(200, 299);
    }

    public get typeName(): string {
        return 'Resource';
    }

    public select(path: string): Node {
        return new Node(this, path, null);
    }

    public getType(): ResponseType {
        return ResponseType.resource;
    }

}
