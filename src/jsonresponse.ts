import { iResponse, NormalizedResponse, GenericResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";

export class JsonResponse extends GenericResponse implements iResponse {

    protected json: {};

    public get typeName(): string {
        return 'JSON';
    }

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        try {
            this.json = JSON.parse(response.body);
            this.valid();
        }
        catch {
            this.json = {};
            this.scenario.assert(false, 'JSON is valid', response.body.substr(0, Math.min(32, response.body.length)));
        }
    }

    public getType(): ResponseType {
        return ResponseType.json;
    }

    protected valid(): iResponse {
        return this.assert(
            (typeof this.json === 'object' && this.json  !== null),
            'JSON is valid'
        );
    }

    public getRoot(): any {
        return this.json;
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
        let obj: any = findIn || this.json;
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

    public asyncSelect(path: string, findIn?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const args: Array<string> = path.split('.');
            let obj: any = findIn || this.json;
            if (args.every(function (value: string) {
                obj = obj[value];
                return (typeof obj !== 'undefined');
            })) {
                resolve(obj);
            }
            else {
                reject('Could not find that property.')
            }
        });
    }

    public asyncSelectAll(path: string, findIn?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const args: Array<string> = path.split('.');
            let obj: any = findIn || this.json;
            if (args.every(function (value: string) {
                obj = obj[value];
                return (typeof obj !== 'undefined');
            })) {
                resolve([ obj ]);
            }
            else {
                reject('Could not find that property.')
            }
        });
    }

}
