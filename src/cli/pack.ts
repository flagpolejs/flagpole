import { Cli, Tests, FlagpoleConfig, printHeader, printSubheader } from "./cli-helper";
import { config } from "rx";

const fs = require('fs');
const archiver = require('archiver');


export function pack() {

    let testsFolder: string = Cli.testsPath;
    let configPath: string = Cli.configPath;

    Cli.hideBanner = true;

    printHeader();
    printSubheader('Pack Project to Zip Archive');

    if (!fs.existsSync(configPath)) {
        Cli.log('Project config not found: ' + configPath);
        Cli.exit(1);
    }
    else if (!Cli.config.isValid()) {
        Cli.log('Project config is not valid: ' + configPath);
        Cli.exit(1);
    }
    else if (!fs.existsSync(testsFolder) || !fs.lstatSync(testsFolder).isDirectory(testsFolder)) {
        Cli.log("Tests folder does not exist: " + testsFolder);
        Cli.exit(1);
    }
    else {
        // Okay we should be good
        let zipPath: string = process.cwd() + '/flagpole.zip';
        let zipFile = fs.createWriteStream(zipPath);
        let archive = archiver('zip', {
            zlib: { level: 9 }
        });
        zipFile.on('end', function () {
            Cli.log('Data has been drained');
            Cli.exit(0);
        });
        zipFile.on('close', function () {
            Cli.log('Flagpole Zip Archive created.')
            Cli.list([
                'File Path: ' + zipPath,
                'File Size: ' + archive.pointer() + 'bytes',
                'Contents: ' + configPath + ' and ' + testsFolder
            ]);
            Cli.log('');
            Cli.exit(0);
        });
        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
            } else {
                // throw error
                throw err;
            }
        });
        archive.on('error', function (err) {
            throw err;
        });
        archive.pipe(zipFile);
        archive.append(fs.createReadStream(configPath), { name: 'flagpole.json' });
        archive.directory(testsFolder, Cli.config.testFolderName);
        archive.finalize();
    }

}