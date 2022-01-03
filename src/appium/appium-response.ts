import { promises } from "fs";
import * as Jimp from "jimp";
import { ProtoResponse } from "../response";
import { HttpResponse } from "../http-response";
import { iResponse, iValue } from "../interfaces/general";
import { ValuePromise } from "../value-promise";
import { ScenarioType } from "../scenario-types";
import {
  wrapAsValue,
  getFindParams,
  findOne,
  applyOffsetAndLimit,
} from "../helpers";
import { JsonDoc } from "../json/jpath";
import { delay } from "../helpers";
import {
  sendAppiumRequest,
  appiumFindByUiAutomator,
  setDevProperties,
  sendAdbCommand,
  sendSiriCommand,
  getSiriEffect,
  appiumSessionDestroy,
} from "./appium-helpers";
import { AppiumElement } from "./appium-element";
import { toType } from "../util";
import { _ } from "ajv";
import { PointerMove, PointerPoint, PointerType } from "../interfaces/pointer";
import { FindAllOptions, FindOptions } from "../interfaces/find-options";
import { GestureOpts, GestureType } from "../interfaces/gesture";
import { ScreenProperties } from "../interfaces/screen-properties";
import { DeviceProperties } from "../interfaces/device-properties";
import { ScreenshotOpts } from "../interfaces/screenshot";

interface AppiumPointerAction {
  type: "pointer";
  id: string;
  parameters: {
    pointerType: PointerType;
  };
  actions: {
    type: "pause" | "pointerMove" | "pointerUp" | "pointerDown";
    duration?: number;
    x?: number;
    y?: number;
    origin?: "viewport" | "pointer";
    button?: number;
  }[];
}
const fs = promises;

export class AppiumResponse extends ProtoResponse implements iResponse {
  protected _sessionId?: string;
  protected _geolocation?: any;
  protected _capabilities?: any;

  public init(res: HttpResponse) {
    super.init(res);
    this._sessionId = res.json.value.sessionId;
    this._capabilities = res.json.value.capabilities;
    this.scenario.nextPrepend(async () => {
      await this.setDeviceProperties(
        this.scenario.opts.data.devProperties || {}
      );
    });
    this.scenario.after(async (scenario) => {
      await appiumSessionDestroy(scenario, String(this._sessionId));
    });
  }

  public get isAndroid(): boolean {
    return (
      this.capabilities?.automationName?.toLowerCase() === "uiautomator2" ||
      this.capabilities?.automationName?.toLowerCase() === "espresso"
    );
  }

  public get isIos(): boolean {
    return this.capabilities?.automationName?.toLowerCase() === "xcuitest";
  }

