import { ExtJsComponent } from "./extjscomponent";
import { ResponseType } from "./enums";
import { iResponse, iScenario } from "./interfaces";
import { PuppeteerResponse } from "./puppeteerresponse";
import { iValue } from ".";
import { PuppeteerElement } from "./puppeteerelement";
import { asyncForEach } from "./util";
import { ElementHandle } from "puppeteer";
import { BrowserElement } from "./browserelement";

declare type globalThis = {
  Ext: any;
};

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
        if (context.page === null) {
          context.logFailure("Browser page not found");
          return;
        }
        await context.page.waitForFunction(
          // @ts-ignore
          () => !!Ext && !!Ext.ComponentQuery
        );
        await this._injectScript(`
          isExtReady = false;
          Ext.onReady(() => {
            isExtReady = true;
          });
        `);
        await context.page.waitForFunction("isExtReady");
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
      return await ExtJsComponent.create(elements[0], this.context, xPath);
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
        const element = await ExtJsComponent.create(
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
    const ref = await this.page.waitForFunction(
      `Ext.ComponentQuery.query("${path}")`,
      {
        timeout: timeout,
      }
    );
    return await ExtJsComponent.create(ref, this.context, `${path}[0]`, path);
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
    const ref = await this.page.evaluateHandle(`Ext.getCmp(${id}")`);
    return ref
      ? await ExtJsComponent.create(ref, this.context, `#${id}`)
      : null;
  }

  private async _injectScript(content: string): Promise<void> {
    if (this.page === null) {
      throw "Page must be defined.";
    }
    return this.page.addScriptTag({
      content: content,
    });
  }

  private _createReferenceName2(name: string): string {
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
      return BrowserElement.create(el, this.context, name, path);
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
    const results = await this.page.evaluateHandle(
      // @ts-ignore
      (path) => Ext.ComponentQuery.query(path),
      path
    );
    const length = await results.evaluate((r) => r.length);
    const components: ExtJsComponent[] = [];
    for (let i = 0; i < length; i++) {
      const item = await results.evaluateHandle((r, i) => r[i], i);
      const component = await ExtJsComponent.create(
        item,
        this.context,
        `${path}[${i}]`
      );
      components.push(component);
    }
    return components;
  }

  public async selectOption(
    selector: string,
    value: string | string[]
  ): Promise<void> {
    const component = await this.find(selector);
    if (!component.isNull()) {
      component.selectOption(value);
    }
  }
}
