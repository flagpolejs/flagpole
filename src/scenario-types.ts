export const ScenarioTypeEnum = [
  "html",
  "json",
  "image",
  "ffprobe",
  "mediastreamvalidator",
  "hls",
  "resource",
  "browser",
  "extjs",
  "xml",
  "rss",
  "atom",
  "soap",
  "appium",
  "headers",
] as const;
export type ScenarioType = typeof ScenarioTypeEnum[number];
