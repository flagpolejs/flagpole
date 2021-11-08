import { HttpRequest } from "../httprequest";
import { HttpRequestOptions, iScenario } from "../interfaces";
import { Scenario } from "../scenario";
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

const getAppiumSession = async (scenario: Scenario) => {
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
