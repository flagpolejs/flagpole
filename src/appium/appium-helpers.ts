import { HttpRequest } from "../httprequest";
import { Scenario } from "../scenario";
import {
  HttpRequestOptions,
  iScenario,
  iValue,
  FindAllOptions,
  AppiumElementIdResponse,
  DeviceProperties,
} from "../interfaces";
import { applyOffsetAndLimit, delay, wrapAsValue } from "../helpers";
import { AppiumResponse } from "./appiumresponse";
import { JsonDoc } from "../json/jpath";

const DEFAULT_APPIUM_PORT = 4723;

// Get URL prefix for sending Appium HTTP calls
/*
 * @param {iScenario} scenario - FlagPole scenario
 * */
const getUrlPrefix = (scenario: iScenario): string =>
  scenario.suite.baseUrl
    ? `${scenario.suite.baseUrl.protocol}//${scenario.suite.baseUrl.host}/wd/hub`
    : `http://localhost:${DEFAULT_APPIUM_PORT}/wd/hub`;

// Send HTTP request to Appium server and return the response as a JsonDoc
/*
 * @param {iScenario} scenario - FlagPole scenario
 * @param {string} path - Route to send request
 * @param {HttpRequestOptions} opts - Additional options for request such as method, data, etc.
 * @return {Promise<JsonDoc>} JSON object that is the result of the call to the Appium server
 * */
export const sendAppiumRequest = async (
  scenario: iScenario,
  path: string,
  opts: HttpRequestOptions
) => {
  const urlPrefix = getUrlPrefix(scenario);
  const req = new HttpRequest({
    ...opts,
    ...{
      headers: { "Content-Type": "application/json" },
      uri: `${urlPrefix}${path}`,
    },
  });
  const res = await req.fetch();
  const doc = new JsonDoc(JSON.parse(res.body));
  return doc;
};

// Get first returned Appium sessionId
// This is necessary for all other HTTP calls to the Appium server
/*
 * @param {iScenario} scenario - FlagPole scenario
 * @return {Promise<string>} sessionId to route all other HTTP requests
 * */
const getAppiumSession = async (scenario: iScenario) => {
  const json = await sendAppiumRequest(scenario, "/sessions", {
    method: "get",
  });
  return json.jsonRoot.value[0]?.id || null;
};

// Create a new Appium session
// Returns sessionId from newly created session
/*
 * @param {Scenario} scenario - FlagPole scenario
 * @param {any} opts - Appium session settings, called "capabilities"
 * @return {Promise<string>} sessionId to route all other HTTP requests
 * */
const createAppiumSession = async (scenario: Scenario, opts: any = {}) => {
  const json = await sendAppiumRequest(scenario, "/session", {
    method: "post",
    data: {
      capabilities: {
        alwaysMatch: { ...opts },
      },
    },
  });
  return json.jsonRoot.value.sessionId;
};

// Wrapper method which checks if an Appium session already exists
// Returns scenario with existing or new Appium sessionId set to a scenario alias
/*
 * @param {Scenario} scenario - FlagPole scenario
 * @param {any} opts - Appium session settings, called "capabilities"
 * @return {Promise<Scenario>} Initial scenario with alias set
 * */
export const appiumSessionCreate = (scenario: Scenario, opts: any = {}) => {
  return async () => {
    const existingSessionId = await getAppiumSession(scenario);
    if (existingSessionId) {
      const capabilities = await getAppiumSessionCapabilities(
        existingSessionId,
        scenario
      );
      scenario.set("capabilities", capabilities);
      if (opts.devProperties) {
        await setDevProperties(existingSessionId, scenario, opts.devProperties);
      }
      return scenario.set("sessionId", existingSessionId);
    }
    const newSessionId = await createAppiumSession(scenario, opts);
    const capabilities = await getAppiumSessionCapabilities(
      newSessionId,
      scenario
    );
    scenario.set("capabilities", capabilities);
    if (opts.devProperties) {
      await setDevProperties(newSessionId, scenario, opts.devProperties);
    }
    return scenario.set("sessionId", newSessionId);
  };
};

// End Appium session
/*
 * @param {Scenario} scenario - FlagPole scenario
 * @return {Promise<JsonDoc>} JSON response from DELETE call
 * */
export const appiumSessionDestroy = (scenario: Scenario) => {
  return async () => {
    const sessionId = scenario.get("sessionId");
    return sendAppiumRequest(scenario, `/session/${sessionId}`, {
      method: "delete",
    });
  };
};

