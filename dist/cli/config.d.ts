export declare class EnvConfig {
    protected config: FlagpoleConfig;
    name: string;
    defaultDomain: string;
    constructor(config: FlagpoleConfig, opts: any);
}
export declare class SuiteConfig {
    protected config: FlagpoleConfig;
    id: string;
    name: string;
    constructor(config: FlagpoleConfig, opts: any);
    getPath(): string;
}
export declare class ProjectConfig {
    protected config: FlagpoleConfig;
    id: string;
    name: string;
    path: string;
    constructor(config: FlagpoleConfig, opts: any);
    hasId(): boolean;
    toJson(): {
        id: string;
        name: string;
        path: string;
    };
}
export declare class FlagpoleConfig {
    protected configPath: string;
    project: ProjectConfig;
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
    save(): Promise<any>;
}
