import { ValuePromise } from "../value-promise";
import { iValue } from "../interfaces/ivalue";
import { ValueOptions } from "../interfaces/value-options";
import { Value } from "../value";
import { AssertionContext } from "../assertion/assertion-context";

interface ValueConstructor<DataType, Wrapper extends iValue<DataType>> {
  new (data: DataType, context: AssertionContext, opts: ValueOptions): Wrapper;
}

export class ValueFactory {
  constructor(private context: AssertionContext) {}

  public create<InputType>(data: InputType, name: string): Value<InputType>;
  public create<InputType>(
    data: InputType,
    opts: ValueOptions
  ): Value<InputType>;
  public create<InputType, Wrapper extends Value<InputType>>(
    data: InputType,
    name: string,
    wrapperClass: ValueConstructor<InputType, Wrapper>
  ): Wrapper;
  public create<InputType, Wrapper extends Value<InputType>>(
    data: InputType,
    opts: ValueOptions,
    wrapperClass: ValueConstructor<InputType, Wrapper>
  ): Wrapper;
  public create<InputType, Wrapper extends Value<InputType>>(
    data: InputType,
    opts: ValueOptions | string,
    wrapperClass?: ValueConstructor<InputType, Wrapper>
  ) {
    if (typeof opts == "string") opts = { name: opts };
    return wrapperClass
      ? new wrapperClass(data, this.context, opts)
      : new Value(data, this.context, opts);
  }

  public createPromise<InputType>(
    data: InputType,
    name: string
  ): ValuePromise<InputType, Value>;
  public createPromise<InputType>(
    data: InputType,
    opts: ValueOptions
  ): ValuePromise<InputType, Value>;
  public createPromise<InputType, Wrapper extends Value<InputType>>(
    data: InputType,
    opts: ValueOptions,
    wrapperClass: ValueConstructor<InputType, Wrapper>
  ): ValuePromise<InputType, Wrapper>;
  public createPromise<InputType, Wrapper extends Value<InputType>>(
    data: InputType,
    name: string,
    wrapperClass: ValueConstructor<InputType, Wrapper>
  ): ValuePromise<InputType, Wrapper>;
  public createPromise<InputType, Wrapper extends Value<InputType>>(
    data: InputType,
    opts: ValueOptions | string,
    wrapperClass?: ValueConstructor<InputType, Wrapper>
  ) {
    if (typeof opts == "string") opts = { name: opts };
    return ValuePromise.wrap(
      wrapperClass
        ? this.create(data, opts, wrapperClass)
        : this.create(data, opts)
    );
  }

  public awaitPromise<InputType>(
    dataPromise: Promise<InputType>,
    name: string
  ): ValuePromise<InputType, Value>;
  public awaitPromise<InputType>(
    dataPromise: Promise<InputType>,
    opts: ValueOptions
  ): ValuePromise<InputType, Value>;
  public awaitPromise<InputType, Wrapper extends Value<InputType>>(
    dataPromise: Promise<InputType>,
    opts: ValueOptions,
    wrapperClass: ValueConstructor<InputType, Wrapper>
  ): ValuePromise<InputType, Wrapper>;
  public awaitPromise<InputType, Wrapper extends Value<InputType>>(
    dataPromise: Promise<InputType>,
    name: string,
    wrapperClass: ValueConstructor<InputType, Wrapper>
  ): ValuePromise<InputType, Wrapper>;
  public awaitPromise<InputType, Wrapper extends Value<InputType>>(
    dataPromise: Promise<InputType>,
    optsOrName: ValueOptions | string,
    wrapperClass?: ValueConstructor<InputType, Wrapper>
  ) {
    const opts =
      typeof optsOrName == "string" ? { name: optsOrName } : optsOrName;
    if (wrapperClass) {
      return ValuePromise.execute<InputType, Wrapper>(async () => {
        return this.create<InputType, Wrapper>(
          await dataPromise,
          opts,
          wrapperClass
        );
      });
    }
    return ValuePromise.execute<InputType, Value>(async () => {
      return this.create(await dataPromise, opts);
    });
  }

  public createNull(name: string): Value<null>;
  public createNull(opts: ValueOptions): Value<null>;
  public createNull<Wrapper extends Value<null>>(
    name: string,
    wrapperClass: ValueConstructor<null, Wrapper>
  ): Wrapper;
  public createNull<Wrapper extends Value<null>>(
    opts: ValueOptions,
    wrapperClass: ValueConstructor<null, Wrapper>
  ): Wrapper;
  public createNull<Wrapper extends Value<null>>(
    opts: ValueOptions | string,
    wrapperClass?: ValueConstructor<null, Wrapper>
  ) {
    if (typeof opts == "string") opts = { name: opts };
    return wrapperClass
      ? this.create(null, opts, wrapperClass)
      : this.create(null, opts);
  }
}