// Find by Android specific uiautomator selector
/*
 * @param {AppiumResponse} response - AppiumResponse which initiated findAll call referencing this method
 * @param {string} selector - Selector passed in from findAll call referencing this method
 * @param {string} text - Text value of element to be found, passed in from findAll call referencing this method
 * @param {FindAllOptions | null} [opts] - Optional parameter which contains information on how many elements to return
 * @return {Promise<iValue[]>} Elements found and possibly pared down by opts
 * */
export const appiumFindByUiAutomator = async (
  response: AppiumResponse,
  selector: string,
  text: string,
  opts?: FindAllOptions | null
): Promise<iValue[]> => {
  const usingValue = selector.split("/");
  let UiSelector = "new UiSelector().";

  switch (usingValue[0]) {
    case "id":
      const packageName = await appiumGetPackageName(response);
      UiSelector += `resourceId("${packageName}:id/${usingValue[1]}").textContains("${text}")`;
      break;
    case "class name":
      UiSelector += `className("${usingValue[1]}").textContains("${text}")`;
      break;
    case "accessibility id":
      UiSelector += `description("${usingValue[1]}").textContains("${text}")`;
      break;
    default:
      UiSelector += `text("${text}")`;
  }

  const res = await sendAppiumRequest(
    response.scenario,
    `/session/${response.sessionId}/elements`,
    {
      method: "post",
      data: {
        using: "-android uiautomator",
        value: UiSelector,
      },
    }
  );

  const elements: iValue[] = (
    res.jsonRoot.value as AppiumElementIdResponse[]
  ).map((item, i) =>
    wrapAsValue(
      response.context,
      item.ELEMENT,
      `${selector} with text "${text}" [${i}]`
    )
  );

  return opts?.offset || opts?.limit
    ? applyOffsetAndLimit(opts, elements)
    : elements;
};

// Get package of Application Under Test
/*
 * @param {AppiumResponse} response - AppiumResponse which called this function
 * @return {Promise<string>} Package name of Application Under Test
 * */
const appiumGetPackageName = async (
  response: AppiumResponse
): Promise<string> => {
  // The call to the Appium API is part of the deprecated JSONWP specification and is subject to removal
  const res = await sendAppiumRequest(
    response.scenario,
    `/session/${response.sessionId}/appium/device/current_package`,
    {
      method: "get",
    }
  );

  return res.jsonRoot.value;
};

// Get Appium session settings, called "capabilities"
/*
 * @param {string} sessionId - ID for currently running session
 * @param {Scenario} scenario - FlagPole scenario
 * @return {Promise<any>} - Object containing session capabilities
 * */
const getAppiumSessionCapabilities = async (
  sessionId: string,
  scenario: iScenario
) => {
  const res = await sendAppiumRequest(scenario, `/session/${sessionId}`, {
    method: "get",
  });

  return res.jsonRoot.value;
};

// Set device properties, currently only for Appium
/*
 * @param {string} sessionId - ID for currently running session
 * @param {Scenario} scenario - FlagPole scenario
 * @param {DeviceProperties} devProperties - Object containing the properties to be set
 * @return {Promise<void>}
 * */
