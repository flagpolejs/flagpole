import { iResponse, NormalizedResponse, GenericResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";
import { Value } from './value';

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
        const json = this.jsonBody;
        (json !== null) ?
            this.assert(true, 'JSON is valid') :
            this.assert(false, 'JSON is valid', response.body.substr(0, Math.min(32, response.body.length)));
        this._json = json || {};
    }

    public getRoot(): any {
        return this._json;
    }

    /**
     * Select a json property in this response body
     *
     * @param {string} path
     * @param findIn
     * @returns {Node}
     */
    public select(path: string, findIn?: any): Node {
        let args: Array<string> = path.split('.');
        let obj: any = findIn || this._json;
        let response: iResponse = this;
        let element: Node;
        if (args.every(function(value: string) {
                obj = obj[value];
                return (typeof obj !== 'undefined');
            })) {
            element = new Node(response, path, obj);
        }
        else {
            element = new Node(response, path, undefined);
        }
        // Create the property
        this.setLastElement(path, element);
        // Inferred exists assertion
        element.exists();
        return element;
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
    }

    public async asyncSelectAll(path: string, findIn?: any): Promise<Value[]> {
        // Was there a wildcard anywhere in it?
        if (path.indexOf('*') >= 0) {
            const selectPath: string[] = this._getSelectPath(path);
            let selection: any = findIn || this._json;
            let matches: any[] = [];
            // Loop through each part of selection path
            // TODO: Wildcard path for JSON
            throw new Error('Flagpole does not yet support wildcard paths.');
        }
        // If no wildcard then it is the same as a regular select because there can only be one match
        else {
            return [(await this.asyncSelect(path, findIn))];
        }
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
