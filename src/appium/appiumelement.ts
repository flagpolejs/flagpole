import {
  iValue,
  iAssertionContext,
  FindOptions,
  FindAllOptions,
  iBounds,
  ScreenshotOpts,
} from "../interfaces";
import { promises } from "fs";
import * as Jimp from "jimp";
import { DOMElement } from "../html/domelement";
import { ValuePromise } from "../value-promise";
import { JsonDoc } from "../json/jpath";
import { AppiumResponse } from "./appiumresponse";
import {
  getFindParams,
  findOne,
  wrapAsValue,
  applyOffsetAndLimit,
} from "../helpers";
import { appiumFindByUiAutomator } from "./appium-helpers";

const fs = promises;

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

  public find(
    selector: string,
    a?: string | RegExp | FindOptions,
    b?: FindOptions
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const params = getFindParams(a, b);
      if (params.matches) {
        throw "Appium does not support finding element by RegEx";
      } else if (params.contains || params.opts) {
        return findOne(this, selector, params);
      }
      const usingValue = selector.split(/\/(.+)/);
      const res = await this.session.post(
        `element/${this._elementId}/element`,
        {
          using: usingValue[0],
          value: usingValue[1],
        }
      );
      if (res.jsonRoot.value.ELEMENT) {
        const element = await AppiumElement.create(
          selector,
          this.session.context,
          selector,
          res.jsonRoot.value.ELEMENT
        );
        return element;
      } else {
        return wrapAsValue(this.session.context, null, selector);
      }
    });
  }

  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<iValue[]> {
    const usingValue = selector.split(/\/(.+)/);
    let elements: iValue[] = [];
    const params = getFindParams(a, b);
    let res: JsonDoc = new JsonDoc({});
    if (params.matches) {
      throw "Appium does not support finding elements by RegEx";
    } else if (params.contains) {
      if (
        this.session.capabilities.automationName.toLowerCase() ===
        "uiautomator2"
      ) {
        const values = await appiumFindByUiAutomator(
          this.session,
          selector,
          params.contains,
          params.opts,
          this._elementId
        );
        for (let i = 0; i < values?.length; i++) {
          const element = await AppiumElement.create(
            selector,
            this.session.context,
            selector,
            values[i].$
          );
          elements.push(element);
        }
        return elements;
      } else if (
        this.session.capabilities.automationName.toLowerCase() === "espresso"
      ) {
        res = await this.session.post(`element/${this._elementId}/elements`, {
          using: "text",
          value: params.contains,
        });
      } else if (
        this.session.capabilities.automationName.toLowerCase() === "xcuitest"
      ) {
        res = await this.session.post(`element/${this._elementId}/elements`, {
          using: "-ios predicate string",
          value: `label == "${params.contains}"`,
        });
      }
    } else {
      res = await this.session.post(`element/${this._elementId}/elements`, {
        using: usingValue[0],
        value: usingValue[1],
      });
    }
    for (let i = 0; i < res.jsonRoot.value?.length; i++) {
      elements.push(
        await AppiumElement.create(
          selector,
          this.context,
          selector,
          res.jsonRoot.value[i].ELEMENT
        )
      );
    }
    if (params.opts) {
      elements = applyOffsetAndLimit(params.opts, elements);
    }

    return elements;
  }

  protected;

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

  public async doubleTap(ms: number = 10): Promise<void> {
    const boundsRes = await this.getBounds();
    if (!boundsRes) throw "Error: element bounds not acquired";
    await this.context.response.touchMove([
      boundsRes.points[1].x,
      boundsRes.points[1].y,
      ms,
    ]);
    await this.context.pause(ms);
    await this.context.response.touchMove([
      boundsRes.points[1].x,
      boundsRes.points[1].y,
      ms,
    ]);
  }
  
  public async longPress(ms: number = 1000): Promise<void> {
    const boundsRes = await this.getBounds();
    if (!boundsRes) throw "Error: element bounds not acquired";
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
    return this.session.get(`element/${this._elementId}/text`);
  }

  protected async _getTagName(): Promise<string> {
    const res = await this.session.get(`element/${this._elementId}/name`);
    return res.jsonRoot.value || null;
  }

  protected async _getProperty(property: string): Promise<string> {
    const res = await this.session.get(
      `element/${this._elementId}/css/${property}`
    );

    return res.jsonRoot.value || null;
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

  public async screenshot(): Promise<Buffer>;
  public async screenshot(localFilePath: string): Promise<Buffer>;
  public async screenshot(
    localFilePath: string,
    opts: ScreenshotOpts
  ): Promise<Buffer>;
  public async screenshot(opts: ScreenshotOpts): Promise<Buffer>;
  public async screenshot(
    a?: string | ScreenshotOpts,
    b?: ScreenshotOpts
  ): Promise<Buffer> {
    const opts: ScreenshotOpts = (typeof a !== "string" ? a : b) || {};
    let localFilePath = typeof a == "string" ? a : undefined;
    if (!localFilePath && opts.path) {
      localFilePath = opts.path;
    }

    const bounds = await this.getBounds();

    const res = await this.session.get("screenshot");

    const encodedData = res.jsonRoot.value;
    let buff = Buffer.from(encodedData, "base64");

    let x: number = bounds!.x;
    let y: number = bounds!.y;
    let width: number = bounds!.width;
    let height: number = bounds!.height;
    if (opts.clip) {
      x = opts.clip.x + bounds!.x;
      y = opts.clip.y + bounds!.y;
      width = opts.clip.width;
      height = opts.clip.height;
    }

    await Jimp.read(buff)
      .then((image) => {
        image
          .crop(x, y, width, height)
          .quality(100)
          .getBufferAsync(Jimp.MIME_PNG)
          .then((buffer) => {
            buff = buffer;
          })
          .catch((err) => {
            if (err) return err;
          });
      })
      .catch((err) => {
        if (err) return err;
      });

    if (localFilePath) {
      await fs.writeFile(localFilePath, buff);
    }
    return buff;
  }

  public toString(): string {
    return this._elementId;
  }
}
