import { LaunchOptions } from "puppeteer-core";

export interface BrowserOptions extends LaunchOptions {
  width?: number;
  height?: number;
  recordConsole?: boolean;
  outputConsole?: boolean;
  product?: "chrome" | "firefox";
  ignoreHTTPSErrors?: boolean;
  headless?: boolean;
  executablePath?: string;
  slowMo?: number;
  args?: string[];
  ignoreDefaultArgs?: boolean | string[];
  timeout?: number;
  devtools?: boolean;
  defaultViewport?: {
    width?: number;
    height?: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
    hasTouch?: boolean;
    isLandscape?: boolean;
  };
  handleSIGINT?: boolean;
  handleSIGTERM?: boolean;
  handleSIGHUP?: boolean;
  dumpio?: boolean;
  userDataDir?: string;
  env?: { [key: string]: any };
  pipe?: boolean;
  extraPrefsFirefox?: any;
}
