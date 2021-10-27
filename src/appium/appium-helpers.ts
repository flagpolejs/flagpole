import { HttpRequest } from "../httprequest";
import { HttpRequestOptions } from "../interfaces";
import { Scenario } from "../scenario";

const DEFAULT_APPIUM_PORT = 4723;

const getUrlPrefix = (scenario: Scenario): string =>
  scenario.suite.baseUrl
    ? `${scenario.suite.baseUrl.protocol}//${scenario.suite.baseUrl.host}`
    : `http://localhost:${DEFAULT_APPIUM_PORT}`;

const sendAppiumRequest = async (
  scenario: Scenario,
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
  return JSON.parse(res.body);
};

const getAppiumSession = async (scenario: Scenario) => {
  const json = await sendAppiumRequest(scenario, "/sessions", {
    method: "get",
  });
  return json.value[0]?.id || null;
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
  return json.value.sessionId;
};

export const appiumSessionCreate = (scenario: Scenario, opts: any = {}) => {
  return async () => {
    const existingSessionId = await getAppiumSession(scenario);
    if (existingSessionId) {
      return scenario.set("sessionId", existingSessionId);
    }
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
