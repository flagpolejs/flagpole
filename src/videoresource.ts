import { iResponse, GenericResponse, SimplifiedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";

export class VideoResource extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.status().between(200, 299);
        this.headers('Content-Type')
            .label('MIME Type matches expected value for video')
            .matches(/(video|mpegurl)/i);
    }

    public select(path: string): Node {
        return new Node(this, path, null);
    }

    public getType(): ResponseType {
        return ResponseType.script;
    }

}
