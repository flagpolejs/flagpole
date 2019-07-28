import { Scenario } from "./scenario";
import { Node } from "./node";
import { iResponse, NormalizedResponse, GenericResponse, ResponseType } from "./response";
import { Browser } from './browser';
import { Page, ElementHandle } from 'puppeteer';

export class BrowserSelector {

    public readonly path: string;
    public readonly response: iResponse;

    constructor(path: string, response: iResponse) {
        this.path = path;
        this.response = response;
    }

    public toString() {
        return this.path;
    }

}

export class BrowserResponse extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
    }

    public get typeName(): string {
        return 'Browser';
    }

    /**
     * 
     */
    public getType(): ResponseType {
        return ResponseType.browser;
    }

    /**
     * This does nothing so far
     *
     * @param {string} path
     * @param findIn
     * @returns {Node}
     */
    public select(path: string, findIn?: any): Node {
        const obj: BrowserSelector = new BrowserSelector(path, this);
        const element: Node = new Node(this, path, obj);
        this.setLastElement(path, element);
        return element;
    }

    public async asyncSelect(path: string, findIn?: any): Promise<Node> {
        const page = await this.scenario.getBrowser().getPage();
        let obj: ElementHandle<Element> | null = null;
        if (page !== null) {
            obj = await page.$(path);
        }
        const element: Node = new Node(this, path, obj);
        this.setLastElement(path, element);
        element.exists();
        return element;
    }

    public get browser(): Browser {
        return this.scenario.getBrowser();
    }

    public get page(): Page | null {
        return this.scenario.getBrowser().getPage();
    }

}
