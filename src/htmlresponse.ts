import { Flagpole } from "./index";
import { Scenario } from "./scenario";
import { Node } from "./node";
import { iResponse, NormalizedResponse, GenericResponse, ResponseType } from "./response";
import { NodeElement } from './nodeelement';
import { AssertionContext } from './assertioncontext';

let cheerio: CheerioAPI = require('cheerio');
let $: CheerioStatic;

export class HtmlResponse extends GenericResponse implements iResponse {

    public get typeName(): string {
        return 'HTML';
    }

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        $ = cheerio.load(response.body);
    }

    public getType(): ResponseType {
        return ResponseType.html;
    }

    public getRoot(): any {
        return $;
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        return callback.apply(context, [ $ ]);
    }

    public async asyncSelect(path: string, findIn?: any): Promise<NodeElement | null> {
        const selection: Cheerio = (Flagpole.toType(findIn) == 'cheerio') ?
            findIn.find(path) :
            $(path);
        if (selection.length > 0) {
            return new NodeElement(
                selection.eq(0),
                new AssertionContext(this.scenario, this),
                path
            );
        }
        else {
            return null;
        }
    }

    public async asyncSelectAll(path: string, findIn?: any): Promise<NodeElement[]> {
        const response: iResponse = this;
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
            return nodeElements;
        }
        else {
            return [];
        }
    }

    /**
     * DEPRECATED
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

}
