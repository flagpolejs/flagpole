import { ProtoResponse } from "./response";
import { iValue } from "./interfaces";

export abstract class DOMResponse extends ProtoResponse {
  abstract find(path: string): Promise<iValue>;
  abstract findAll(path: string): Promise<iValue[]>;

  public async findAllHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue[]> {
    if (this.isBrowser && this.context.page === null) {
      throw new Error("No page object was found.");
    }
    let matchingElements: iValue[] = [];
    const elements: iValue[] = await this.findAll(selector);
    // Loop through elements until we get to the end or find a match
    for (let i = 0; i < elements.length; i++) {
      const element: iValue = elements[i];
      const text: iValue = await element.getText();
      if (typeof searchForText == "string") {
        if (text.toString() == String(searchForText)) {
          matchingElements.push(element);
        }
      } else {
        if (searchForText.test(text.toString())) {
          matchingElements.push(element);
        }
      }
    }
    return matchingElements;
  }

  public async findHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue> {
    if (this.isBrowser && this.context.page === null) {
      throw new Error("No page object was found.");
    }
    let matchingElement: iValue | null = null;
    const elements: iValue[] = await this.findAll(selector);
    // Loop through elements until we get to the end or find a match
    for (let i = 0; i < elements.length && matchingElement === null; i++) {
      const element: iValue = elements[i];
      const text: iValue = await element.getText();
      if (typeof searchForText == "string") {
        if (text.toString() == String(searchForText)) {
          matchingElement = element;
        }
      } else {
        if (searchForText.test(text.toString())) {
          matchingElement = element;
        }
      }
    }
    return matchingElement === null
      ? this._wrapAsValue(null, `${selector} having text ${searchForText}`)
      : matchingElement;
  }
}
