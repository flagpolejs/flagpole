import { Flagpole } from "./flagpole";

// Process command line inputs
let lastArg: string | null = null;
let env: string | null = null;
process.argv.forEach(function (arg) {
    if (lastArg == '-e') {
        env = arg;
        Flagpole.environment = env;
    }
    lastArg = arg;
});

export {
    Flagpole
};
