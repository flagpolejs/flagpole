import * as fs from "fs";

export const openInBrowser = async (content: string): Promise<string> => {
  const open = require("open");
  const tmp = require("tmp");
  const tmpObj = tmp.fileSync({ postfix: ".html" });
  const filePath: string = tmpObj.name;
  fs.writeFileSync(filePath, content);
  await open(filePath);
  return filePath;
};
