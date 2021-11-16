import { iValue, iAssertionContext, iBounds } from "../interfaces";
import { DOMElement } from "../html/domelement";
import { ValuePromise } from "../value-promise";
import { JsonDoc } from "../json/jpath";
import { sendAppiumRequest } from "./appium-helpers";
import { AppiumResponse } from "./appiumresponse";

export class AppiumElement extends DOMElement implements iValue {
  protected _elementId: string;
  protected _response: JsonDoc | undefined;

  public static async create(
    input: any,
    context: iAssertionContext,
    name: string | null = null,
    elementId: string | undefined = undefined
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
    input: any,
    context: iAssertionContext,
    name?: string | null,
    elementId?: string
  ) {
    super(input, context, name || "Appium Element");
    this._elementId = elementId || "";
    this._input = input;
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

  public async type(input: string): Promise<void> {
    const res = await sendAppiumRequest(
      this.context.scenario,
      `/session/${this.context.scenario.get("sessionId")}/element/${
        this._elementId
      }/value`,
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
  }

  public async clear(): Promise<void> {
    const response = this.context.response as AppiumResponse;
    await sendAppiumRequest(
      this.context.scenario,
      `/session/${response.sessionId}/element/${this._elementId}/clear`,
      {
        method: "post",
      }
    );
  }

  public async clearThenType(input: string): Promise<void> {
    await this.clear();
    await this.type(input);
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

  public async getBounds(): Promise<iBounds | null> {
    const response = this.context.response as AppiumResponse;
    const res = await sendAppiumRequest(
      this.context.scenario,
      `/session/${response.sessionId}/element/${this._elementId}/rect`,
      {
        method: "get",
      }
    );

    if (res.jsonRoot.value.error) return null;

    const bounds: iBounds = {
      x: res.jsonRoot.value.x,
      y: res.jsonRoot.value.y,
      height: res.jsonRoot.value.height,
      width: res.jsonRoot.value.width,
      points: [
        {
          x: res.jsonRoot.value.x,
          y: res.jsonRoot.value.y,
        },
        {
          x: res.jsonRoot.value.x + res.jsonRoot.value.width / 2,
          y: res.jsonRoot.value.y + res.jsonRoot.value.height / 2,
        },
        {
          x: res.jsonRoot.value.x + res.jsonRoot.value.width,
          y: res.jsonRoot.value.y + res.jsonRoot.value.height,
        },
      ],
    };

    return bounds;
  }

  public async longPress(ms: number = 1000): Promise<string | void> {
    const boundsRes = await this.getBounds();
    if (!boundsRes) return "Error: element bounds not acquired";
    await this.context.response.touchMove([
      boundsRes.points[1].x,
      boundsRes.points[1].y,
      ms,
    ]);
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
