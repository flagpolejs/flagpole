import { promises } from "fs";
import * as Jimp from "jimp";
import { ProtoResponse } from "../response";
import {
  iResponse,
  iValue,
  FindOptions,
  FindAllOptions,
  ScreenshotOpts,
} from "../interfaces";
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

const fs = promises;

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
      const usingValue = selector.split(/\/(.+)/);
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
    const usingValue = selector.split(/\/(.+)/);
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

    const res = await sendAppiumRequest(
      this.scenario,
      `/session/${this.sessionId}/screenshot`,
      {
        method: "get",
      }
    );
    const encodedData = res.jsonRoot.value;
    let buff = Buffer.from(encodedData, "base64");

    if (opts.clip) {
      await Jimp.read(buff)
        .then((image) => {
          image
            .crop(
              opts.clip!.x,
              opts.clip!.y,
              opts.clip!.width,
              opts.clip!.height
            )
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
    }

    if (localFilePath) {
      await fs.writeFile(localFilePath, buff);
    }

    return buff;
  }
}
