import * as fs from "fs-extra";
import { resolve } from "path";
import { PNG } from "pngjs";
import { toType, ensureFolderExists } from "../util";
import { iAssertionContext } from "../interfaces";
import { FlagpoleExecution } from "../flagpole-execution";
import pixelmatch = require("pixelmatch");

export class ImageCompare {
  private _context: iAssertionContext;
  private _inputImage: PNG | null;
  private _control: any;
  private _controlImage: PNG | null;
  private _autoCreateIfNotExists: boolean;

  constructor(
    context: iAssertionContext,
    input: Buffer | string,
    control: Buffer | string
  ) {
    this._context = context;
    this._autoCreateIfNotExists =
      typeof control === "string" &&
      control.startsWith("@") &&
      control.length > 1;
    this._inputImage = this._getImage(input);
    this._control = control;
    this._controlImage = this._getImage(control);
  }

  public compare(opts: {}): {
    pixelsDifferent: number;
    percentDifferent: number;
    diffPath: string | null;
  } {
    this._createControlImageIfNotExists();
    // We must have an input and control image at this point
    if (this._inputImage === null) {
      throw new Error("Input image is invalid.");
    }
    if (this._controlImage === null) {
      throw new Error("Control image is invalid.");
    }
    // Dimensions must match
    const { width, height } = this._inputImage;
    if (
      width !== this._controlImage.width ||
      height !== this._controlImage.height
    ) {
      throw new Error(
        `Dimensions did not match. ${width}x${height} and ${this._controlImage.width}x${this._controlImage.height}`
      );
    }
    // Now let's do the actual compare
    const diff = new PNG({ width, height });
    const pixelsDifferent: number = pixelmatch(
      this._inputImage.data,
      this._controlImage.data,
      diff.data,
      width,
      height,
      opts
    );
    return {
      pixelsDifferent: pixelsDifferent,
      percentDifferent: (pixelsDifferent / (width * height)) * 100,
      diffPath: pixelsDifferent > 0 ? this._writeDiffFile(diff) : null,
    };
  }

  private _writeDiffFile(diff: PNG): string {
    // Cache folder
    const cacheFolder = this._context.executionOptions.config.getCacheFolder();
    if (!cacheFolder) {
      throw new Error("Flagpole cache folder path not found.");
    }
    ensureFolderExists(cacheFolder);
    // Write file
    const diffFile = resolve(
      cacheFolder,
      `diff.${Date.now()}.${Math.round(Math.random() * 100000)}.png`
    );
    fs.writeFileSync(diffFile, PNG.sync.write(diff));
    return diffFile;
  }

  private _createControlImageIfNotExists() {
    //  If control image was missing, should we auto-create it?
    if (
      this._controlImage === null &&
      this._inputImage !== null &&
      this._autoCreateIfNotExists
    ) {
      // Images folder
      const imagesFolder = FlagpoleExecution.global.config.getImagesFolder();
      if (!imagesFolder) {
        throw "Flagpole image folder path not found.";
      }
      ensureFolderExists(imagesFolder);
      // Write the input image to the control image file
      const imageFilePath = resolve(
        imagesFolder,
        `${this._control.substring(1)}.png`
      );
      fs.ensureFileSync(imageFilePath);
      fs.writeFileSync(imageFilePath, PNG.sync.write(this._inputImage));
      // Set control image to input image, so as not to fail compare if no control.
      this._controlImage = this._inputImage;
    }
  }

  private _getImage(image: any): PNG | null {
    const type = toType(image);
    if (type == "buffer") {
      return PNG.sync.read(image);
    }
    if (
      typeof image === "string" &&
      image.startsWith("@") &&
      image.length > 1
    ) {
      const imagesFolder =
        this._context.executionOptions.config.getImagesFolder();
      fs.ensureDirSync(imagesFolder);
      // Build the image file path
      const imageFilePath = resolve(imagesFolder, `${image.substring(1)}.png`);
      // Does this file exist?
      if (fs.existsSync(imageFilePath)) {
        return PNG.sync.read(fs.readFileSync(imageFilePath));
      }
    }
    if (type == "string") {
      const imageFilePath = resolve(image);
      if (fs.existsSync(imageFilePath)) {
        return PNG.sync.read(fs.readFileSync(imageFilePath));
      }
    }
    return null;
  }
}
