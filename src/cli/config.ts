import { normalizePath } from "../util";
import { exec } from "child_process";

const fs = require("fs");
const path = require("path");

export interface iEnvOpts {
  name: string;
  defaultDomain?: string;
}

export interface iSuiteOpts {
  id?: string;
  name: string;
  description?: string;
  tags?: string[];
}

export interface iProjectOpts {
  id?: string;
  name: string;
  path: string;
  source?: string;
  output?: string;
  images?: string;
  cache?: string;
}

export interface iConfigOpts {
  configPath?: string;
  project: iProjectOpts;
  environments: iEnvOpts[];
  suites?: iSuiteOpts[];
}

export interface iConfigFile {
  project: iProjectOpts;
  environments: { [key: string]: iEnvOpts };
  suites: { [key: string]: iSuiteOpts };
}

export interface iScenarioOpts {
  description: string;
  path: string;
  type: string;
}

export class EnvConfig {
  protected config: FlagpoleConfig;

  public name: string;
  public defaultDomain: string;

  constructor(config: FlagpoleConfig, opts: iEnvOpts) {
    this.config = config;
    this.name = opts.name;
    this.defaultDomain = opts.defaultDomain || "";
  }

  public toJson(): iEnvOpts {
    return {
      name: this.name,
      defaultDomain: this.defaultDomain
    };
  }
}

export class SuiteConfig {
  protected config: FlagpoleConfig;
  public id: string;
  public name: string;
  public tags: string[] = [];

  constructor(config: FlagpoleConfig, opts: iSuiteOpts) {
    this.config = config;
    this.name = opts.name || "";
    this.id = opts.id || "";
    if (opts.tags) {
      opts.tags.forEach(tag => {
        this.tags.push(String(tag));
      });
    }
  }

  public getSourcePath(): string {
    return this.config.project.isSourceAndOutput
      ? path.join(this.config.getSourceFolder(), `${this.name}.ts`)
      : this.getTestPath();
  }

  public getTestPath(): string {
    return path.join(this.config.getTestsFolder(), `${this.name}.js`);
  }

  public clearTags() {
    this.tags = [];
  }

  public addTag(tag: string) {
    tag = String(tag).trim();
    if (tag.length && this.tags.indexOf(tag) < 0) {
      this.tags.push(tag);
    }
  }

  public toJson(): iSuiteOpts {
    return {
      id: this.id,
      name: this.name,
      // Remove duplicates and empty strings
      tags: [...new Set(this.tags)].filter(value => {
        return value.trim().length > 0;
      })
    };
  }
}

export class ProjectConfig {
  protected config: FlagpoleConfig;

  public id: string = "";
  public name: string;
  public path: string;
  public source: string | undefined;
  public output: string | undefined;
  public images: string;
  public cache: string;

  public get isSourceAndOutput(): boolean {
    return this.source !== undefined && this.output !== undefined;
  }

  public get hasId(): boolean {
    return this.id.length > 0;
  }

  constructor(config: FlagpoleConfig, opts: iProjectOpts) {
    this.config = config;
    this.id = opts.id || "";
    this.name = opts.name || "default";
    this.path = opts.path || "tests";
    this.images = opts.images || "images";
    this.cache = opts.cache || "cache";
    this.source = opts.source;
    this.output = opts.output;
  }

  public setTypeScriptFolders(
    rootFolder: string,
    srcFolder: string,
    outFolder: string
  ): ProjectConfig {
    this.path = rootFolder;
    this.source = srcFolder;
    this.output = outFolder;
    return this;
  }

  public toJson(): iProjectOpts {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
      source: this.source,
      output: this.output,
      images: this.images,
      cache: this.cache
    };
  }
}

export class FlagpoleConfig {
  protected configPath: string;
  protected _onSave: Function[] = [];

  public project: ProjectConfig;
  public suites: { [key: string]: SuiteConfig } = {};
  public environments: { [key: string]: EnvConfig } = {};

  constructor(opts: iConfigOpts) {
    // Implicit (do not show up in the config file output)
    this.configPath =
      opts.configPath || path.join(process.cwd(), "flagpole.json");
    // Explicit (can be set and show in config file output)
    this.project = new ProjectConfig(this, opts.project);
    if (opts.suites !== undefined) {
      opts.suites.forEach(suiteOpts => {
        this.suites[suiteOpts.name] = new SuiteConfig(this, suiteOpts);
      });
    }
    opts.environments.forEach(envOpts => {
      this.environments[envOpts.name] = new EnvConfig(this, envOpts);
    });
  }

  public getConfigFolder(): string {
    return path.dirname(this.configPath);
  }

  public getConfigPath(): string {
    return this.configPath;
  }

