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

