"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const fs = require('fs');
const archiver = require('archiver');
function pack() {
    let testsFolder = cli_helper_1.Cli.testsPath;
    let configPath = cli_helper_1.Cli.configPath;
    cli_helper_1.Cli.hideBanner = true;
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('Pack Project to Zip Archive');
    if (!fs.existsSync(configPath)) {
        cli_helper_1.Cli.log('Project config not found: ' + configPath);
        cli_helper_1.Cli.exit(1);
    }
    else if (!cli_helper_1.Cli.config.isValid()) {
        cli_helper_1.Cli.log('Project config is not valid: ' + configPath);
        cli_helper_1.Cli.exit(1);
    }
    else if (!fs.existsSync(testsFolder) || !fs.lstatSync(testsFolder).isDirectory(testsFolder)) {
        cli_helper_1.Cli.log("Tests folder does not exist: " + testsFolder);
        cli_helper_1.Cli.exit(1);
    }
    else {
        let zipPath = process.cwd() + '/flagpole.zip';
        let zipFile = fs.createWriteStream(zipPath);
        let archive = archiver('zip', {
            zlib: { level: 9 }
        });
        zipFile.on('end', function () {
            cli_helper_1.Cli.log('Data has been drained');
            cli_helper_1.Cli.exit(0);
        });
        zipFile.on('close', function () {
            cli_helper_1.Cli.log('Flagpole Zip Archive created.');
            cli_helper_1.Cli.list([
                'File Path: ' + zipPath,
                'File Size: ' + archive.pointer() + 'bytes',
                'Contents: ' + configPath + ' and ' + testsFolder
            ]);
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(0);
        });
        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
            }
            else {
                throw err;
            }
        });
        archive.on('error', function (err) {
            throw err;
        });
        archive.pipe(zipFile);
        archive.append(fs.createReadStream(configPath), { name: 'flagpole.json' });
        archive.directory(testsFolder, cli_helper_1.Cli.config.testFolderName);
        archive.finalize();
    }
}
exports.pack = pack;