export const setDevProperties = async (
  sessionId: string,
  scenario: iScenario,
  devProperties: DeviceProperties = {}
): Promise<void> => {
  if (devProperties.network) {
    const capabilities = await getAppiumSessionCapabilities(
      sessionId,
      scenario
    );
    const automationName = capabilities.automationName;

    // Android
    if (
      automationName.toLowerCase() === "uiautomator2" ||
      automationName.toLowerCase() === "espresso"
    ) {
      if (devProperties.network.wifi !== undefined) {
        await sendAdbCommand(
          sessionId,
          scenario,
          `svc wifi ${devProperties.network.wifi ? "enable" : "disable"}`
        );
      }

      if (devProperties.network.mobileData !== undefined) {
        await sendAdbCommand(
          sessionId,
          scenario,
          `svc data ${devProperties.network.mobileData ? "enable" : "disable"}`
        );
      }

      if (devProperties.network.locationServices !== undefined) {
        await sendAdbCommand(sessionId, scenario, "settings", [
          "put",
          "secure",
          "location_mode",
          devProperties.network.locationServices ? 3 : 0,
        ]);
      }

      if (devProperties.network.airplaneMode === true) {
        await sendAdbCommand(sessionId, scenario, "settings", [
          "put",
          "global",
          "airplane_mode_on",
          1,
        ]);
        await sendAdbCommand(sessionId, scenario, "svc wifi disable");
        await sendAdbCommand(sessionId, scenario, "svc data disable");
      }

      if (devProperties.network.airplaneMode === false) {
        await sendAdbCommand(sessionId, scenario, "settings", [
          "put",
          "global",
          "airplane_mode_on",
          0,
        ]);
      }
      // iOS
    } else if (capabilities.automationName.toLowerCase() === "xcuitest") {
      if (devProperties.network.wifi !== undefined) {
        await siriCommandAndResponse(
          sessionId,
          scenario,
          "Wi-Fi",
          devProperties.network.wifi
        );
      }

      if (devProperties.network.mobileData !== undefined) {
        await siriCommandAndResponse(
          sessionId,
          scenario,
          "Cellular Data",
          devProperties.network.mobileData
        );
      }

      if (devProperties.network.locationServices !== undefined) {
        if (devProperties.network.locationServices) {
          await sendSiriCommand(
            sessionId,
            scenario,
            "Turn on location services"
          );
          const siriVal = await getSiriEffect(
            sessionId,
            scenario,
            "Location Services"
          );
          if (siriVal !== "On") throw "Failed to set location services";
        } else {
          await sendSiriCommand(
            sessionId,
            scenario,
            "Turn off location services"
          );
          let siriVal = await getSiriEffect(
            sessionId,
            scenario,
            "Location Services"
          );
          if (siriVal === "On") {
            await sendSiriCommand(sessionId, scenario, "Yes");
            await delay(100);
          }
          siriVal = await getSiriEffect(
            sessionId,
            scenario,
            "Location Services"
          );
          if (siriVal !== "Off") throw "Failed to set location services";
        }
      }

      if (devProperties.network.airplaneMode !== undefined) {
        await siriCommandAndResponse(
          sessionId,
          scenario,
          "Airplane Mode",
          devProperties.network.airplaneMode
        );
      }

      await sendSiriCommand(sessionId, scenario, "Close Siri");
      await delay(3500);
    }
  }

  if (devProperties.location) {
    await sendAppiumRequest(scenario, `/session/${sessionId}/location`, {
      method: "post",
      data: {
        location: {
          latitude: devProperties.location.latitude,
          longitude: devProperties.location.longitude,
          altitude: devProperties.location.altitude || 0,
        },
      },
    });
  }
};

export const sendAdbCommand = async (
  sessionId: string,
  scenario: iScenario,
  command: string,
  args?: any[],
  timeout: number = 20000,
  includeStderr: boolean = false
): Promise<any> => {
  const res = await sendAppiumRequest(
    scenario,
    `/session/${sessionId}/execute`,
    {
      method: "post",
      data: {
        script: "mobile: shell",
        args: {
          command: command,
          args: args,
          timeout: timeout,
          includeStderr: includeStderr,
        },
      },
    }
  );

  if (res.jsonRoot.value?.error) throw res.jsonRoot.value.error.message;

  return res.jsonRoot.value;
};

export const sendSiriCommand = async (
  sessionId: string,
  scenario: iScenario,
  command: string
): Promise<void> => {
  await sendAppiumRequest(scenario, `/session/${sessionId}/execute`, {
    method: "post",
    data: {
      script: "mobile: siriCommand",
      args: {
        text: command,
      },
    },
  });
};

export const getSiriEffect = async (
  sessionId: string,
  scenario: iScenario,
  setting: string
): Promise<string> => {
  const prevTimeout = await getTimeout(sessionId, scenario);
  await setImplicitWait(sessionId, scenario, 3000);

  const elRes = await sendAppiumRequest(
    scenario,
    `/session/${sessionId}/element`,
    {
      method: "post",
      data: {
        using: "accessibility id",
        value: setting,
      },
    }
  );

  const textRes = await sendAppiumRequest(
    scenario,
    `/session/${sessionId}/element/${elRes.jsonRoot.value.ELEMENT}/text`,
    {
      method: "get",
    }
  );

  await setImplicitWait(sessionId, scenario, prevTimeout);

  return textRes.jsonRoot.value;
};

export const siriCommandAndResponse = async (
  sessionId: string,
  scenario: iScenario,
  setting: string,
  isSet: boolean
): Promise<void> => {
  await sendSiriCommand(
    sessionId,
    scenario,
    `Turn ${isSet ? "on" : "off"} ${setting}`
  );

  const siriVal = await getSiriEffect(sessionId, scenario, setting);
  if (siriVal !== (isSet ? "On" : "Off")) throw `Failed to set ${setting}`;
};

export const setImplicitWait = async (
  sessionId: string,
  scenario: iScenario,
  ms: number
): Promise<void> => {
  await sendAppiumRequest(
    scenario,
    `/session/${sessionId}/timeouts/implicit_wait`,
    {
      method: "post",
      data: {
        ms: ms,
      },
    }
  );
};

export const getTimeout = async (
  sessionId: string,
  scenario: iScenario
): Promise<number> => {
  const res = await sendAppiumRequest(
    scenario,
    `/session/${sessionId}/timeouts`,
    {
      method: "get",
    }
  );

  return res.jsonRoot.value.implicit;
};
