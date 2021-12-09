import { iValue, iAssertionContext } from "../interfaces";
import { DOMElement } from "../html/domelement";
import { ValuePromise } from "../value-promise";
import { JsonDoc } from "../json/jpath";
import { AppiumResponse } from "./appiumresponse";
import * as parseXml from "@rgrove/parse-xml";

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

  protected async _getAttribute(key?: string): Promise<string | null> {
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

    if (key && !possibleAttributes.includes(key)) {
      throw `Invalid attribute: must be one of ${possibleAttributes.join(
        ", "
      )}`;
    }

    if (!key) {
      const xmlString = await this.session.body;
      const doc = parseXml(xmlString.$);
      const childrenJson = doc.children[0].toJSON();
      const packageName = childrenJson.children[1].attributes.package;
      const elementIdentifier = this.name.startsWith("id")
        ? packageName + ":" + this.name
        : this.name.split(/\/(.+)/)[1];
      const node = this._findVal(doc.children, elementIdentifier);
      console.log(node.attributes);
    }

    return this.session.get(`element/${this._elementId}/attribute/${key}`);
  }

  protected _findVal(obj: any, searchVal: string) {
    for (const node of obj) {
      if (node.attributes) {
        if (
          node.attributes["resource-id"] === searchVal ||
          node.attributes["content-desc"] === searchVal
        )
          return node;
      }
      if (node.children) {
        const child = this._findVal(node.children, searchVal);
        if (child) return child;
      }
    }
  }

  public toString(): string {
    return this._elementId;
  }
}
