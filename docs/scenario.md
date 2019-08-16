# Scenario

A scenario is a collection of tests. It is a child of a Suite.

## Methods

[ working on it ]

## Properties 

### executionDuration: number | null

The total time between when the Scenario was started executing and when it finished running. Null if it has not yet completed.

### hasFailed: boolean

Did this Suite (or any of its Scenarios) fail? If the Suite is not yet completed (or hasn't started yet) this will be false, unless any Scenario has already failed.

suite.hasFailed

### hasPassed: boolean

Did this Suite (and all of its Scenarios) complete and all were passing?

suite.hasPassed

### responseDuration: number | null

The total time between when the Scenario's request went out and when the response back back. Null if it the request has not yet returned a response.

### responseType: ResponseType (readonly, enum)

The type of Scenario this is, the type of request we'll make and the response we'll expect back.

*Possible Values: html, json, image, stylesheet, script, video, audio, resource, browser, extjs*

### title: string

Title of the Scenario as it will be printed on reports.

### totalDuration: number | null

The total time between when the Scenario was initialized and when it finished running. Null if it has not yet completed.
