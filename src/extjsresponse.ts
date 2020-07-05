import { ExtJsComponent } from "./extjscomponent";
import { ResponseType } from "./enums";
import { iResponse, iScenario } from "./interfaces";
import { PuppeteerResponse } from "./puppeteerresponse";
import { iValue } from ".";
import { PuppeteerElement } from "./puppeteerelement";
import { asyncForEach } from "./util";
import { ElementHandle } from "puppeteer";

export class ExtJSResponse extends PuppeteerResponse implements iResponse {
  public get responseTypeName(): string {
    return "ExtJS";
  }

  public get responseType(): ResponseType {
    return "extjs";
  }

  constructor(scenario: iScenario) {
    super(scenario);
    // Before this scenario starts to run
    scenario.before(() => {
      scenario.nextPrepend(async (context) => {
        if (context.page !== null) {
          await context.page.waitForFunction("!!window.Ext");
          await context.page.waitForFunction("!!window.Ext.ComponentQuery");
          await this._injectScript(`
            componentQuery = (ref, path) => {
              window[ref] = Ext.ComponentQuery.query(path)[0];
              return !!window[ref];
            };
            componentQueryAll = (ref, path) => {
              window[ref] = Ext.ComponentQuery.query(path);
              return !!window[ref];
            };
            componentQueryCount = (ref, path) => {
              window[ref] = Ext.ComponentQuery.query(path);
              return window[ref].length;
            };
            componentGetById = (ref, id) => {
              window[ref] = Ext.getCmp(id);
              return !!window[ref];
            };
          `);
        }
      });
    });
  }

  /**
   * Select the first matching element
   *
   * @param path
   * @param findIn
   */
  public async find(path: string): Promise<iValue> {
    const results = await this._query(path);
    return results.length > 0 ? results[0] : this._find(path);
  }

  public async findAll(path: string): Promise<iValue[]> {
    const results = await this._query(path);
    return results.length > 0 ? results : this._findAll(path);
  }

  public async findXPath(xPath: string): Promise<iValue> {
    if (!this.page) {
      throw "Page must be defined.";
    }
    const elements = await this.page.$x(xPath);
    if (elements.length > 0) {
      return await PuppeteerElement.create(
        elements[0],
        this.context,
        null,
        xPath
      );
    }
    return this._wrapAsValue(null, xPath);
  }

  public async findAllXPath(xPath: string): Promise<PuppeteerElement[]> {
    if (!this.page) {
      throw "Page must be defined.";
    }
    const response: iResponse = this;
    const puppeteerElements: PuppeteerElement[] = [];
    if (this.context.page !== null) {
      const elements = await this.context.page.$x(xPath);
      await asyncForEach(elements, async (el, i) => {
        const element = await PuppeteerElement.create(
          el,
          response.context,
          `${xPath} [${i}]`,
          xPath
        );
        puppeteerElements.push(element);
      });
    }
    return puppeteerElements;
  }

  public async waitForExists(
    path: string,
    timeout: number = 5000
  ): Promise<PuppeteerElement> {
    if (this.page === null) {
      throw "Could not find browser page object.";
    }
    const ref = this._createReferenceName(path);
    await this.page.waitForFunction(`componentQuery("${ref}", "${path}")`, {
      timeout: timeout,
    });
    return await ExtJsComponent.create(ref, this.context, `${ref}[0]`);
  }

  public async type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): Promise<any> {
    if (this.page !== null) {
      const component: ExtJsComponent | iValue = await this.find(selector);
      if (component instanceof ExtJsComponent) {
        return component.type(textToType, opts);
      } else {
        throw new Error(`Could not find component at ${selector}`);
      }
    }
    throw new Error(`Can not type into element ${selector}`);
  }

  public async clear(selector: string): Promise<any> {
    if (this.page !== null) {
      const component: ExtJsComponent | iValue = await this.find(selector);
      if (component instanceof ExtJsComponent) {
        component.fireEvent("focus");
        component.setValue("");
        component.fireEvent("blur");
      } else {
        throw new Error(`Could not find component at ${selector}`);
      }
    }
    throw new Error(`Can not type into this element ${selector}`);
  }

  public async getComponentById(id: string) {
    if (this.page === null) {
      throw "Page must exist.";
    }
    const ref = this._createReferenceName(id);
    const path = `#${id}`;
    const exists = Boolean(
      await this.page.evaluate(`componentGetById("${ref}", "${id}")`)
    );
    return exists
      ? await ExtJsComponent.create(path, this.context, path)
      : null;
  }

  private async _injectScript(content: string): Promise<void> {
    if (this.page !== null) {
      await this.page.addScriptTag({
        content: content,
      });
    }
  }

  private _createReferenceName(name: string): string {
    return `flagpole_${Date.now()}_${name.replace(/[^a-z]/gi, "")}`;
  }

  /**
   * Use Puppeteer to find the first matching element
   *
   * @param path
   */
  private async _find(path: string): Promise<iValue> {
    if (this.page === null) {
      throw "Page must exist.";
    }
    const el = await this.page.$(path);
    if (el !== null) {
      const component = await this._getComponentOrElementFromHandle(
        el,
        path,
        path
      );
      if (component) {
        return component;
      }
    }
    return this._wrapAsValue(null, path);
  }

  /**
   * Use Puppeteer to find all matching elements
   *
   * @param path
   */
  private async _findAll(path: string): Promise<iValue[]> {
    if (this.context.page === null) {
      throw "Page must be defined.";
    }
    const components: iValue[] = [];
    const elements = await this.context.page.$$(path);
    await asyncForEach(elements, async (el: ElementHandle<Element>, i) => {
      const component = await this._getComponentOrElementFromHandle(
        el,
        path,
        `${path} [${i}]`
      );
      if (component) {
        components.push(component);
      }
    });
    return components;
  }

  private async _getComponentOrElementFromHandle(
    el: ElementHandle<Element>,
    path: string,
    name: string
  ) {
    const classes = String(
      (await el.getProperty("className")).jsonValue()
    ).split(" ");
    if (classes.includes("x-component")) {
      return this._getComponentFromElementHandle(el);
    } else {
      return PuppeteerElement.create(el, this.context, name, path);
    }
  }

  private async _getComponentFromElementHandle(el: ElementHandle<Element>) {
    const componentId = await el.evaluate((node) => {
      // If this element is a component
      if (node.classList.contains("x-component")) {
        return node.id;
      }
      // Get closest component
      const closestComponent = node.closest(".x-component");
      if (closestComponent) {
        return closestComponent.id;
      }
      // For some reason we did not find the component
      return null;
    });
    return (componentId && (await this.getComponentById(componentId))) || null;
  }

  /**
   * Use Ext to find the matching elements
   *
   * @param path
   */
  private async _query(path: string) {
    if (this.page === null) {
      throw "Page must exist.";
    }
    const ref = this._createReferenceName(path);
    const length = Number(
      await this.page.evaluate(`componentQueryCount("${ref}", "${path}")`)
    );
    let components: ExtJsComponent[] = [];
    for (let i = 0; i < length; i++) {
      components.push(
        await ExtJsComponent.create(
          `window.${ref}[${i}]`,
          this.context,
          `${path}[${i}]`
        )
      );
    }
    return components;
  }
}
