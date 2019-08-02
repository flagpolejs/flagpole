import { Flagpole } from "./index";
import { Scenario } from "./scenario";
import { Node } from "./node";
import { iResponse, NormalizedResponse, GenericResponse, ResponseType } from "./response";
import { NodeElement } from './nodeelement';
import { AssertionContext } from './assertioncontext';

let cheerio: CheerioAPI = require('cheerio');
let $: CheerioStatic;

export class HtmlResponse extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        $ = cheerio.load(response.body);
    }

    public get typeName(): string {
        return 'HTML';
    }

    public getType(): ResponseType {
        return ResponseType.html;
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
        if (obj.length == 0) {
            obj = null;
        }
        let element: Node = new Node(this, path, obj);
        this.setLastElement(path, element);
        // Inferred exists assertion
        element.exists();
        return element;
    }

    public asyncSelect(path: string, findIn?: any): Promise<NodeElement> {
        return new Promise((resolve, reject) => {
            const selection: Cheerio = (Flagpole.toType(findIn) == 'cheerio') ?
                findIn.find(path) :
                $(path);
            if (selection.length > 0) {
                resolve(
                    new NodeElement(
                        selection.eq(0),
                        new AssertionContext(this.scenario, this),
                        path
                    )
                );
            }
            else {
                reject(`Could not find element at ${path}`);
            }
        });
    }

    public asyncSelectAll(path: string, findIn?: any): Promise<NodeElement[]> {
        const response: iResponse = this;
        return new Promise((resolve, reject) => {
            const elements: Cheerio = (Flagpole.toType(findIn) == 'cheerio') ?
                findIn.find(path) :
                $(path);
            if (elements.length > 0) {
                const nodeElements: NodeElement[] = [];
                elements.each((i: number) => {
                    nodeElements.push(
                        new NodeElement(
                            $(elements.get(i)),
                            new AssertionContext(response.scenario, response),
                            path
                        )
                    );
                });
                resolve(nodeElements);
            }
            else {
                reject(`Could not find element at ${path}`);
            }
        });
    }

}
