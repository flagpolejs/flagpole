import { iResponse, SimplifiedResponse, GenericResponse } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";

export class JsonResponse extends GenericResponse implements iResponse {

    protected json: {};

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.json = JSON.parse(response.body);
        this.valid();
    }

    protected valid(): iResponse {
        return this.assert(
            (typeof this.json === 'object' && this.json  !== null),
            'JSON is valid', 'JSON is not valid'
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

}
