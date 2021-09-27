import { normalizePath } from "./util";
import { exec } from "child_process";
import * as fs from "fs-extra";
import * as path from "path";
import * as rimraf from "rimraf";

export const getDefaultConfig = (configFilePath: string): iConfigOpts => {
  const projectPath = path.dirname(configFilePath);
  return {
    project: {
      name: path.basename(projectPath),
      path: "tests",
    },
    environments: {},
    suites: {},
  };
};

export interface iEnvCollection {
  [name: string]: iEnvOpts;
}

export interface iEnvOpts {
  name: string;
  defaultDomain?: string;
}

export interface iSuiteCollection {
  [name: string]: iSuiteOpts;
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
  schemas?: string;
  pattern?: string;
  reports?: string;
}

export interface iConfigOpts {
  project: iProjectOpts;
  environments: iEnvCollection;
  suites: iSuiteCollection;
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
      defaultDomain: this.defaultDomain,
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
      opts.tags.forEach((tag) => {
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
      tags: [...new Set(this.tags)].filter((value) => {
        return value.trim().length > 0;
      }),
    };
  }
}

export class ProjectConfig {
  protected config: FlagpoleConfig;

  public id = "";
  public name: string;
  public path: string;
  public source: string | undefined;
  public output: string | undefined;
  public images: string;
  public cache: string;
  public schemas: string;
  public pattern: string;
  public reports: string;

  public get isSourceAndOutput(): boolean {
    return this.source !== undefined && this.output !== undefined;
  }

  public get isTypeScript(): boolean {
    return this.isSourceAndOutput;
  }

  public get hasId(): boolean {
    return this.id.length > 0;
  }

  public get patternRegEx(): RegExp {
    let pattern = this.pattern.trim();
    if (pattern) {
      pattern = pattern.replace(".", "\\.").replace("*", ".*");
      return new RegExp(pattern);
    }
    return /.*/;
  }

  constructor(config: FlagpoleConfig, opts: iProjectOpts) {
    this.config = config;
    this.id = opts.id || "";
    this.name = opts.name || "default";
    this.path = opts.path || "tests";
    this.images = opts.images || "images";
    this.cache = opts.cache || "cache";
    this.schemas = opts.schemas || "schemas";
    this.reports = opts.reports || "reports";
    this.source = opts.source;
    this.output = opts.output;
    this.pattern = opts.pattern || "";
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
      cache: this.cache,
      schemas: this.schemas,
      reports: this.reports,
    };
  }
}

export class FlagpoleConfig {
  protected configPath: string;
  protected _onSave: Function[] = [];

  public project: ProjectConfig;
  public suites: { [key: string]: SuiteConfig } = {};
  public environments: { [key: string]: EnvConfig } = {};

  public get defaultEnvironment(): EnvConfig | undefined {
    return Object.values(this.environments)[0];
  }

  constructor(opts: iConfigOpts, configPath: string) {
    this.configPath = configPath;
    // Explicit (can be set and show in config file output)
    this.project = new ProjectConfig(this, opts.project);
    if (opts.suites !== undefined) {
      Object.values(opts.suites).forEach((suiteOpts) => {
        this.suites[suiteOpts.name] = new SuiteConfig(this, suiteOpts);
      });
    }
    Object.values(opts.environments).forEach((envOpts) => {
      this.environments[envOpts.name] = new EnvConfig(this, envOpts);
    });
  }

  /**
   * Default; _project_/
   */
  public getConfigFolder(): string {
    return normalizePath(path.dirname(this.configPath));
  }

  /**
   * Default; _project_/flagpole.json
   */
  public getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Default; _project_/tests/
   */
  public getRootFolder(): string {
    return normalizePath(path.join(this.getConfigFolder(), this.project.path));
  }

  /**
   * Default; _project_/tests/out/
   */
  public getTestsFolder(): string {
    return normalizePath(
      path.join(this.getRootFolder(), this.project.output || "")
    );
  }

