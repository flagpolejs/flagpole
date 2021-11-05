import { HttpRequest } from "../httprequest";
import { Scenario } from "../scenario";
import {
  HttpRequestOptions,
  iScenario,
  iValue,
  iAssertionContext,
  FindAllOptions,
} from "../interfaces";
import { applyOffsetAndLimit } from "../helpers";
import { AppiumResponse } from "./appiumresponse";
import { JsonDoc } from "../json/jpath";

const DEFAULT_APPIUM_PORT = 4723;

const getUrlPrefix = (scenario: iScenario): string =>
  scenario.suite.baseUrl
    ? `${scenario.suite.baseUrl.protocol}//${scenario.suite.baseUrl.host}/wd/hub`
    : `http://localhost:${DEFAULT_APPIUM_PORT}/wd/hub`;

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

const getAppiumSession = async (scenario: iScenario) => {
  const json = await sendAppiumRequest(scenario, "/sessions", {
    method: "get",
  });
  return json.jsonRoot.value[0]?.id || null;
};

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

export const appiumSessionCreate = (scenario: Scenario, opts: any = {}) => {
  return async () => {
    const existingSessionId = await getAppiumSession(scenario);
    if (existingSessionId) {
      const capabilities = await getAppiumSessionCapabilities(
        existingSessionId,
        scenario
      );
      scenario.set("capabilities", capabilities);
      return scenario.set("sessionId", existingSessionId);
    }
    scenario.set("capabilities", opts);
    return scenario.set("sessionId", await createAppiumSession(scenario, opts));
  };
};

export const appiumSessionDestroy = (scenario: Scenario) => {
  return async () => {
    const sessionId = scenario.get("sessionId");
    return sendAppiumRequest(scenario, `/session/${sessionId}`, {
      method: "delete",
    });
  };
};

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

      UiSelector =
        UiSelector +
        'resourceId("' +
        packageName +
        ":id/" +
        usingValue[1] +
        '").textContains("' +
        text +
        '")';
      break;
    case "class name":
      UiSelector =
        UiSelector +
        'className("' +
        usingValue[1] +
        '").textContains("' +
        text +
        '")';
      break;
    case "accessibility id":
      UiSelector =
        UiSelector +
        'description("' +
        usingValue[1] +
        '").textContains()' +
        text +
        '")';
      break;
    default:
      UiSelector = UiSelector + 'text("' + text + '")';
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

  let elements: iValue[] = res.jsonRoot.value;

  if (opts?.offset || opts?.limit) {
    elements = applyOffsetAndLimit(opts, elements);
  }

  return elements;
};

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

const getAppiumSessionCapabilities = async (
  existingSessionId: string,
  scenario: Scenario
) => {
  const res = await sendAppiumRequest(
    scenario,
    `/session/${existingSessionId}`,
    {
      method: "get",
    }
  );

  return res.jsonRoot.value;
};
