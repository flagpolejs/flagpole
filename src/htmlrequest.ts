import {Flagpole, iResponse, SimplifiedResponse} from "./index";
import { Scenario } from "./scenario";
import { GenericRequest } from "./genericrequest";
import { Element } from "./property";
let cheerio = require('cheerio');


export class HtmlRequest extends GenericRequest implements iResponse {

    private $;

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.$ = cheerio.load(response.body);
    }

    /**
     * Select the html element at this CSS Selector or XPath
     *
     * @param {string} path
     * @param findIn
     * @returns {Element}
     */
    public select(path: string, findIn?: any): Element {
        let obj: any = null;
        // If findIn is a cheerio object, then look in it
        if (Flagpole.toType(findIn) == 'cheerio') {
            obj = findIn.find(path);
        }
        // Otheriwse use top level context
        else {
            obj = this.$(path);
        }
        // Create the property
        let element: Element = new Element(this, path, obj);
        this.lastElement(element);
        // Inferred exists assertion
        element.exists();
        return element;
    }

}
