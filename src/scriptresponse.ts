import { iResponse, GenericResponse, ResponseType, NormalizedResponse } from "./response";
import { Scenario } from "./scenario";
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
        this.context.assert(this.statusCode).between(200, 299);
        this.context.assert('MIME Type matches expected value for JavaScript', this.header('Content-Type')).matches(/(text|application)\/(javascript|ecmascript)/);
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        throw new Error('Evaluate does not support script resources.');
    }

    public async find(path: string): Promise<Value> {
        throw new Error('Script Response does not yet support select');
    }

    public async findAll(path: string): Promise<Value[]> {
        throw new Error('Script Response does not yet support selectAll');
    }

}
