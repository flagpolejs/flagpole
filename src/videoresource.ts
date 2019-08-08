import { iResponse, GenericResponse, NormalizedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";

export class VideoResource extends GenericResponse implements iResponse {

    public get typeName(): string {
        return 'Video';
    }

    public get type(): ResponseType {
        return ResponseType.video;
    }

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        this.context.assert(this.httpStatusCode).between(200, 299);
        this.headers('Content-Type')
            .label('MIME Type matches expected value for video')
            .matches(/(video|mpegurl)/i);
    }

    public select(path: string): Node {
        return new Node(this, path, null);
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        throw new Error('Evaluate does not support video resources.');
    }

    public async asyncSelect(path: string): Promise<any | null> {
        throw new Error('Video Response does not yet support select');
    }

    public async asyncSelectAll(path: string): Promise<any[]> {
        throw new Error('Video Response does not yet support selectAll');
    }

}