  public jsonDoc?: JsonDoc;

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
    return this._sessionId || "";
  }

  public set sessionId(sessionId) {
    this._sessionId = sessionId;
  }

  public get capabilities(): any {
    return this._capabilities;
  }

  public async getGeolocation(): Promise<any> {
    if (this._geolocation) {
      return this._geolocation;
    } else {
      const res = await this.get("location");
      this._geolocation = res.jsonRoot.value;
      return this._geolocation;
    }
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
      const res = await this.post("element", {
        using: usingValue[0],
        value: usingValue[1],
      });
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
      if (this.capabilities.automationName.toLowerCase() === "uiautomator2") {
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
        }
        return elements;
      } else if (
        this.capabilities.automationName.toLowerCase() === "espresso"
      ) {
        res = await this.post("elements", {
          using: "text",
          value: params.contains,
        });
      } else if (this.isIos) {
        res = await this.post("elements", {
          using: "-ios predicate string",
          value: `label == "${params.contains}"`,
        });
      }
    } else {
      res = await this.post("elements", {
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

  public async hideKeyboard(): Promise<void> {
    await this.post("appium/device/hide_keyboard", {});
  }

  public async movePointer(...pointers: PointerMove[]): Promise<iResponse> {
    if (!pointers.length) return this;
    const actions: AppiumPointerAction[] = [];
    pointers.forEach((pointer, i) => {
      // Default values
      if (!pointer.end) pointer.end = pointer.start;
      if (!pointer.type || pointer.type == "default") pointer.type = "touch";
      if (!pointer.duration) pointer.duration = 500;
      if (!pointer.disposition) {
        pointer.disposition = {
          start: "down",
          end: "up",
        };
      }
      // Add this pointer to output
      actions.push({
        type: "pointer",
        id: `pointer_${i}`,
        parameters: {
          pointerType: pointer.type,
        },
        actions: [
          {
            type: "pointerMove",
            duration: 0,
            x: pointer.start[0],
            y: pointer.start[1],
            origin: "viewport",
          },
          {
            type:
              pointer.disposition.start == "up" ? "pointerUp" : "pointerDown",
            button: 0,
          },
          {
            type: "pointerMove",
            duration: pointer.duration,
            x: pointer.end[0],
            y: pointer.end[1],
            origin: "viewport",
          },
          {
            type: "pause",
            duration: 10,
          },
          {
            type:
              pointer.disposition.end == "down" ? "pointerDown" : "pointerUp",
            button: 0,
          },
        ],
      });
    });
    await this.post("actions", {
      actions,
    });
    return this;
  }

  public async gesture(
    type: GestureType,
    opts: GestureOpts
  ): Promise<iResponse> {
    // Must specify amount when not gesturing on a specific element
    if (!opts.amount) {
      throw "Error: must specify amount of pixels to gesture";
    }
    if (!opts.start) {
      throw "Error: must specify starting coordinates";
    }
    // Start position
    const start: { pointer1: PointerPoint; pointer2: PointerPoint } = {
      pointer1: [opts.start[0] - 10, opts.start[1] - 10],
      pointer2: [opts.start[0] + 10, opts.start[1] + 10],
    };
    // End position
    const end: { pointer1: PointerPoint; pointer2: PointerPoint } = {
      pointer1:
        type == "stretch"
          ? [
              start.pointer1[0] - opts.amount[0],
              start.pointer1[1] - opts.amount[1],
            ]
          : [
              start.pointer1[0] + opts.amount[0],
              start.pointer1[1] + opts.amount[1],
            ],
      pointer2:
        type == "stretch"
          ? [
              start.pointer2[0] + opts.amount[0],
              start.pointer2[1] + opts.amount[1],
            ]
          : [
              start.pointer2[0] - opts.amount[0],
              start.pointer2[1] - opts.amount[1],
            ],
    };
    await this.movePointer(
      {
        type: "touch",
        duration: opts.duration || 500,
        start: start.pointer1,
        end: end.pointer1,
      },
      {
        type: "touch",
        duration: opts.duration || 500,
        start: start.pointer2,
        end: end.pointer2,
      }
    );

    return this.context.response;
  }

  public async rotateScreen(
    rotation: string | number
  ): Promise<string | number> {
    if (typeof rotation === "number") {
      throw "Appium only supports rotating by a string.";
    } else if (
      rotation.toLowerCase() !== "portrait" &&
      rotation.toLowerCase() !== "landscape"
    ) {
      throw "Appium rotation must be either PORTRAIT or LANDSCAPE.";
    }

    const res = await this.post("orientation", {
      orientation: rotation,
    });

    return res.jsonRoot.value;
  }

  public async getScreenProperties(): Promise<ScreenProperties> {
    const rotationRes = await this.get("orientation");
    const dimensionsRes = await this.get("window/current/size");
    const rotation: string = rotationRes.jsonRoot.value;
    return {
      angle: rotation,
      dimensions: {
        height: dimensionsRes.jsonRoot.value.height,
        width: dimensionsRes.jsonRoot.value.width,
      },
      orientation: rotation,
    };
  }

  public waitForExists(selector: string, timeout?: number): ValuePromise;
  public waitForExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): ValuePromise;
  public waitForExists(
    selector: string,
    a?: number | string | RegExp,
    b?: number
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const timeout =
        typeof a === "number" ? a : typeof b === "number" ? b : 30000;
      let timedOut = false;
      let elementCheckStr = "";
      let element: any = {};
      setTimeout(() => (timedOut = true), timeout);
      while (!elementCheckStr) {
        if (timedOut) throw "Timed out";
        if (typeof a === "string") {
          element = await this.find(selector, a);
          elementCheckStr = element.$;
        } else if (toType(a) === "regexp") {
          throw "Appium does not support finding element by RegEx";
        } else {
          element = await this.find(selector);
          elementCheckStr = element.$;
        }
        await delay(10);
      }
      return element;
    });
  }

  public waitForXPath(xPath: string, timeout?: number): ValuePromise {
    return ValuePromise.execute(async () => {
      let timedOut = false;
      let elementCheckStr = "";
      let element: any = {};
      setTimeout(() => (timedOut = true), timeout || 30000);
      while (!elementCheckStr) {
        if (timedOut) throw "Timed out";
        element = await this.find(xPath);
        elementCheckStr = element.$;
        await delay(10);
      }
      return element;
    });
  }

  public waitForVisible(selector: string, timeout?: number): ValuePromise {
    return ValuePromise.execute(async () => {
      let timedOut = false;
      let elementCheckStr = "";
      let element: any = {};
      let isVisible: Boolean = false;
      setTimeout(() => (timedOut = true), timeout || 30000);
      while (!elementCheckStr) {
        if (timedOut) return wrapAsValue(this.context, null, selector);
        element = await this.find(selector);
        elementCheckStr = element.$;
        await delay(10);
      }
      while (!isVisible) {
        if (timedOut) return wrapAsValue(this.context, null, selector);
        isVisible = await this.isVisible(element);
        await delay(10);
      }
      return element;
    });
  }

  public waitForHidden(selector: string, timeout?: number): ValuePromise {
    return ValuePromise.execute(async () => {
      let timedOut = false;
      let elementCheckStr = "";
      let element: any = {};
      let isVisible: Boolean = true;
      setTimeout(() => (timedOut = true), timeout || 30000);
      while (!elementCheckStr) {
        if (timedOut) return wrapAsValue(this.context, null, selector);
        element = (await this.find(selector)) as AppiumElement;
        elementCheckStr = element.$;
        await delay(10);
      }
      while (isVisible) {
        if (timedOut) return wrapAsValue(this.context, null, selector);
        isVisible = await this.isVisible(element);
        await delay(10);
      }
      return element;
    });
  }

  public async isVisible(element: iValue): Promise<boolean> {
    const res = await this.get(`element/${element}/displayed`);
    return res.jsonRoot.value;
  }

  public async setDeviceProperties(
    devProperties: DeviceProperties
  ): Promise<void> {
    await setDevProperties(
      this.sessionId,
      this.context.scenario,
      devProperties
    );
  }

  // Uses deprecated JSONWP call
  public async isAppInstalled(bundleId: string): Promise<boolean> {
    let res = new JsonDoc("");
    if (this.isAndroid) {
      res = await this.post("appium/device/app_installed", {
        bundleId: bundleId,
      });
    } else if (this.isIos) {
      res = await this.post("execute", {
        script: "mobile: isAppInstalled",
        args: [
          {
            bundleId: bundleId,
          },
        ],
      });
    }
    return res.jsonRoot.value;
  }

  public type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise {
    return ValuePromise.execute(async () =>
      this.find(selector, opts).type(textToType)
    );
  }

  public clear(selector: string): ValuePromise {
    return ValuePromise.execute(async () => this.find(selector).clear());
  }

  public clearThenType(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise {
    return ValuePromise.execute(async () =>
      this.find(selector).clear().type(textToType, opts)
    );
  }

  public async getDeviceProperties(): Promise<DeviceProperties> {
    const devProperties: DeviceProperties = {};
    const location = await this.getGeolocation();
    devProperties.location = {
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude,
    };
    // Android
    if (this.isAndroid) {
      const wifiState: number = await sendAdbCommand(
        this.sessionId,
        this.context.scenario,
        "settings",
        ["get", "global", "wifi_on"]
      );
      const mobileDataState: number = await sendAdbCommand(
        this.sessionId,
        this.context.scenario,
        "settings",
        ["get", "global", "mobile_data"]
      );
      const locationServicesState: number = await sendAdbCommand(
        this.sessionId,
        this.context.scenario,
        "settings",
        ["get", "secure", "location_mode"]
      );
      const airplaneModeState: number = await sendAdbCommand(
        this.sessionId,
        this.context.scenario,
        "settings",
        ["get", "global", "airplane_mode_on"]
      );

      devProperties.network = {
        wifi: wifiState == 0 ? false : true,
        mobileData: mobileDataState == 0 ? false : true,
        locationServices: locationServicesState == 0 ? false : true,
        airplaneMode: airplaneModeState == 0 ? false : true,
      };
      // iOS
    } else if (this.isIos) {
      const wifiState = await this._siriQueryAndResponse("Wi-Fi");
      const dataState = await this._siriQueryAndResponse("Cellular Data");
      const locationSvcsState = await this._siriQueryAndResponse(
        "Location Services"
      );
      const airplaneModeState = await this._siriQueryAndResponse(
        "Airplane Mode"
      );
      await sendSiriCommand(
        this.sessionId,
        this.context.scenario,
        "Close Siri"
      );
      await delay(3500);

      devProperties.network = {
        wifi: wifiState,
        mobileData: dataState,
        locationServices: locationSvcsState,
        airplaneMode: airplaneModeState,
      };
    }

    return devProperties;
  }

  protected async _siriQueryAndResponse(setting: string): Promise<boolean> {
    await sendSiriCommand(
      this.sessionId,
      this.context.scenario,
      `Get ${setting} status`
    );

    const res = await getSiriEffect(
      this.sessionId,
      this.context.scenario,
      setting
    );

    return res === "On" ? true : false;
  }

  public getSource(): ValuePromise {
    return ValuePromise.execute(async () => {
      const res = await this.get("source");
      return wrapAsValue(
        this.context,
        res.jsonRoot.value,
        "XML source for current viewport"
      );
    });
  }

  public async get(suffix: string): Promise<any> {
    return sendAppiumRequest(
      this.scenario,
      `/session/${this.sessionId}/${suffix}`,
      {
        method: "get",
      }
    );
  }

  public async post(suffix: string, data: any): Promise<any> {
    return sendAppiumRequest(
      this.scenario,
      `/session/${this.sessionId}/${suffix}`,
      {
        method: "post",
        data,
      }
    );
  }

  // Uses call from deprecated JSONWP protocol and is subject to change
  public async terminateApp(
    app: string,
    timeout?: number
  ): Promise<void | boolean> {
    if (this.isAndroid) {
      if (timeout) {
        await this.post("appium/device/terminate_app", {
          appId: app,
          options: {
            timeout: timeout,
          },
        });
      } else {
        await this.post("appium/device/terminate_app", {
          appId: app,
        });
      }
      // This call is not deprecated
    } else if (this.isIos) {
      const res = await this.post("execute", {
        script: "mobile: terminateApp",
        args: [{ bundleId: app }],
      });

      return res.jsonRoot.value;
    }
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

    const res = await this.get("screenshot");
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

  // Based on deprecated JSONWP protocol and subject to change
  public async resetApp(): Promise<void> {
    await this.post("appium/app/reset", {});
  }

  // Uses call from deprecated JSONWP protocol and is subject to change
  public async launchApp(
    app?: string,
    args?: string[],
    environment?: any
  ): Promise<void> {
    if (this.isAndroid) {
      await this.post("appium/app/launch", {});
      // This call is not deprecated
    } else if (this.isIos) {
      if (!app) throw "App bundleId required for launching an iOS app";

      await this.post("execute", {
        script: "mobile: launchApp",
        args: {
          bundleId: app,
          arguments: args,
          environment: environment,
        },
      });
    }
  }

  // Uses deprecated JSONWP call
  public async getAppiumContexts(): Promise<string[]> {
    const res = await sendAppiumRequest(
      this.scenario,
      `/session/${this.sessionId}/contexts`,
      {
        method: "get",
      }
    );

    return res.jsonRoot.value;
  }

  // Uses deprecated JSONWP call
  public async setAppiumContext(appiumContext: string): Promise<void> {
    const res = await sendAppiumRequest(
      this.scenario,
      `/session/${this.sessionId}/context`,
      {
        method: "post",
        data: {
          name: appiumContext,
        },
      }
    );

    if (res.jsonRoot.value?.error) {
      throw res.jsonRoot.value.message;
    }
  }

  public async goBack(): Promise<void> {
    await this.post("back", {});
  }

  public async backgroundApp(seconds: number = -1): Promise<void> {
    if (seconds > -1) {
      await this.post("appium/app/background", {
        seconds: seconds,
      });
    } else {
      await this.post("appium/app/background", {});
    }
  }
}
