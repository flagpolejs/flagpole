import { iValue, iAssertionContext, iBounds } from "../interfaces";
import { DOMElement } from "../html/domelement";
import { ValuePromise } from "../value-promise";
import { JsonDoc } from "../json/jpath";
import { AppiumResponse } from "./appiumresponse";

export class AppiumElement extends DOMElement implements iValue {
  protected _elementId: string;
  protected _response: JsonDoc | undefined;

  protected get session(): AppiumResponse {
    return this.context.response as AppiumResponse;
  }

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
    await this.session.post(`element/${this._elementId}/click`, {});
    return this;
  }

  public find(selector: string): ValuePromise {
    throw "find not implemented";
  }

  public async findAll(selector: string): Promise<iValue[]> {
    throw "findAll not implemented";
  }

  public async type(input: string): Promise<iValue> {
    const res = await this.session.post(`element/${this._elementId}/value`, {
      text: input,
    });
    if (res.jsonRoot.value?.error) {
      throw "Element cannot be typed into. Did you choose the correct element?";
    }
    return this;
  }

  public async clear(): Promise<iValue> {
    await this.session.post(`element/${this._elementId}/clear`, {});
    return this;
  }

  public async clearThenType(input: string): Promise<iValue> {
    await this.clear();
    await this.type(input);
    return this;
  }

  public async isVisible(): Promise<boolean> {
    const res = await this.session.get(`element/${this._elementId}/displayed`);
    return !!res.jsonRoot.value;
  }

  public async getBounds(): Promise<iBounds | null> {
    const res = await this.session.get(`element/${this._elementId}/rect`);

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

  public async zoom(
    tuple: [x: number, y: number, duration?: number]
  ): Promise<string | void> {
    const boundsRes = await this.getBounds();
    if (!boundsRes) throw "Error: element bounds not acquired";
    await this.session.touchMove(
      [
        [boundsRes.points[1].x - 10, boundsRes.points[1].y - 10],
        [tuple[0], tuple[1], tuple[2] || 500],
      ],
      [
        [boundsRes.points[1].x + 10, boundsRes.points[1].y + 10],
        [tuple[0] * -1, tuple[1] * -1, tuple[2] || 500],
      ]
    );
  }

  public async pinch(
    tuple: [x: number, y: number, duration?: number]
  ): Promise<string | void> {
    const boundsRes = await this.getBounds();
    if (!boundsRes) throw "Error: element bounds not acquired";
    await this.session.touchMove(
      [
        [boundsRes.points[1].x - tuple[0], boundsRes.points[1].y - tuple[1]],
        [tuple[0] - 10, tuple[1] - 10, tuple[2] || 500],
      ],
      [
        [boundsRes.points[1].x + tuple[0], boundsRes.points[1].y + tuple[1]],
        [tuple[0] * -1 + 10, tuple[1] * -1 + 10, tuple[2] || 500],
      ]
    );
  }

  protected async _getValue(): Promise<any> {
    throw "_getValue not implemented";
  }

  protected async _getText(): Promise<string> {
    return this.session.get(`element/${this._elementId}/text`);
  }

  protected async _getTagName(): Promise<string> {
    const res = await this.session.get(`element/${this._elementId}/name`);
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
    return this.session.get(`element/${this._elementId}/attribute/${key}`);
  }

  public toString(): string {
    return this._elementId;
  }
}
