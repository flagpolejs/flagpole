# AppiumResponse

This class is specific to Appium testing. To use it with TypeScript, first import AppiumResponse into the Flagpole testing file, like so:

```typescript
import flagpole, { AppiumResponse } from "flagpole";
```

To work with the AppiumResponse in TypeScript, instantiate it from `context.response` like so:

```typescript
const response = context.response as AppiumResponse;
```

## Properties

### sessionId: string

The string value of the current Appium session's ID.

```typescript
context.comment(response.sessionId);
```

### capabilities: any

JSON object containing the current Appium session's settings, which are called "capabilities".

```typescript
context.comment(response.capabilities);
const automationName = response.capabilities.automationName;
```

## Methods

### getGeolocation(): Promise \<any\>

Get device geolocation

```typescript
const response = context.response as AppiumResponse;
const geolocation = await response.getGeolocation();
```

### touchMove(...matrices: [x: number, y: number, duration?: number][] | [x: number, y: number, duration?: number][][]): Promise\<void\>

Send a touch interaction to a specific, onscreen x-y coordinate. The optional duration index specifies how many milliseconds to hold the touch interaction.

```typescript
await touchMove([500, 500, 1000]);
```

Can pass an array of multiple arrays of tuples to send multiple touch interactions at once.

```typescript
await touchMove([[500, 500, 1000], [100, 100, 1000]]);
```

Can also send a touch interaction to specific, onscreen x-y coordinates followed by an arbitrary number of movement interactions. 

The optional duration index in the first tuple specifies how many milliseconds to hold the initial touch interaction.

Each subsequent tuple passed into this method represents the number of pixels to move along each axis from the previous touch point. So if the inital touch point was `[500, 500]` and the next tuple has `[-250, -125]`, the finger will stop at `[250, 375]`. If an additonal tuple is passed with `[-100, 0]`, the finger will stop at `[150, 375]`.

```typescript
await response.touchMove([500, 500], [-250, -125], [-100, 0]);
```

Each tuple passed has the option of passing a 3rd index containing a duration. For each tuple beyond the first, that duration represents the number of milliseconds taken to execute a move interaction. The default is 500 milliseconds.

```typescript
await response.touchMove([500, 500], [-250, -125, 1000], [-100, 0, 700]);
```

The finger is immediately lifted from the screen upon reaching the last set of x-y coordinates.

It is also possible to send multiple touch and move actions at the same time, by passing multiple arrays of arrays of tuples.

```typescript
await response.touchMove([[500, 500], [-250, -125, 1000], [-100, 0, 700]], [[100, 100], [300, 300, 1000], [50, 0, 700]]);
```

There is no limit to the number of simultaneous touch actions that can be performed. Likewise, there is no limit to the number of subsequent touch actions that can be performed.
