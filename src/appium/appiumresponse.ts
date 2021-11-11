import { ProtoResponse } from "../response";
import { iResponse, iValue, FindOptions, FindAllOptions } from "../interfaces";
import { ValuePromise } from "../value-promise";
import { ScenarioType } from "../scenario-types";
import {
  wrapAsValue,
  getFindParams,
  findOne,
  applyOffsetAndLimit,
} from "../helpers";
import { JsonDoc } from "../json/jpath";
import { sendAppiumRequest, appiumFindByUiAutomator } from "./appium-helpers";
import { AppiumElement } from "./appiumelement";
import { toType } from "../util";

export class AppiumResponse extends ProtoResponse implements iResponse {
  public jsonDoc: JsonDoc | undefined;

  public get responseTypeName(): string {
    return "Appium";
  }

  public get responseType(): ScenarioType {
    return "appium";
  }

  public getRoot(): any {
    return this.jsonBody.$;
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not support eval.";
  }

  public get sessionId(): string {
    return this.scenario.get("sessionId");
  }

  public get capabilities(): any {
    return this.scenario.get("capabilities");
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
      const usingValue = selector.split("/");
      const res = await sendAppiumRequest(
        this.scenario,
        `/session/${this.sessionId}/element`,
        {
          method: "post",
          data: {
            using: usingValue[0],
            value: usingValue[1],
          },
        }
      );
      if (res.jsonRoot.value.ELEMENT) {
        const element = await AppiumElement.create(
          selector,
          this.context,
          selector,
          res.jsonRoot.value.ELEMENT
        );
        return element;
      } else {
        return wrapAsValue(this.context, null, selector);
      }
    });
  }

  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<iValue[]> {
    const usingValue = selector.split("/");
    let elements: iValue[] = [];
    const params = getFindParams(a, b);
    let res: JsonDoc = new JsonDoc({});
    if (params.matches) {
      throw "Appium does not support finding elements by RegEx";
    } else if (params.contains) {
      if (
        this.capabilities.automationName.toLowerCase() === "uiautomator2" ||
        this.capabilities.automationName.toLowerCase() === "espresso"
      ) {
        const values = await appiumFindByUiAutomator(
          this,
          selector,
          params.contains,
          params.opts
        );
        for (let i = 0; i < values?.length; i++) {
          const element = await AppiumElement.create(
            selector,
            this.context,
            selector,
            values[i].$
          );
          elements.push(element);
          return elements;
        }
      } else if (
        this.capabilities.automationName.toLowerCase() === "xcuitest"
      ) {
        res = await sendAppiumRequest(
          this.scenario,
          `/session/${this.sessionId}/elements`,
          {
            method: "post",
            data: {
              using: "-ios predicate string",
              value: `label == "${params.contains}"`,
            },
          }
        );
      }
    } else {
      res = await sendAppiumRequest(
        this.scenario,
        `/session/${this.sessionId}/elements`,
        {
          method: "post",
          data: {
            using: usingValue[0],
            value: usingValue[1],
          },
        }
      );
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

  public async hideKeyboard(): Promise<void> {
    await sendAppiumRequest(
      this.scenario,
      `/session/${this.sessionId}/appium/device/hide_keyboard`,
      {
        method: "post",
      }
    );
  }

  public async touchMove(
    array: [x: number, y: number, duration?: number],
    ...otherArrays: [x: number, y: number, duration?: number][]
  ): Promise<void> {
    const touchActions = [
      {
        type: "pointerMove",
        duration: 0,
        x: array[0],
        y: array[1],
        relative: false,
      },
      {
        type: "pointerDown",
        button: 0,
      },
      {
        type: "pause",
        duration: array[2] || 0,
      },
    ];

    if (otherArrays.length) {
      otherArrays.forEach((array) => {
        touchActions.push({
          type: "pointerMove",
          duration: array![2] || 500,
          x: array![0],
          y: array![1],
          relative: true,
        });
      });
    }

    touchActions.push({
      type: "pointerUp",
      button: 0,
    });

    const toSend = {
      actions: [
        {
          type: "pointer",
          id: "0",
          parameters: {
            pointerType: "touch",
          },
          actions: touchActions,
        },
      ],
    };

    await sendAppiumRequest(
      this.scenario,
      `/session/${this.sessionId}/actions`,
      {
        method: "post",
        data: toSend,
      }
    );
  }

  public async setImplicitWait(ms: number): Promise<void> {
    await sendAppiumRequest(
      this.scenario,
      `/session/${this.sessionId}/timeouts/implicit_wait`,
      {
        method: "post",
        data: {
          ms: ms,
        },
      }
    );
  }

  public async getTimeout(): Promise<number> {
    const res = await sendAppiumRequest(
      this.scenario,
      `/session/${this.sessionId}/timeouts`,
      {
        method: "get",
      }
    );
    return res.jsonRoot.value.implicit;
  }

  public async waitForExists(
    selector: string,
    timeout?: number
  ): Promise<iValue>;
  public async waitForExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): Promise<iValue>;
  public async waitForExists(
    selector: string,
    a?: number | string | RegExp,
    b?: number
  ): Promise<iValue> {
    const previousTime = await this.getTimeout();
    if (typeof a === "number") {
      await this.setImplicitWait(a);
      const element = await this.find(selector);
      await this.setImplicitWait(previousTime);
      return element;
    } else if (typeof a === "string") {
      await this.setImplicitWait(b || 30000);
      const element = await this.find(selector, a);
      await this.setImplicitWait(previousTime);
      return element;
    } else if (toType(a) === "regexp") {
      await this.setImplicitWait(previousTime);
      throw "Appium does not support finding element by RegEx";
    } else {
      await this.setImplicitWait(30000);
      const element = await this.find(selector);
      await this.setImplicitWait(previousTime);
      return element;
    }
  }
}