  public getRootFolder(): string {
    return normalizePath(path.join(this.getConfigFolder(), this.project.path));
  }

  public getTestsFolder(): string {
    return normalizePath(
      path.join(this.getRootFolder(), this.project.output || "")
    );
  }

  public getSourceFolder(): string {
    return normalizePath(
      path.join(this.getRootFolder(), this.project.source || "")
    );
  }

  public getImagesFolder(): string {
    return normalizePath(
      path.join(this.getRootFolder(), this.project.images || "images")
    );
  }

  public getCacheFolder(): string {
    return normalizePath(
      path.join(this.getRootFolder(), this.project.cache || "cache")
    );
  }

  public addEnvironment(opts: iEnvOpts) {
    if (opts.name.length) {
      this.environments[opts.name] = new EnvConfig(this, opts);
    }
  }

  public addSuite(opts: iSuiteOpts) {
    if (opts.name.length) {
      this.suites[opts.name] = new SuiteConfig(this, opts);
    }
  }

  public removeEnvironment(name: string) {
    delete this.environments[name];
  }

  public removeSuite(name: string) {
    delete this.suites[name];
  }

  public getEnvironments(): EnvConfig[] {
    let envConfigs: EnvConfig[] = [];
    for (let key in this.environments) {
      envConfigs.push(this.environments[key]);
    }
    return envConfigs;
  }

  public getEnvironmentNames(): string[] {
    let envs: string[] = [];
    for (let key in this.environments) {
      envs.push(this.environments[key].name);
    }
    return envs;
  }

  public getSuites(): SuiteConfig[] {
    let suiteConfigs: SuiteConfig[] = [];
    for (let key in this.suites) {
      suiteConfigs.push(this.suites[key]);
    }
    return suiteConfigs;
  }

  public getSuiteNames(): string[] {
    let suiteNames: string[] = [];
    for (let key in this.suites) {
      suiteNames.push(this.suites[key].name);
    }
    return suiteNames;
  }

  public isValid(): boolean {
    if (
      this.project === null ||
      this.project.name.length == 0 ||
      this.project.path.length == 0
    ) {
      return false;
    }
    if (
      typeof this.getTestsFolder() == "undefined" ||
      !fs.existsSync(this.getTestsFolder())
    ) {
      return false;
    }
    if (Object.keys(this.environments).length == 0) {
      return false;
    }
    return true;
  }

  public toFileObject(): iConfigFile {
    return {
      project: this.project.toJson(),
      environments: (() => {
        let envs: any = {};
        Object.values(this.environments).forEach(env => {
          envs[env.name] = env.toJson();
        });
        return envs;
      })(),
      suites: (() => {
        let suites: any = {};
        Object.values(this.suites).forEach(suite => {
          suites[suite.name] = suite.toJson();
        });
        return suites;
      })()
    };
  }

  public toString(): string {
    return JSON.stringify(this.toFileObject(), null, 2);
  }

  public onSave(callback: Function) {
    this._onSave.push(callback);
  }

  public save(): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.getConfigPath(), this.toString(), (err: any) => {
        if (err) {
          return reject(err);
        }
        this._onSave.forEach(callback => {
          callback();
        });
        resolve();
      });
    });
  }

  public writeTsConfig(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.project.isSourceAndOutput) {
        reject(
          "Project config does not have a source and output folder defined."
        );
        return;
      }
      const tsconfig = {
        compilerOptions: {
          module: "commonjs",
          target: "es2016",
          noImplicitAny: false,
          sourceMap: false,
          declaration: false,
          rootDir: `.${path.sep}${this.project.source}`,
          outDir: `.${path.sep}${this.project.output}`,
          strict: true,
          moduleResolution: "node",
          removeComments: true,
          preserveConstEnums: true
        },
        include: [`src${path.sep}**${path.sep}*`],
        exclude: ["node_modules", `**${path.sep}*.spec.ts`]
      };
      const tsconfigPath = path.join(this.getRootFolder(), "tsconfig.json");
      fs.writeFile(
        tsconfigPath,
        JSON.stringify(tsconfig, null, 2),
        (err: any) => {
          if (err) {
            return reject(err);
          }
          resolve(tsconfigPath);
        }
      );
    });
  }

  public tsc(): Promise<string> {
    return new Promise((resolve, reject) => {
      const rootFolder = this.getRootFolder();
      const cwd = process.cwd();
      const command = `cd ${rootFolder} && tsc && cd ${cwd}`;
      exec(command, (err, stdout, stderr) => {
        if (err) {
          reject(stdout || stderr || err);
          return;
        }
        resolve(stdout);
      });
    });
  }
}
