import { iResponse, NormalizedResponse, GenericResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Value } from './value';
import { iJPath, jPath } from './jpath';

export class JsonResponse extends GenericResponse implements iResponse {

    protected _json: {};
    protected _jPath: iJPath | undefined;

    public get typeName(): string {
        return 'JSON';
    }

    public get type(): ResponseType {
        return ResponseType.json;
    }

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        const json = this.jsonBody.$;
        this.context.assert('JSON is valid', json).type.not.equals('null')
        this._json = json || {};
    }

    public getRoot(): any {
        return this._json;
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        return callback.apply(context, [ this._json ]);
    }

    /**
     * Find first matching item
     * 
     * @param path 
     * @param findIn 
     */
    public async asyncSelect(path: string, findIn?: any): Promise<Value> {
        await this.loadJmesPath();
        if (typeof this._jPath == 'undefined') {
            throw new Error('Could not load jmespath');
        }
        const searchIn = findIn || this._json;
        const selection = await this._jPath.search(searchIn, path);
        return this._wrapAsValue(selection, path);
    }

    public async asyncSelectAll(path: string, findIn?: any): Promise<Value[]> {
        throw new Error('selectAll() is not supported by JSON scenarios, please use select()');
    }

    private async loadJmesPath(): Promise<any> {
        // We haven't tried to load query engines yet
        if (typeof this._jPath == 'undefined') {
            // Try importing jmespath
            return import('jmespath')
                // Got it, so save it and return it
                .then(jpath => {
                    this._jPath = jpath;
                    return this._jPath;
                })
                // Couldn't load jmespath, so set it to null
                .catch((e) => {
                    this._jPath = new jPath();
                    return this._jPath;
                });
        }
        else {
            return this._jPath;
        }
    }

}
