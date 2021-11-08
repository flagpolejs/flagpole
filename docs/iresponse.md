# iResponse

This interface is implemented by the specific response object of each scenario type.

## Properties

### body: iValue

The string value of the raw HTTP response body.

```javascript
context.assert(context.response.body).contains("flosports");
```

### context: iAssertionContext

Get the assertion context for this response.

### cookies: iValue

Value object containing an array of all the cookies.

### finalUrl: iValue

The string value of the final URL of the response, after any redirects. It will be a full URL with HTTP scheme, host, path, and query string.

```javascript
context.assert(context.response.finalUrl).contains("google.com");
```

### headers: iValue

Value object containing the key-value pair of all the response headers.

```javascript
context.assert(context.response.headers).contains("session");
```

### jsonBody: iValue

The JSON body of the response. If the response body was not in a valid JSON format this will be a null value.

```javascript
context.assert(context.response.jsonBody).not.equals(null);
```

### length: iValue

The numeric value of the length of the HTTP Response body.

```javascript
context.assert(context.response.length).greaterThan(0);
```

### loadTime: iValue

The numeric value of the time in millseconds that it took between when the request was made and when the response came back.

```javascript
context.assert(context.response.loadTime).lessThan(1000);
```

### redirectCount: iValue

The numeric value of how many redirects were followed.

```javascript
context.assert(context.response.redirectCount).lessThan(10);
```

### responseType: string

Get the type of response this is, such as: html, browser, extjs, json, xml, rss, image, etc.

### scenario: iScenario

Reference to the scenario that created this response.

### statusCode: iValue

The numeric value of the HTTP Status Code of the Response.

```javascript
context.assert(context.response.statusCode).equals(200);
```

### statusMessage: iValue

The string value of the HTTP Status Message of the Response.

```javascript
context.assert(context.response.statusMessage).like("OK");
```

### url: iValue

The string value of the requested URL of the Scenario.

```javascript
context.assert(context.response.url).contains("google.com");
```

## Methods

### cookie(key: string): Value

Select a specific cookie by key. Will return a Value object with the Cookie object inside.

```javascript
context.assert(context.response.cookie("jwt_token")).exists();
```

### header(key: string): Value

Select a specific header by key value.

```javascript
context.assert(context.response.header("content-type")).contains("html");
```
