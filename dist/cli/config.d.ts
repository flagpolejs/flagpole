export declare class EnvConfig {
    protected config: FlagpoleConfig;
    name: string;
    constructor(config: FlagpoleConfig, opts: any);
}
export declare class SuiteConfig {
    protected config: FlagpoleConfig;
    name: string;
    constructor(config: FlagpoleConfig, opts: any);
    getPath(): string;
}
export declare class FlagpoleConfig {
    protected configPath: string;
    projectName: string;
    testFolderName: string;
    suites: {
        [key: string]: SuiteConfig;
    };
    environments: {
        [key: string]: EnvConfig;
    };
    constructor(configData?: any);
    getConfigFolder(): string;
    getConfigPath(): string;
    getTestsFolder(): string;
    addEnvironment(name: string, opts?: {}): void;
    addSuite(name: string, opts?: {}): void;
    removeEnvironment(name: string): void;
    removeSuite(name: string): void;
    getEnvironments(): EnvConfig[];
    getEnvironmentNames(): string[];
    getSuites(): SuiteConfig[];
    getSuiteNames(): string[];
    isValid(): boolean;
    toString(): string;
}
