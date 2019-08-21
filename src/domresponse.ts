import { DOMElement } from "./domelement";
import { iResponse, ProtoResponse } from "./response";
import { Value } from '.';

export abstract class DOMResponse extends ProtoResponse implements iResponse {

    public async findAllHavingText(selector: string, searchForText: string | RegExp): Promise<DOMElement[]> {
        if (this.isBrowser && this.context.page === null) {
            throw new Error('No page object was found.');
        }
        let matchingElements: DOMElement[] = [];
        const elements: DOMElement[] = await this.findAll(selector);
        // Loop through elements until we get to the end or find a match
        for (let i = 0; i < elements.length; i++) {
            const element: DOMElement = elements[i];
            const text: Value = await element.getText();
            if (typeof searchForText == 'string') {
                if (text.toString() == String(searchForText)) {
                    matchingElements.push(element);
                }
            }
            else {
                if (searchForText.test(text.toString())) {
                    matchingElements.push(element);
                }
            }
        }
        return matchingElements;
    };

    public async findHavingText(selector: string, searchForText: string | RegExp): Promise<DOMElement | null> {
        if (this.isBrowser && this.context.page === null) {
            throw new Error('No page object was found.');
        }
        let matchingElement: DOMElement | null = null;
        const elements: DOMElement[] = await this.findAll(selector);
        // Loop through elements until we get to the end or find a match
        for (let i = 0; i < elements.length && matchingElement === null; i++) {
            const element: DOMElement = elements[i];
            const text: Value = await element.getText();
            if (typeof searchForText == 'string') {
                if (text.toString() == String(searchForText)) {
                    matchingElement = element;
                }
            }
            else {
                if (searchForText.test(text.toString())) {
                    matchingElement = element;
                }
            }
        }
        return matchingElement;
    };


}