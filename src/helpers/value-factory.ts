import { iAssertionContext } from "../interfaces/iassertioncontext";
import { ValuePromise } from "../value-promise";
import { iValue } from "../interfaces/ivalue";
import { ValueOptions } from "../interfaces/value-options";
import { Value } from "../value";

interface ValueConstructor<DataType, Wrapper extends iValue<DataType>> {
  new (data: DataType, context: iAssertionContext, opts: ValueOptions): Wrapper;
}

export class StandardValueFactory {
  constructor(private context: iAssertionContext) {}

  public create<DataType>(data: DataType, name: string): Value<DataType>;
  public create<DataType>(data: DataType, opts?: ValueOptions): Value<DataType>;
  public create<DataType>(
    data: DataType,
    opts: ValueOptions | string = {}
  ): Value<DataType> {
    if (typeof opts == "string") opts = { name: opts };
    return createStandardValue(data, this.context, opts);
  }

  public createPromise<DataType>(
    data: DataType,
    opts: ValueOptions = {}
  ): ValuePromise<DataType> {
    return createValuePromise(data, this.context, opts);
  }

  public awaitPromise<DataType>(
    promise: Promise<DataType>,
    opts: ValueOptions = {}
  ): ValuePromise<DataType> {
    return awaitValuePromise(promise, this.context, opts);
  }

  public createNull(name: string): Value<null>;
  public createNull(opts?: ValueOptions): Value<null>;
  public createNull(opts: string | ValueOptions = {}) {
    if (typeof opts == "string") opts = { name: opts };
    return createStandardValue(null, this.context, opts);
  }
}

export const createValue = <Wrapper extends iValue<DataType>, DataType>(
  wrapperClass: ValueConstructor<DataType, Wrapper>,
  data: DataType,
  context: iAssertionContext,
  opts: ValueOptions
): Wrapper => {
  return new wrapperClass(data, context, opts);
};

export const createStandardValue = <T>(
  data: T,
  context: iAssertionContext,
  opts: ValueOptions
) => {
  return createValue(Value, data, context, opts);
};

export const createNullValue = (
  context: iAssertionContext,
  opts: ValueOptions
) => {
  return createValue(Value, null, context, opts);
};

export const createValuePromise = <T>(
  data: T,
  context: iAssertionContext,
  opts: ValueOptions
): ValuePromise<T> => {
  return ValuePromise.wrap(createStandardValue(data, context, opts));
};

export const awaitValuePromise = <T>(
  data: Promise<T>,
  context: iAssertionContext,
  opts: ValueOptions
): ValuePromise<T> => {
  return ValuePromise.execute(async () =>
    createStandardValue(await data, context, opts)
  );
};
