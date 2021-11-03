import { iValue, iAssertionContext } from "../interfaces";
import { DOMElement } from "../html/domelement";
import { ValuePromise } from "../value-promise";
import { JsonDoc } from "../json/jpath";
import { sendAppiumRequest } from "./appium-helpers";

export class AppiumElement extends DOMElement implements iValue {
  protected _elementId: string;
  protected _response: JsonDoc | undefined;

  public constructor(
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
    await sendAppiumRequest(
      this.context.scenario,
      `/session/${this.context.scenario.get("sessionId")}/element/${
        this._elementId
      }/click`,
      {
        method: "post",
      }
    );

    return this;
  }

  public find(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const name: string = `${selector} under ${this.name}`;
      const elementId = this._elementId;
      if (elementId) {
        const element = new AppiumElement(
          selector,
          this.context,
          selector,
          elementId
        );
        return element;
      } else {
        return this._wrapAsValue(null, name);
      }
    });
  }

  public async findAll(selector: string): Promise<iValue[]> {
    throw "findAll not implemented";
  }

  public async type(input: string): Promise<void> {
    await sendAppiumRequest(
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
  }

  public async clear(): Promise<void> {
    await sendAppiumRequest(
      this.context.scenario,
      `/session/${this.context.scenario.get("sessionId")}/element/${
        this._elementId
      }/clear`,
      {
        method: "post",
      }
    );
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
    throw "_getTagName not implemented";
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
    throw "_getAttribute not implemented";
  }

  public toString(): string {
    return this._elementId;
  }
}
