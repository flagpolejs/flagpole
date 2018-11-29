"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const fs = require('fs');
const archiver = require('archiver');
function createZipArchive(zipPath, callback) {
    let zipFile = fs.createWriteStream(zipPath);
    let archive = archiver('zip', {
        zlib: { level: 9 }
    });
    zipFile.on('close', function () {
        if (callback) {
            callback(null, zipPath);
        }
        else {
            cli_helper_1.Cli.log('Flagpole Zip Archive created.');
            cli_helper_1.Cli.list([
                'File Path: ' + zipPath,
                'File Size: ' + archive.pointer() + 'bytes',
                'Contents: ' + cli_helper_1.Cli.configPath + ' and ' + cli_helper_1.Cli.testsPath
            ]);
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(0);
        }
    });
    archive.on('warning', function (err) {
        if (callback) {
            return callback(err);
        }
        if (err.code === 'ENOENT') {
        }
        else {
            throw err;
        }
    });
    archive.on('error', function (err) {
        if (callback) {
            return callback(err);
        }
        throw err;
    });
    archive.pipe(zipFile);
    archive.append(fs.createReadStream(cli_helper_1.Cli.configPath), { name: 'flagpole.json' });
    archive.directory(cli_helper_1.Cli.testsPath, cli_helper_1.Cli.config.testFolderName);
    archive.finalize();
}
exports.createZipArchive = createZipArchive;
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
        createZipArchive(process.cwd() + '/flagpole.zip');
    }
}
exports.pack = pack;
