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
    return new Promise((r) => this.then((v) => r(v.is)));
  }

  public get not(): Promise<iAssertion> {
    return new Promise((r) => this.then((v) => r(v.assert().not)));
  }

  public equals(eqValue: any): Promise<iAssertion> {
    return new Promise((r) => this.then((v) => r(v.assert().equals(eqValue))));
  }

  public assert(message: string): Promise<iAssertion> {
    return new Promise((r) => this.then((v) => r(v.assert(message))));
  }

  public exists(): Promise<iValue> {
    return new Promise((r) => this.then((v) => r(v.exists())));
  }
}
