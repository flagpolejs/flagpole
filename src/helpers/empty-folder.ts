import { ensureFolderExists } from "./ensure-folder-exists";
import * as fs from "fs";
import * as path from "path";

export function emptyFolder(folderPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    folderPath = path.resolve(folderPath);
    ensureFolderExists(folderPath);
    fs.readdir(folderPath, (err, files) => {
      if (err) reject(err);
      const promises: Promise<any>[] = [];
      for (const file of files) {
        promises.push(fs.promises.unlink(path.join(folderPath, file)));
      }
      Promise.all(promises)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}
