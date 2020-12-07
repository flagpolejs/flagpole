import { iResponse, iValue } from "../interfaces";
import { wrapAsValue } from "../helpers";
import { ValuePromise } from "../value-promise";

export class JsonDoc {
  public jPath: iJPath | undefined;

  public get root(): any {
    return this.jsonRoot;
  }

  constructor(public jsonRoot: any, protected _useSimple: boolean = false) {}

  public search = async (path: string) => {
    await this._loadJmesPath();
    if (typeof this.jPath == "undefined") {
      throw new Error("Could not load jmespath");
    }
    try {
      return this.jPath.search(this.jsonRoot, path);
    } catch (ex) {
      return undefined;
    }
  };

  protected _loadJmesPath = async (): Promise<any> => {
    // We haven't tried to load query engines yet
    if (typeof this.jPath == "undefined") {
      // Just use simple
      if (this._useSimple) {
        this.jPath = new jPath();
        return this.jPath;
      }
      // Try importing jmespath
      return (
        import("jmespath")
          // Got it, so save it and return it
          .then((jpath) => {
            this.jPath = jpath;
            return this.jPath;
          })
          // Couldn't load jmespath, so set it to null
          .catch((e) => {
            this.jPath = new jPath();
            return this.jPath;
          })
      );
    } else {
      return this.jPath;
    }
  };
}

export interface JPathProvider {
  jsonDoc: JsonDoc | undefined;
}

export const jpathFindAll = async (
  self: JPathProvider & iResponse,
  path: string
): Promise<iValue[]> => {
  const item = await self.find(path);
  return [item];
};

export const jpathFind = (
  self: JPathProvider & iResponse,
  path: string
): ValuePromise => {
  return ValuePromise.execute(async () => {
    if (self.jsonDoc === undefined) {
      throw Error("No JSON document is defined.");
    }
    const selection = await self.jsonDoc.search(path);
    return wrapAsValue(self.context, selection, path, selection);
  });
};

export interface iJPath {
  search(searchIn: any, path: string): Promise<any>;
}
/**
 * Simple JSON querying
 */
export class jPath implements iJPath {
  public static search(searchIn: any, path: string) {
    const selectPath: string[] = jPath._getSelectPath(path);
    // Start searching on either the find in json or the root json
    let selection: any = searchIn || {};
    // If we find a value that matches all
    selectPath.every((part: string) => {
      selection = selection[part];
      return typeof selection !== "undefined";
    });
    return selection;
  }

  private static _getSelectPath(path: string): string[] {
    // Replace [ and ] and space with .
    path = path.replace(/[\[\] ]/g, ".");
    // Remove quotes
    path = path.replace(/['"]/g, "");
    // Fix the situation where ]. will create .. (remove any cases of multiple dots)
    path = path.replace(/\.{2,}/g, ".");
    // Get array of each part
    return path.split(".");
  }

  public search(searchIn: any, path: string): Promise<any> {
    return jPath.search(searchIn, path);
  }
}
