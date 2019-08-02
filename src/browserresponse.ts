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

    public asyncSelect(path: string, findIn?: any): Promise<NodeElement> {
        const response: iResponse = this;
        const page: Page | null = this.scenario.getBrowser().getPage();
        return new Promise((resolve, reject) => {
            if (page !== null) {
                page.$(path)
                    .then((el: ElementHandle<Element> | null) => {
                        (el !== null) ?
                            resolve(
                                new NodeElement(el, new AssertionContext(response.scenario, response), path)
                            ) :
                            reject(`No element matching ${path} was found`);
                    })
                    .catch(reject);
            }
            else {
                reject('No browser page found, so could not select.');
            }
        })
    }

    public asyncSelectAll(path: string, findIn?: any): Promise<NodeElement[]> {
        const response: iResponse = this;
        const page: Page | null = this.scenario.getBrowser().getPage();
        return new Promise((resolve, reject) => {
            if (page !== null) {
                page.$$(path)
                    .then((elements: ElementHandle<Element>[]) => {
                        const nodeElements: NodeElement[] = [];
                        elements.forEach((el: ElementHandle<Element>) => {
                            nodeElements.push(
                                new NodeElement(
                                    el,
                                    new AssertionContext(response.scenario, response),
                                    path
                                )
                            );
                        });
                        resolve(nodeElements);
                    })
                    .catch(reject);
            }
            else {
                reject('No browser page found, so could not select.');
            }
        })
    }

    public get browser(): Browser {
        return this.scenario.getBrowser();
    }

    public get page(): Page | null {
        return this.scenario.getBrowser().getPage();
    }

}
