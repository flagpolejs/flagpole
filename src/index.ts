import { Flagpole } from "./flagpole";

// Process command line inputs
let lastArg: string | null = null;
let env: string | null = null;
process.argv.forEach(function (arg: string) {
    if (lastArg == '-e') {
        env = arg;
        Flagpole.setEnvironment(env);
    }
    else if (lastArg == '-o') {
        Flagpole.setOutput(arg);
        Flagpole.automaticallyPrintToConsole = true;
    }
    else if (arg == '-q') {
        Flagpole.quietMode = true;
        lastArg = null;
        return;
    }
    else if (arg == '-l') {
        Flagpole.logOutput = true;
        lastArg = null;
        return;
    }
    else if (arg == '-x') {
        Flagpole.exitOnDone = true;
        lastArg = null;
        return;
    }
    lastArg = arg;
});

export {
    Flagpole
};
