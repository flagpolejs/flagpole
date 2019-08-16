# GenericResponse

This is actually an abtract class, which is extended by the specific response object of each scenario type. But there are a number of common properties and methods.

## Methods

### cookie(key: string): Value

Select a specific cookie by key. Will return a Value object with the Cookie object inside.

```javascript
this.assert(this.response.cookie("jwt_token")).exists();
```

### header(key: string): Value

Select a specific header by key value.

```javascript
this.assert(this.response.header("content-type")).contains('html');
```

## Properties

### body: Value 

The string value of the raw HTTP response body.

```javascript
this.assert(response.body).contains('flosports');
```

### cookies: Value 

Value object containing an array of all the cookies.


### finalUrl: Value 

The string value of the final URL of the response, after any redirects.

```javascript
this.assert(response.finalUrl).contains('google.com');
```

### headers: Value 

Value object containing the key-value pair of all the response headers.

```javascript
this.assert(this.response.headers).contains('session');
```

### jsonBody: Value 

The JSON body of the response. If the response body was not in a valid JSON format this will be a null value.

```javascript
this.assert(response.jsonBody).not.equals(null);
```

### length: Value 

The numeric value of the length of the HTTP Response body.

```javascript
this.assert(response.length).greaterThan(0);
```

### loadTime: Value 

The numeric value of the time in millseconds that it took between when the request was made and when the response came back.

```javascript
this.assert(response.loadTime).lessThan(1000);
```

### statusCode: Value 

The numeric value of the HTTP Status Code of the Response.

```javascript
this.assert(response.statusCode).equals(200);
```

### statusMessage: Value 

The string value of the HTTP Status Message of the Response.

```javascript
this.assert(response.statusMessage).like('OK');
```

### url: Value 

The string value of the requested URL of the Scenario.

```javascript
this.assert(response.url).contains('google.com');
```