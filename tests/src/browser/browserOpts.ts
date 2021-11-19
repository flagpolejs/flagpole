import { BrowserOptions } from "../../../dist";

const ci = Boolean(process.env.CI || false);

const baseOptions: BrowserOptions = {
  headless: false,
  recordConsole: true,
  outputConsole: false,
  width: 1024,
  height: 768,
};

const ciPipelineOptions = {
  ...baseOptions,
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: [
    "--ignore-certificate-errors",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-accelerated-2d-canvas",
    "--disable-gpu",
  ],
};

export const browserOpts = ci ? ciPipelineOptions : baseOptions;
