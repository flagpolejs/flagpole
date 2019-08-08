import { iResponse, GenericResponse, ResponseType, NormalizedResponse } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";
import { Value } from './value';

export class ScriptResponse extends GenericResponse implements iResponse {

    public get typeName(): string {
        return 'Script';
    }

    public get type(): ResponseType {
        return ResponseType.script;
    }

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        this.context.assert(this.httpStatusCode).between(200, 299);
        this.headers('Content-Type')
            .label('MIME Type matches expected value for JavaScript')
            .matches(/(text|application)\/(javascript|ecmascript)/);
    }

    public select(path: string): Node {
        return new Node(this, path, null);
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        throw new Error('Evaluate does not support script resources.');
    }

    public async asyncSelect(path: string): Promise<Value> {
        throw new Error('Script Response does not yet support select');
    }

    public async asyncSelectAll(path: string): Promise<Value[]> {
        throw new Error('Script Response does not yet support selectAll');
    }

}
