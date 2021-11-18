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
import { applyOffsetAndLimit, wrapAsValue } from "../helpers";
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
export const appiumSessionCreate = (
  scenario: Scenario,
  opts: any = {},
  devProperties: DeviceProperties = {}
) => {
  return async () => {
    const existingSessionId = await getAppiumSession(scenario);
    if (existingSessionId) {
      const capabilities = await getAppiumSessionCapabilities(
        existingSessionId,
        scenario
      );
      scenario.set("capabilities", capabilities);
      await setDevProperties(existingSessionId, scenario, devProperties);
      return scenario.set("sessionId", existingSessionId);
    }
    scenario.set("capabilities", opts);
    const newSessionId = await createAppiumSession(scenario, opts);
    await setDevProperties(newSessionId, scenario, devProperties);
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
  scenario: Scenario
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
 * @return {Promise<any>} - Object containing device properties
 * */
const setDevProperties = async (
  sessionId: string,
  scenario: Scenario,
  devProperties: DeviceProperties = {}
): Promise<any> => {
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

  return devProperties;
};
