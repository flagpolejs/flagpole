import { Scenario } from "./scenario";
import { Node } from "./node";
import { iResponse, SimplifiedResponse, GenericResponse, ResponseType } from "./response";
import { Browser } from './Browser';
import { Page } from 'puppeteer';

export class BrowserResponse extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
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
        let obj: any = null;
        let element: Node = new Node(this, path, obj);
        this.setLastElement(path, element);
        // Inferred exists assertion
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
