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

### touchMove(array: [x: number, y: number, duration?: number]): Promise\<void\>

Send a touch interaction to a specific, onscreen x-y coordinate. The optional duration index specifies how many milliseconds to hold the touch interaction.

```typescript
await touchMove([500, 500, 1000]);
```

This supports only 1-finger touch interactions.

### touchMove(array: [x: number, y: number, duration?: number], ...otherMoves: [x: number, y: number, duration?: number][]): Promise\<void\>

Send a touch interaction to a specific, onscreen x-y coordinate followed by an arbitrary number of movement interactions. 

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

This supports only 1-finger touch and move interactions.
