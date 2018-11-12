import { Flagpole } from "./index";
import { Scenario } from "./scenario";
import { Node } from "./node";
import { iResponse, SimplifiedResponse, GenericResponse } from "./response";

let cheerio: CheerioAPI = require('cheerio');
let $: CheerioStatic;

export class HtmlResponse extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        $ = cheerio.load(response.body);
    }

    public getRoot(): any {
        return $;
    }

    /**
     * Select the html element at this CSS Selector or XPath
     *
     * @param {string} path
     * @param findIn
     * @returns {Node}
     */
    public select(path: string, findIn?: any): Node {
        let obj: any = null;
        // If findIn is a cheerio object, then look in it
        if (Flagpole.toType(findIn) == 'cheerio') {
            obj = findIn.find(path);
        }
        // Otheriwse use top level context
        else {
            obj = $(path);
        }
        // Create the property
        let element: Node = new Node(this, path, obj);
        this.setLastElement(path, element);
        // Inferred exists assertion
        element.exists();
        return element;
    }

}
