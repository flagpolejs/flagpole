import { iResponse, SimplifiedResponse } from "./index";
import { Scenario } from "./scenario";
import { GenericRequest } from "./genericrequest"
import { Element } from "./property";

export class JsonRequest extends GenericRequest implements iResponse {

    protected json: {};

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.json = JSON.parse(response.body);
        (this.json) ?
            this.scenario.pass('JSON is valid') :
            this.scenario.fail('JSON is not valid');
    }

    /**
     * Select a json property in this response body
     *
     * @param {string} path
     * @param findIn
     * @returns {Element}
     */
    public select(path: string, findIn?: any): Element {
        let args: Array<string> = path.split('.');
        let obj: any = findIn || this.json;
        let response: iResponse = this;
        let element: Element;
        if (args.every(function(value: string) {
                obj = obj[value];
                return (typeof obj !== 'undefined');
            })) {
            element = new Element(response, path, obj);
        }
        else {
            element = new Element(response, path, undefined);
        }
        // Create the property
        this.lastElement(element);
        // Inferred exists assertion
        element.exists();
        return element;
    }

}
