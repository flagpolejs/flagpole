import { Command } from "../command";
import { Cli } from "../cli";
import { FlagpoleExecution } from "../../flagpoleexecution";
import * as fs from "fs-extra";
import * as path from "path";
import crypto = require("crypto");

interface iFileWatcher {
  contentMd5: string | null;
  fileWait: any;
}

export default class About extends Command {
  public commandString = "watch";
  public files: { [filename: string]: iFileWatcher } = {};
  public isHidden = true;
  private fsWait: any = null;
  private changeCount: number = 0;

  public async action() {}

  private watch(suiteNames: string[], tag: string) {
    const packageJson = require(path.join(
      FlagpoleExecution.config?.getConfigFolder() || process.cwd(),
      "package.json"
    ));
    const entryPoint = packageJson.main;
    const distFolder = path.dirname(entryPoint);

    Cli.log(`Watching for updates to: ${distFolder}`);

    fs.watch(
      distFolder,
      { recursive: true },
      (eventType: string, fileName: string) => {
        if (fileName) {
          // Create this file in our watcher list if not yet there
          if (typeof this.files[fileName] == "undefined") {
            this.files[fileName] = {
              contentMd5: null,
              fileWait: null,
            };
          }
          // If we are waiting, ignore this
          if (this.files[fileName].fileWait !== null) {
            return;
          }
          // Set up a wait now to debounce
          this.files[fileName].fileWait = setTimeout(() => {
            this.files[fileName].fileWait = null;
          }, 100);
          // If this file hasn't changed, ignore this update
          const md5Current = hash(
            fs.readFileSync(`${distFolder}/${fileName}`, "utf8")
          );
          if (md5Current === this.files[fileName].contentMd5) {
            return;
          }
          // Remember this update for next time
          this.files[fileName].contentMd5 = md5Current;
          // Overall wait for all files
          this.changeCount++;
          if (this.fsWait !== null) {
            return;
          }
          // Wait how long
          this.fsWait = setTimeout(() => {
            this.changeCount = 0;
            this.fsWait = null;
            Cli.log(`${this.changeCount} files changed. Running tests...`);
            //run(suiteNames, tag, false);
          }, 1000);
        }
      }
    );
  }
}

const hash = (input: string): string => {
  return crypto.createHash("md5").update(input).digest("hex");
};
