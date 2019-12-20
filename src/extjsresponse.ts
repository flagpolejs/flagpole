import { ExtJsComponent } from "./extjscomponent";
import { ResponseType } from "./enums";
import { iResponse, iScenario } from "./interfaces";
import { PuppeteerResponse } from "./puppeteerresponse";
import { iValue } from ".";

export class ExtJSResponse extends PuppeteerResponse implements iResponse {
  public get responseTypeName(): string {
    return "ExtJS";
  }

  public get responseType(): ResponseType {
    return ResponseType.extjs;
  }

  constructor(scenario: iScenario) {
    super(scenario);
    // Before this scenario starts to run
    scenario.before(() => {
      scenario.nextPrepend(async context => {
        if (context.page !== null) {
          // Wait for Ext
          const extExists = await context.evaluate(function() {
            return !!window["Ext"];
          });
          context.assert("ExtJS was found.", extExists).equals(true);

          // Wait for Ext ready
          return context
            .assert("Ext.onReady fired", context.waitForReady(15000))
            .resolves();
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
    if (this.page !== null) {
      const componentReference: string = `flagpole_${Date.now()}_${path.replace(
        /[^a-z]/gi,
        ""
      )}`;
      // We need to be sure to encode the String so single and double quotes don't break the query
      path = path.replace(/\'/g, "\\'");
      path = path.replace(/\"/g, '\\"');
      const queryToInject:
        | string
        | undefined = `window.${componentReference} = Ext.ComponentQuery.query("${path}")[0];`;
      await this.page.addScriptTag({ content: queryToInject });
      // Build array of ExtJsComponent elements
      const exists: boolean = !!(await this.page.evaluate(
        `!!window.${componentReference}`
      ));
      if (exists) {
        return await ExtJsComponent.create(
          componentReference,
          this.context,
          `${path}[0]`
        );
      }
      return this._wrapAsValue(null, path);
    }
    throw new Error("Cannot evaluate code becuase page is null.");
  }

  public async findAll(path: string): Promise<ExtJsComponent[]> {
    if (this.page !== null) {
      const componentReference: string = `flagpole_${Date.now()}_${path.replace(
        /[^a-z]/gi,
        ""
      )}`;
      const queryToInject: string = `window.${componentReference} = Ext.ComponentQuery.query("${path}");`;
      await this.page.addScriptTag({ content: queryToInject });
      // Build array of ExtJsComponent elements
      const length: number = Number(
        await this.page.evaluate(`window.${componentReference}.length`)
      );
      let components: ExtJsComponent[] = [];
      for (let i = 0; i < length; i++) {
        components.push(
          await ExtJsComponent.create(
            `window.${componentReference}[${i}]`,
            this.context,
            `${path}[${i}]`
          )
        );
      }
      return components;
    }
    throw new Error("Cannot evaluate code becuase page is null.");
  }

  public async waitForReady(timeout: number = 15000): Promise<void> {
    if (this.page !== null) {
      await this.page.evaluate(
        `Ext.onReady(() => { window.flagpoleExtReady = true; });`
      );
      await this.page.waitForFunction(`window.flagpoleExtReady`, {
        timeout: timeout
      });
      return;
    }
    return super.waitForReady(timeout);
  }

  public async type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): Promise<any> {
    if (this.page !== null) {
      const component: ExtJsComponent | iValue = await this.find(selector);
      if (component instanceof ExtJsComponent) {
        component.fireEvent("focus");
        component.setValue(textToType);
        component.fireEvent("blur");
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
}
