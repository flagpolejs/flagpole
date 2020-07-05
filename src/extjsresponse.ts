import { ExtJsComponent } from "./extjscomponent";
import { ResponseType } from "./enums";
import { iResponse, iScenario } from "./interfaces";
import { PuppeteerResponse } from "./puppeteerresponse";
import { iValue } from ".";
import { PuppeteerElement } from "./puppeteerelement";

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
  public async find(path: string): Promise<ExtJsComponent | iValue> {
    const result = await this._query(path);
    return result.length > 0 ? result[0] : this._wrapAsValue(null, path);
  }

  public async findAll(path: string): Promise<ExtJsComponent[]> {
    return this._query(path);
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
