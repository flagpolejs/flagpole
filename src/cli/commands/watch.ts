import { Command } from "../command";
import { FlagpoleExecution } from "../../flagpole-execution";
import * as fs from "fs-extra";
import * as path from "path";
import crypto = require("crypto");
import { printSubheader, printLine } from "../cli-helper";
import { Cli } from "../cli";

interface iFileWatcher {
  contentMd5: string | null;
  fileWait: any;
}

const hash = (input: string): string => {
  return crypto.createHash("md5").update(input).digest("hex");
};

export default class About extends Command {
  public commandString = "watch";
  public files: { [filename: string]: iFileWatcher } = {};
  public isHidden = true;
  private fsWait: any = null;
  private changeCount: number = 0;

  public async action() {
    printSubheader("Watch");
    if (!FlagpoleExecution.global.config.project.isTypeScript) {
      printLine("This Flagpole project is not using typescript.");
      return Cli.exit(1);
    }
    this.watchTestSrc();
  }

  private watchTestSrc() {
    const srcFolder = FlagpoleExecution.global.config.getSourceFolder();
    const distFolder = FlagpoleExecution.global.config.getTestsFolder();

    if (!srcFolder || !distFolder) {
      return Cli.log(
        "TypeScript is not configured correctly for this Flagpole project."
      ).exit(1);
    }

    printLine(`Watching for updates to: ${srcFolder}`);

    fs.watch(
      srcFolder,
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
            fs.readFileSync(path.join(srcFolder, fileName), "utf8")
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
          this.fsWait = setTimeout(async () => {
            printLine(
              `${this.changeCount} ${
                this.changeCount > 1 ? "files" : "file"
              } changed.`,
              "Re-transpiling tests..."
            );
            this.fsWait = null;
            this.changeCount = 0;
            try {
              await FlagpoleExecution.global.config.tsc();
              printLine("Done!");
            } catch (err) {
              printLine(String(err));
            }
          }, 1000);
        }
      }
    );
  }

  private watchDist(suiteNames: string[], tag: string) {
    const packageJson = require(path.join(
      FlagpoleExecution.global.config.getConfigFolder() || process.cwd(),
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
