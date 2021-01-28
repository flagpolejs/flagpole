import { Command } from "../command";
import minikin, { Response } from "minikin";
import * as fs from "fs";
import { FlagpoleExecution } from "../..";
import * as mustache from "mustache";

const getPath = (fileName: string): string => {
  return fs.realpathSync(`${__dirname}/../web/${fileName}`);
};

const fromFile = (fileName: string): Response =>
  Response.fromFile(getPath(fileName));

const getTemplate = (fileName: string): string => {
  try {
    const filePath = getPath(fileName);
    return fs.readFileSync(filePath, "utf8");
  } catch (ex) {
    console.log(ex);
    return "";
  }
};

const render = (fileName: string, data: any): Response => {
  return Response.fromString(
    mustache.render(getTemplate(fileName), data)
  ).header("Content-Type", "text/html");
};

const routes = {
  "GET /": () =>
    render("index.html", {
      suites: Object.values(FlagpoleExecution.global.config.suites),
    }),
  "GET /style.css": () => fromFile("style.css"),
};

export default class Serve extends Command {
  public commandString = "serve";
  public description = "Run a local web server to interact with Flagpole";
  public async action() {
    const server = await minikin.server(8000);
    server.routes(routes);
  }
}
