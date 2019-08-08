import { iResponse, GenericResponse, NormalizedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";
import { Value } from './value';

export class ResourceResponse extends GenericResponse implements iResponse {

    public get type(): ResponseType {
        return ResponseType.resource;
    }

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        this.context.assert(this.httpStatusCode).between(200, 299);
    }

    public get typeName(): string {
        return 'Resource';
    }

    public select(path: string): Node {
        return new Node(this, path, null);
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        throw new Error('Evaluate does not support generic resources.');
    }

    public async asyncSelect(path: string): Promise<Value> {
        throw new Error('Generic Response does not yet support select');
    }

    public async asyncSelectAll(path: string): Promise<Value[]> {
        throw new Error('Generic Response does not yet support selectAll');
    }

}
