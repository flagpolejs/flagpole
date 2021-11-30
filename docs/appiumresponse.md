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

### backgroundApp(seconds: number = -1): Promise\<void\>;

Sends the application under test to the background. If a duration is specified which is greater than -1, it will background the app for that many seconds. This is an async function.

### getAppiumContexts(): Promise\<string[]\>;

Gets the automation contexts for a given page. On most pages, only one will exist, which is NATIVE_APP. On pages with webviews, the first index will be NATIVE_APP and the last index will be the Webview context.
It is necessary to use the Webview context for finding Webview elements. This is an async function.

### getGeolocation(): Promise \<any\>

Get device geolocation

```typescript
const response = context.response as AppiumResponse;
const geolocation = await response.getGeolocation();
```

### getDeviceProperties(): Promise\<DeviceProperties\>;

Gets geolocation and network settings. Leverages adb on Android, so make sure to run Appium with either the `--relaxed-security`, or better yet `--allow-insecure adb_shell` arguments. Leverages Siri on iOS. This is an async function.

### getSource(): Promise\<string\>;

Gets XML source of current viewport. This can be useful when scrolling to look for a specific element. This is an async function.

### goBack(): Promise\<void\>;

Goes back one page. This is an async function.

### isAppInstalled(bundleId: string): Promise\<boolean\>;

Checks if app specified by bundleId argument is installed on the device under test. This is an async function.

### launchApp(app?: string, args?: string[], environment?: any): Promise\<void\>;

On Android, launches application under test. On iOS, launches app specified by app argument. Other arguments are available on iOS as well; the args argument is an array of command line arguments passed to the chosen app, and environment is an object containing key/value pairs which represent environment variables. This is an async function.

### resetApp(): Promise\<void\>;

Resets application under test. This is an async function.

### setAppiumContext(appiumContext: string): Promise\<void\>;

Sets the automation context. It is necessary to set the context to the Webview context when finding Webview elements. This is an async function.

### setDeviceProperties(devProperties: DeviceProperties): Promise\<void\>;

Sets geolocation and/or network settings. All settings are optional, but you have to specify at least latitude and longitude when setting geolocation. Leverages adb on Android, so make sure to run Appium with either the `--relaxed-security`, or better yet `--allow-insecure adb_shell` arguments. Leverages Siri on iOS.

```typescript
await setDeviceProperties(
  location: {
    latitude: 121.21,
    longitude: 11.56,
    altitude: 94.23
  },
  network: {
    wifi: true,
    mobileData: true,
    locationServices: true,
    airplaneMode: false
  }
)
```

On Android, setting airplane mode isn't truly setting airplane mode, since it's not allowed to broadcast the intent without root privileges. Instead, setting airplane mode will disable Wi-Fi and mobile data, while turning the icon for airplane mode on. Note that this overrides wifi and mobileData settings.

### terminateApp(app: string, timeout?: number): Promise<void | boolean>;

Terminates the specified app. On Android, you can pass in a timeout value for when to retry terminating the app. On iOS, returns whether or not the app was successfully terminated. This is an async function.

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
