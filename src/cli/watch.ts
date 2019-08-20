import { run } from './run';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto')

interface iFileWatcher {
    contentMd5: string | null,
    fileWait: any
}

const files: { [filename: string]: iFileWatcher } = {};

const hash = (input: string): string => {
    return crypto.createHash('md5').update(input).digest("hex");
}

let fsWait: any = null;
let changeCount: number = 0;

export const watch = (suiteNames: string[], tag: string) => {
    const packageJson = require(`${process.cwd()}/package.json`);
    const entryPoint = packageJson.main;
    const distFolder = path.dirname(entryPoint);
    
    console.log(`Watching for updates to: ${distFolder}`);

    fs.watch(distFolder, { recursive: true }, (eventType: string, fileName: string) => {
        if (fileName) {
            // Create this file in our watcher list if not yet there
            if (typeof files[fileName] == 'undefined') {
                files[fileName] = {
                    contentMd5: null,
                    fileWait: null
                };
            }
            // If we are waiting, ignore this
            if (files[fileName].fileWait !== null) {
                return;
            }
            // Set up a wait now to debounce
            files[fileName].fileWait = setTimeout(() => {
                files[fileName].fileWait = null;
            }, 100);
            // If this file hasn't changed, ignore this update
            const md5Current = hash(fs.readFileSync(`${distFolder}/${fileName}`));
            if (md5Current === files[fileName].contentMd5) {
                return;
            }
            // Remember this update for next time
            files[fileName].contentMd5 = md5Current;
            // Overall wait for all files
            changeCount++;
            if (fsWait !== null) {
                return;
            }
            // Wait how long
            fsWait = setTimeout(() => {
                changeCount = 0;
                fsWait = null;
                console.log(`${changeCount} files changed. Running tests...`);
                run(suiteNames, tag);
            }, 1000);
        }
    });

}