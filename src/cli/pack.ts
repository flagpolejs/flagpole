import { Cli, printHeader, printSubheader } from "./cli-helper";

const fs = require('fs');
const archiver = require('archiver');

export function createZipArchive(zipPath: string, callback?: Function) {
    let zipFile = fs.createWriteStream(zipPath);
    let archive = archiver('zip', {
        zlib: { level: 9 }
    });
    zipFile.on('close', function () {
        if (callback) {
            callback(null, zipPath);
        }
        else {
            Cli.log('Flagpole Zip Archive created.')
            Cli.list([
                'File Path: ' + zipPath,
                'File Size: ' + archive.pointer() + 'bytes',
                'Contents: ' + Cli.configPath + ' and ' + Cli.testsPath
            ]);
            Cli.log('');
            Cli.exit(0);
        }
    });
    archive.on('warning', function (err) {
        if (callback) {
            return callback(err);
        }
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
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
    archive.append(fs.createReadStream(Cli.configPath), { name: 'flagpole.json' });
    archive.directory(Cli.testsPath, Cli.config.testFolderName);
    archive.finalize();
}


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
        createZipArchive(process.cwd() + '/flagpole.zip');
    }

}