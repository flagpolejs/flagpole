import { DOMElement } from "./domelement";
import { ProtoResponse } from "./response";
import { Value } from './value';
import { iResponse, iDOMElement } from './interfaces';
import { iValue } from '.';

export abstract class DOMResponse extends ProtoResponse implements iResponse {

    abstract find(path: string): Promise<iDOMElement | iValue>;
    abstract findAll(path: string): Promise<iDOMElement[]>;

    public async findAllHavingText(selector: string, searchForText: string | RegExp): Promise<iDOMElement[]> {
        if (this.isBrowser && this.context.page === null) {
            throw new Error('No page object was found.');
        }
        let matchingElements: iDOMElement[] = [];
        const elements: iDOMElement[] = await this.findAll(selector);
        // Loop through elements until we get to the end or find a match
        for (let i = 0; i < elements.length; i++) {
            const element: iDOMElement = elements[i];
            const text: iValue = await element.getText();
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

    public async findHavingText(selector: string, searchForText: string | RegExp): Promise<iDOMElement | iValue> {
        if (this.isBrowser && this.context.page === null) {
            throw new Error('No page object was found.');
        }
        let matchingElement: iDOMElement | null = null;
        const elements: iDOMElement[] = await this.findAll(selector);
        // Loop through elements until we get to the end or find a match
        for (let i = 0; i < elements.length && matchingElement === null; i++) {
            const element: iDOMElement = elements[i];
            const text: iValue = await element.getText();
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
        return (matchingElement === null) ?
            this._wrapAsValue(null, `${selector} having text ${searchForText}`) :
            matchingElement;
    };


}