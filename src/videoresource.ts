import { iResponse, GenericResponse, NormalizedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";

export class VideoResource extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        this.status().between(200, 299);
        this.headers('Content-Type')
            .label('MIME Type matches expected value for video')
            .matches(/(video|mpegurl)/i);
    }

    public get typeName(): string {
        return 'Video';
    }

    public select(path: string): Node {
        return new Node(this, path, null);
    }

    public asyncSelect(path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            reject('Video does not support select.');
        });
    }

    public asyncSelectAll(path: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            reject('Video does not support selectAll.');
        });
    }

    public getType(): ResponseType {
        return ResponseType.script;
    }

}
