import { iValue, iAssertionContext } from "../interfaces";
import { DOMElement } from "../html/domelement";
import { ValuePromise } from "../value-promise";
import { JsonDoc } from "../json/jpath";
import { sendAppiumRequest } from "./appium-helpers";
import { AppiumResponse } from "./appiumresponse";

export class AppiumElement extends DOMElement implements iValue {
  protected _elementId: string;
  protected _response: JsonDoc | undefined;

  public static async create(
    input: string,
    context: iAssertionContext,
    name: string,
    elementId: string
  ): Promise<AppiumElement> {
    const element = new AppiumElement(input, context, name, elementId);
    element._tagName = await element._getTagName();
    if (name === null || name === "") {
      if (element._tagName !== null) {
        element._name = `<${element.tagName}>`;
      }
    }
    return element;
  }

  protected constructor(
    input: string,
    context: iAssertionContext,
    name: string | null,
    elementId: string
  ) {
    super(input, context, name || "Appium Element", input);
    this._elementId = elementId || "";
  }

  public async click(): Promise<iValue> {
    const response = this.context.response as AppiumResponse;
    await sendAppiumRequest(
      this.context.scenario,
      `/session/${response.sessionId}/element/${this._elementId}/click`,
      {
        method: "post",
      }
    );
    return this;
  }

  public find(selector: string): ValuePromise {
    throw "find not implemented";
  }

  public async findAll(selector: string): Promise<iValue[]> {
    throw "findAll not implemented";
  }

  public async type(input: string): Promise<iValue> {
    const response = this.context.response as AppiumResponse;
    const res = await sendAppiumRequest(
      this.context.scenario,
      `/session/${response.sessionId}/element/${this._elementId}/value`,
      {
        method: "post",
        data: {
          text: input,
        },
      }
    );
    if (res.jsonRoot.value?.error) {
      throw "Element cannot be typed into. Did you choose the correct element?";
    }
    return this;
  }

  public async clear(): Promise<iValue> {
    const response = this.context.response as AppiumResponse;
    await sendAppiumRequest(
      this.context.scenario,
      `/session/${response.sessionId}/element/${this._elementId}/clear`,
      {
        method: "post",
      }
    );
    return this;
  }

  public async clearThenType(input: string): Promise<iValue> {
    await this.clear();
    await this.type(input);
    return this;
  }

  public async isVisible(): Promise<boolean> {
    const response = this.context.response as AppiumResponse;
    const res = await sendAppiumRequest(
      this.context.scenario,
      `/session/${response.sessionId}/element/${this._elementId}/displayed`,
      {
        method: "get",
      }
    );

    return res.jsonRoot.value;
  }

  protected async _getValue(): Promise<any> {
    throw "_getValue not implemented";
  }

  protected async _getText(): Promise<string> {
    const res = await sendAppiumRequest(
      this.context.scenario,
      `/session/${this.context.scenario.get("sessionId")}/element/${
        this._elementId
      }/text`,
      {
        method: "get",
      }
    );

    return res.jsonRoot.value;
  }

  protected async _getTagName(): Promise<string> {
    const response = this.context.response as AppiumResponse;
    const res = await sendAppiumRequest(
      this.context.scenario,
      `/session/${response.sessionId}/element/${this._elementId}/name`,
      {
        method: "get",
      }
    );

    return res.jsonRoot.value || null;
  }

  protected async _getProperty(key: string): Promise<any> {
    throw "_getProperty not implemented";
  }

  protected async _getOuterHtml(): Promise<string> {
    throw "_getOuterHtml not implemented";
  }

  protected async _getInnerHtml(): Promise<string> {
    throw "_getInnerHtml not implemented";
  }

  protected async _getInnerText(): Promise<string> {
    throw "_getInnerText not implemented";
  }

  protected async _getClassName(): Promise<string> {
    throw "_getClassName not implemented";
  }

  protected async _getAttribute(key: string): Promise<string | null> {
    const possibleAttributes = [
      "checkable",
      "checked",
      "class",
      "className",
      "clickable",
      "content-desc",
      "contentDescription",
      "enabled",
      "focusable",
      "focused",
      "long-clickable",
      "longClickable",
      "package",
      "password",
      "resource-id",
      "resourceId",
      "scrollable",
      "selection-start",
      "selection-end",
      "selected",
      "text",
      "name",
      "bounds",
      "displayed",
      "contentSize",
    ];

    if (!possibleAttributes.includes(key)) {
      throw `Invalid attribute: must be one of ${possibleAttributes.join(
        ", "
      )}`;
    }

    const response = this.context.response as AppiumResponse;

    const res = await sendAppiumRequest(
      this.context.scenario,
      `/session/${response.sessionId}/element/${this._elementId}/attribute/${key}`,
      {
        method: "get",
      }
    );

    return res.jsonRoot.value;
  }

  public toString(): string {
    return this._elementId;
  }
}
