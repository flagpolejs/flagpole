import { iResponse, NormalizedResponse, GenericResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Value } from './value';

const jmespath = require('jmespath');

export class JsonResponse extends GenericResponse implements iResponse {

    protected _json: {};

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
        /*
        const selectPath: string[] = this._getSelectPath(path);
        // Start searching on either the find in json or the root json
        let selection: any = findIn || this._json;
        // If we find a value that matches all
        selectPath.every((part: string) => {
            selection = selection[part];
            return (typeof selection !== 'undefined');
        });
        return this._wrapAsValue(
            (typeof selection != undefined) ? selection : null,
            path
        );
        */
        const searchIn = findIn || this._json;
        const selection = jmespath.search(searchIn, path);
        return this._wrapAsValue(selection, path);
    }

    public async asyncSelectAll(path: string, findIn?: any): Promise<Value[]> {
        throw new Error('selectAll() is not supported by JSON scenarios, please use select()');
    }

    private _getSelectPath(path: string): string[] {
        // Replace [ and ] and space with .
        path = path.replace(/[\[\] ]/g, '.');
        // Remove quotes
        path = path.replace(/['"]/g, '');
        // Fix the situation where ]. will create .. (remove any cases of multiple dots)
        path = path.replace(/\.{2,}/g, '.');
        // Get array of each part
        return path.split('.');
    }

}
