"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const fs = require('fs');
function path() {
    if (fs.existsSync(cli_helper_1.Cli.rootPath)) {
        let stats = fs.lstatSync(cli_helper_1.Cli.rootPath);
        if (!stats.isDirectory()) {
            cli_helper_1.Cli.log("The path you specified is not a directory.");
            cli_helper_1.Cli.exit(1);
        }
    }
    else {
        cli_helper_1.Cli.log("The path you specified did not exist.");
        cli_helper_1.Cli.exit(1);
    }
}
exports.path = path;