  /**
   * Default; _project_/tests/src
   */
  public getSourceFolder(): string {
    return normalizePath(
      path.join(this.getRootFolder(), this.project.source || "")
    );
  }

  /**
   * Default; _project_/tests/images
   */
  public getImagesFolder(): string {
    return normalizePath(
      path.join(this.getRootFolder(), this.project.images || "images")
    );
  }

  /**
   * Default; _project_/tests/schemas
   */
  public getSchemasFolder(): string {
    return normalizePath(
      path.join(this.getRootFolder(), this.project.schemas || "schemas")
    );
  }

  /**
   * Default; _project_/tests/cache
   */
  public getCacheFolder(): string {
    return normalizePath(
      path.join(this.getRootFolder(), this.project.cache || "cache")
    );
  }

  /**
   * Default; _project_/tests/reports
   */
  public getReportsFolder(): string {
    return normalizePath(
      path.join(this.getRootFolder(), this.project.reports || "reports")
    );
  }

  public getSuite(suiteName: string): SuiteConfig {
    return this.suites[suiteName];
  }

  public addTagToSuite(suite: string | string[], tag: string) {
    if (typeof suite === "string") {
      this.suites[suite].addTag(tag);
    } else {
      suite.forEach((suiteName: string) => {
        this.suites[suiteName].addTag(tag);
      });
    }
  }

  public addEnvironment(opts: iEnvOpts) {
    if (opts.name?.length) {
      this.environments[opts.name] = new EnvConfig(this, opts);
    }
  }

  public addSuite(opts: iSuiteOpts) {
    if (opts.name?.length) {
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
    const envConfigs: EnvConfig[] = [];
    for (const key in this.environments) {
      envConfigs.push(this.environments[key]);
    }
    return envConfigs;
  }

  public getEnvironmentNames(): string[] {
    const envs: string[] = [];
    for (const key in this.environments) {
      envs.push(this.environments[key].name);
    }
    return envs;
  }

  public getTags(): string[] {
    let tags: string[] = [];
    // Get all tags from config
    for (const key in this.suites) {
      tags = tags.concat(this.suites[key].tags);
    }
    // Uniqueify it
    tags = tags.filter((tag, i) => {
      return tags.indexOf(tag) === i;
    });
    return tags.sort();
  }

  public getSuites(): SuiteConfig[] {
    const suiteConfigs: SuiteConfig[] = [];
    for (const key in this.suites) {
      suiteConfigs.push(this.suites[key]);
    }
    return suiteConfigs;
  }

  public getSuiteNames(): string[] {
    const suiteNames: string[] = [];
    for (const key in this.suites) {
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

  public toFileObject(): iConfigOpts {
    return {
      project: this.project.toJson(),
      environments: (() => {
        const envs: any = {};
        Object.values(this.environments).forEach((env) => {
          envs[env.name] = env.toJson();
        });
        return envs;
      })(),
      suites: (() => {
        const suites: any = {};
        Object.values(this.suites).forEach((suite) => {
          suites[suite.name] = suite.toJson();
        });
        return suites;
      })(),
    };
  }

  public toString(): string {
    return JSON.stringify(this.toFileObject(), null, 2);
  }

  public onSave(callback: Function) {
    this._onSave.push(callback);
  }

  public async save(): Promise<void> {
    await fs.writeFile(this.getConfigPath(), this.toString());
    this._onSave.forEach((callback) => {
      callback();
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
          preserveConstEnums: true,
        },
        include: [`src${path.sep}**${path.sep}*`],
        exclude: ["node_modules", `**${path.sep}*.spec.ts`],
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
      const outFolder = this.getTestsFolder();
      const cwd = process.cwd();
      const rimRafPath = path.resolve(rootFolder, outFolder);
      rimraf(rimRafPath, (err) => {
        if (err) {
          reject(err);
        }

        const command = `cd ${rootFolder} && tsc && cd ${cwd}`;
        exec(command, (err, stdout, stderr) => {
          if (err) {
            reject(stdout || stderr || err);
            return;
          }
          resolve(stdout);
        });
      });
    });
  }
}
