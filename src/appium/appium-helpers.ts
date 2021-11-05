import { HttpRequest } from "../httprequest";
import {
  HttpRequestOptions,
  iScenario,
  iValue,
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

const createAppiumSession = async (
  response: AppiumResponse,
  opts: any = {}
) => {
  response.capabilities = opts;
  const json = await sendAppiumRequest(response.scenario, "/session", {
    method: "post",
    data: {
      capabilities: {
        alwaysMatch: { ...opts },
      },
    },
  });
  return json.jsonRoot.value.sessionId;
};

export const appiumSessionCreate = (
  response: AppiumResponse,
  opts: any = {}
) => {
  return async () => {
    const existingSessionId = await getAppiumSession(response.scenario);
    if (existingSessionId) {
      return (response.sessionId = existingSessionId);
    }
    return (response.sessionId = await createAppiumSession(response, opts));
  };
};

export const appiumSessionDestroy = (response: AppiumResponse) => {
  return async () => {
    const sessionId = response.scenario.get("sessionId");
    return sendAppiumRequest(response.scenario, `/session/${sessionId}`, {
      method: "delete",
    });
  };
};

export const appiumFindByUiAutomator = async (
  scenario: iScenario,
  selector: string,
  text: string,
  opts?: FindAllOptions | null
): Promise<iValue[]> => {
  const usingValue = selector.split("/");
  let UiSelector = "new UiSelector().";

  switch (usingValue[0]) {
    case "id":
      const packageNameRes = await sendAppiumRequest(
        scenario,
        `/session/${scenario.get("sessionId")}/appium/device/current_package`,
        {
          method: "get",
        }
      );
      const packageName = packageNameRes.jsonRoot.value;

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
    scenario,
    `/session/${scenario.get("sessionId")}/elements`,
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
