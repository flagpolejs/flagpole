import { iAssertion, iAssertionIs, iValue } from "./interfaces";

export class ValuePromise
  extends Promise<iValue>
  implements PromiseLike<iValue> {
  public static execute(func: () => Promise<iValue>) {
    return ValuePromise.create(func());
  }

  public static create(val: iValue | Promise<iValue>) {
    return new ValuePromise(async (resolve, reject) => {
      try {
        const value = await val;
        resolve(value);
      } catch (ex) {
        reject(ex);
      }
    });
  }

  private constructor(
    executor: (
      resolve: (value?: iValue | PromiseLike<iValue>) => void,
      reject: (reason?: any) => void
    ) => void
  ) {
    super(executor);
  }

  public get is(): Promise<iAssertionIs> {
    //return new Promise((r) => this.then((v) => r(v.is)));
    return this._promisifyProperty("is");
  }

  public get not(): Promise<iAssertion> {
    //return new Promise((r) => this.then((v) => r(v.assert().not)));
    return this._promisifyAssertProperty("is");
  }

  public equals(eqValue: any): Promise<iAssertion> {
    //return new Promise((r) => this.then((v) => r(v.assert().equals(eqValue))));
    return this._promisifyAssertMethod("equals", [eqValue]);
  }

  public assert(message: string): Promise<iAssertion> {
    return this._promisifyMethod("assert", [message]);
  }

  public exists(): Promise<iValue> {
    return this._promisifyMethod("exists");
  }

  private _promisifyAssertMethod<T>(
    method: string,
    args: any[] = []
  ): Promise<T> {
    return new Promise((r) =>
      this.then((v) => r(v.assert()[method].apply(v, args)))
    );
  }

  private _promisifyAssertProperty<T>(property: string): Promise<T> {
    return new Promise((r) => this.then((v) => r(v.assert()[property])));
  }

  private _promisifyMethod<T>(method: string, args: any[] = []): Promise<T> {
    return new Promise((r) => this.then((v) => r(v[method].apply(v, args))));
  }

  private _promisifyProperty<T>(property: string): Promise<T> {
    return new Promise((r) => this.then((v) => r(v[property])));
  }
}
