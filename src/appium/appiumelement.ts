import {
  iValue,
  iAssertionContext,
  iBounds,
  PointerMove,
  GestureOpts,
  GestureType,
  PointerPoint,
  TapType,
} from "../interfaces";
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
      left: res.jsonRoot.value.x,
      right: res.jsonRoot.value.x + res.jsonRoot.value.width,
      top: res.jsonRoot.value.y,
      bottom: res.jsonRoot.value.y + res.jsonRoot.value.height,
      middle: {
        x: res.jsonRoot.value.x + res.jsonRoot.value.width / 2,
        y: res.jsonRoot.value.y + res.jsonRoot.value.height / 2,
      },
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

  public async gesture(type: GestureType, opts: GestureOpts): Promise<iValue> {
    // Get bounds
    const bounds = await this.getBounds();
    if (!bounds) throw "Error: element bounds not acquired";
    // Defaults
    if (!opts.amount) {
      opts.amount = [bounds.width / 2, bounds.height / 2];
    }
    // Start position
    const start: { pointer1: PointerPoint; pointer2: PointerPoint } = {
      pointer1:
        type == "stretch"
          ? [bounds.middle.x - 10, bounds.middle.y - 10]
          : [bounds.left, bounds.top],
      pointer2:
        type == "stretch"
          ? [bounds.middle.x + 10, bounds.middle.y + 10]
          : [bounds.right, bounds.bottom],
    };
    // End position
    const end: { pointer1: PointerPoint; pointer2: PointerPoint } = {
      pointer1:
        type == "stretch"
          ? [
              start.pointer1[0] - opts.amount[0],
              start.pointer1[1] - opts.amount[1],
            ]
          : [
              start.pointer1[0] + opts.amount[0],
              start.pointer1[1] + opts.amount[1],
            ],
      pointer2:
        type == "stretch"
          ? [
              start.pointer2[0] + opts.amount[0],
              start.pointer2[1] + opts.amount[1],
            ]
          : [
              start.pointer2[0] - opts.amount[0],
              start.pointer2[1] - opts.amount[1],
            ],
    };
    await this.session.movePointer(
      {
        type: "touch",
        duration: opts.duration || 500,
        start: start.pointer1,
        end: end.pointer1,
      },
      {
        type: "touch",
        duration: opts.duration || 500,
        start: start.pointer2,
        end: end.pointer2,
      }
    );
    return this;
  }

  public async tap(
    duration: number = 500,
    tapType: TapType = "single"
  ): Promise<iValue> {
    const bounds = await this.getBounds();
    if (!bounds) throw "Error: element bounds not acquired";

    if (tapType === "double") {
      await this.session.movePointer({
        type: "touch",
        duration: 200,
        start: [bounds.middle.x, bounds.middle.y],
      });

      await this.context.pause(duration);

      await this.session.movePointer({
        type: "touch",
        duration: 200,
        start: [bounds.middle.x, bounds.middle.y],
      });

      return this;
    }

    await this.session.movePointer({
      type: "touch",
      duration: duration,
      start: [bounds.middle.x, bounds.middle.y],
    });

    return this;
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
