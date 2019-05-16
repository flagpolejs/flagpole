import { iResponse, GenericResponse, ResponseType, NormalizedResponse } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";

export class ScriptResponse extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        this.status().between(200, 299);
        this.headers('Content-Type')
            .label('MIME Type matches expected value for JavaScript')
            .matches(/(text|application)\/(javascript|ecmascript)/);
    }

    public get typeName(): string {
        return 'Script';
    }

    public select(path: string): Node {
        return new Node(this, path, null);
    }

    public getType(): ResponseType {
        return ResponseType.script;
    }

}
