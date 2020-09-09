import { ExtJsComponent } from "./extjscomponent";
import { ResponseType } from "../enums";
import {
  iResponse,
  iScenario,
  FindOptions,
  FindAllOptions,
  iValue,
} from "../interfaces";
import { PuppeteerResponse } from "./puppeteerresponse";
import { PuppeteerElement } from "./puppeteerelement";
import { asyncForEach, asyncMap } from "../util";
import {
  filterFind,
  getFindParams,
  wrapAsValue,
  findOne,
  getFindName,
  FindParams,
} from "../helpers";
import { ElementHandle, JSHandle, EvaluateFn } from "puppeteer-core";
import { BrowserElement } from "./browserelement";
import { query, jsHandleArrayToHandles } from "./ext.helper";

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

  public async findXPath(xPath: string): Promise<iValue> {
    if (!this.page) {
      throw "Page must be defined.";
    }
    const elements = await this.page.$x(xPath);
    if (elements.length > 0) {
      return await ExtJsComponent.create(
        elements[0],
        this.context,
        xPath,
        xPath
      );
    }
    return wrapAsValue(this.context, null, xPath);
  }

  public async findAllXPath(xPath: string): Promise<iValue[]> {
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
  ): Promise<iValue> {
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
        component.focus();
        component.setValue("");
        component.blur();
      } else {
        throw new Error(`Could not find component at ${selector}`);
      }
    }
    throw new Error(`Can not type into this element ${selector}`);
  }

  public async getComponentById(id: string) {
    const ref = await this._page.evaluateHandle(`Ext.getCmp(${id}")`);
    return ref
      ? await ExtJsComponent.create(ref, this.context, `#${id}`, `#${id}`)
      : null;
  }

  protected async _getComponent(
    js: EvaluateFn<any>,
    name: string,
    path: string
  ) {
    const ref = await this._page.evaluateHandle(js);
    return ref
      ? await ExtJsComponent.create(ref, this.context, name, path)
      : wrapAsValue(this.context, null, name, path);
  }

  private async _injectScript(content: string): Promise<void> {
    if (this.page === null) {
      throw "Page must be defined.";
    }
    return this.page.addScriptTag({
      content: content,
    });
  }

  /**
   * Use Puppeteer to find the first matching element
   *
   * @param path
   */
  public async find(
    selector: string,
    a?: string | RegExp | FindOptions,
    b?: FindOptions
  ): Promise<iValue> {
    const params = getFindParams(a, b);
    if (params.opts || params.matches || params.contains) {
      return findOne(this, selector, params);
    }
    // First look for ExtJS component query
    const components = await this._query(selector, params);
    if (components.length) {
      return components[0];
    }
    // Do regular query in page
    const el = await this._page.$(selector);
    if (el !== null) {
      const component = await this._getComponentOrElementFromHandle(
        el,
        selector,
        selector
      );
      if (component) {
        return component;
      }
    }
    return wrapAsValue(this.context, null, selector);
  }

  /**
   * Use Puppeteer to find all matching elements
   *
   * @param path
   */
  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<iValue[]> {
    const params = getFindParams(a, b);
    const components: iValue[] = await (async () => {
      // First, use ExtJS.ComponentQuery.query
      const components = await this._query(selector, params);
      if (components.length) {
        return components;
      }
      // If we didn't find any, then use the DOM query
      const elements = await this._page.$$(selector);
      return asyncMap<iValue>(
        elements,
        async (el: ElementHandle<Element>, i) => {
          return await this._getComponentOrElementFromHandle(
            el,
            getFindName(params, selector, i),
            `${selector} [${i}]`
          );
        }
      );
    })();
    return filterFind(
      components,
      params.contains || params.matches,
      params.opts
    );
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

  private async _getComponentOrElementFromHandle(
    el: ElementHandle<Element>,
    path: string,
    name: string
  ) {
    const isComponent = !!(await (
      await el.getProperty("data-componentid")
    ).jsonValue());
    return isComponent
      ? this._getComponentFromElementHandle(el)
      : BrowserElement.create(el, this.context, name, path);
  }

  private async _getComponentFromElementHandle(el: ElementHandle<Element>) {
    const componentId = await el.evaluate((node) => {
      // If this element is a component
      const id = node.getAttribute("data-componentid");
      if (id) {
        return id;
      }
      // Get closest component
      const closestComponent = node.closest("[data-componentid]");
      if (closestComponent) {
        return closestComponent.getAttribute("data-componentid");
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
  private async _query(
    selector: string,
    params: FindParams
  ): Promise<ExtJsComponent[]> {
    const results = await query(this._page, selector);
    const components = await jsHandleArrayToHandles(results);
    return asyncMap(components, async (component: JSHandle<any>, i) => {
      return await ExtJsComponent.create(
        component,
        this.context,
        getFindName(params, selector, i),
        selector
      );
    });
  }
}
