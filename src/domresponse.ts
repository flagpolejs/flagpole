import { ProtoResponse } from "./response";
import { iValue } from "./interfaces";
import { asyncSome, asyncForEach } from "./util";

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
    await asyncForEach(elements, async (element: iValue) => {
      if (await this._elementHasText(element, searchForText)) {
        matchingElements.push(element);
      }
    });
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
    await asyncSome(elements, async (element: iValue) => {
      if (await this._elementHasText(element, searchForText)) {
        matchingElement = element;
        return true;
      }
    });
    return matchingElement === null
      ? this._wrapAsValue(null, `${selector} having text ${searchForText}`)
      : matchingElement;
  }

  protected async _elementHasText(
    element: iValue,
    searchForText: string | RegExp
  ) {
    const text: string = (await element.getInnerText()).$;
    if (typeof searchForText == "string") {
      if (text.toLowerCase().indexOf(searchForText.toLowerCase()) >= 0) {
        return true;
      }
    } else if (searchForText.test(text.toString())) {
      return true;
    }
    return false;
  }
}
