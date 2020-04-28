import * as fs from "fs-extra";
import {
  FlagpoleConfig,
  iConfigOpts,
  EnvConfig,
  getDefaultConfig,
} from "./cli/config";
import {
  FlagpoleOptions,
  iFlagpoleOptions,
  VERBOSITY_SILENT,
} from "./flagpoleoptions";

/**
 * Contains information about the current exeuction of Flagpole
 */
export class FlagpoleExecution {
  /**
   * STATIC OPTIONS
   */

  public static async create(
    opts: iFlagpoleOptions
  ): Promise<FlagpoleExecution> {
    const configOptions = opts.configFilePath
      ? await FlagpoleExecution.loadOptsFromConfigFile(opts.configFilePath)
      : undefined;
    const defaultEnv = configOptions?.environments
      ? Object.values(configOptions?.environments)[0]
      : undefined;
    opts.environmentName = opts.environmentName || defaultEnv?.name;
    opts.baseDomain = opts.baseDomain || defaultEnv?.defaultDomain;
    return new FlagpoleExecution(
      new FlagpoleOptions(opts),
      configOptions && opts.configFilePath
        ? new FlagpoleConfig(configOptions, opts.configFilePath)
        : undefined
    );
  }

  public static async setGlobalExecutionScope(
    opts: iFlagpoleOptions
  ): Promise<FlagpoleExecution> {
    FlagpoleExecution._globalSingleton = await FlagpoleExecution.create(opts);
    return FlagpoleExecution._globalSingleton;
  }

  public static get automaticallyPrintToConsole(): boolean {
    return this.opts.automaticallyPrintToConsole;
  }

  public static get global(): FlagpoleExecution {
    return FlagpoleExecution._globalSingleton;
  }

  public static get config(): FlagpoleConfig | undefined {
    return FlagpoleExecution.global.config;
  }

  public static get opts(): FlagpoleOptions {
    return FlagpoleExecution.global._opts;
  }

  public static get baseDomain(): string | undefined {
    return (
      FlagpoleExecution.opts.baseDomain ||
      FlagpoleExecution.environment?.defaultDomain
    );
  }

  public static get environment(): EnvConfig | undefined {
    return this.config?.environments[FlagpoleExecution.environmentName];
  }

  public static get environmentName(): string {
    // Use commandline if we got it
    if (FlagpoleExecution.opts.environmentName) {
      return FlagpoleExecution.opts.environmentName;
    }
    // Otherwise use the first env from config
    if (FlagpoleExecution.config) {
      const envs = Object.keys(FlagpoleExecution.config.environments);
      if (envs.length > 0) {
        return envs[0];
      }
    }
    // Lastly return dev as final fallback
    return "dev";
  }

  private static _globalSingleton: FlagpoleExecution = new FlagpoleExecution(
    FlagpoleOptions.createWithArgs(process.argv)
  );

  private static async loadOptsFromConfigFile(
    configFilePath: string
  ): Promise<iConfigOpts> {
    // Read file
    const configContent: string = await fs.readFile(configFilePath, "utf8");
    // Parse JSON from the file, or catch it to return default
    const defaultConfig = getDefaultConfig(configFilePath);
    const configData: iConfigOpts = JSON.parse(configContent);
    // Assemble our output
    return {
      project: {
        ...defaultConfig.project,
        ...configData.project,
      },
      environments: {
        ...defaultConfig.environments,
        ...configData.environments,
      },
      suites: configData.suites ? configData.suites : defaultConfig.suites,
    };
  }
  /**
   * INSTANCE OPTIONS
   */

  private _opts: FlagpoleOptions;
  private _config: FlagpoleConfig | undefined;

  public get opts(): FlagpoleOptions {
    return this._opts;
  }

  public get config(): FlagpoleConfig | undefined {
    return this._config;
  }

  private constructor(opts: FlagpoleOptions, config?: FlagpoleConfig) {
    this._opts = opts;
    this._config = config;
  }
}
