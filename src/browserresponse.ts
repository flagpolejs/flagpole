import { Scenario } from "./scenario";
import { NodeElement } from "./nodeelement";
import { Node } from "./node";
import { iResponse, NormalizedResponse, GenericResponse, ResponseType } from "./response";
import { Browser } from './browser';
import { Page, ElementHandle } from 'puppeteer';
import { AssertionContext } from './assertioncontext';

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

    public async asyncSelect(path: string, findIn?: any): Promise<NodeElement | null> {
        const response: iResponse = this;
        const page: Page | null = this.scenario.getBrowser().getPage();
        if (page !== null) {
            const el: ElementHandle<Element> | null = await page.$(path);
            if (el !== null) {
                return new NodeElement(el, new AssertionContext(response.scenario, response), path);
            }
        }
        return null;
    }

    public async asyncSelectAll(path: string, findIn?: any): Promise<NodeElement[]> {
        const response: iResponse = this;
        const page: Page | null = this.scenario.getBrowser().getPage();
        const nodeElements: NodeElement[] = [];
        if (page !== null) {
            const elements: ElementHandle[] = await page.$$(path);
            elements.forEach((el: ElementHandle<Element>) => {
                nodeElements.push(
                    new NodeElement(
                        el,
                        new AssertionContext(response.scenario, response),
                        path
                    )
                );
            });
        }
        return nodeElements;
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        if (this.page !== null) {
            const functionName: string = `flagpole_${Date.now()}`;
            const jsToInject: string = `window.${functionName} = ${callback}`;
            await this.page.addScriptTag({ content: jsToInject });
            const result = await this.page.evaluate(({ functionName }) => {
                return window[functionName]();
            }, { functionName });
            return result;
        }
        throw new Error('Page is null');
    }

    public get browser(): Browser {
        return this.scenario.getBrowser();
    }

    public get page(): Page | null {
        return this.scenario.getBrowser().getPage();
    }

}
