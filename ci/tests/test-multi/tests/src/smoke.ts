import flagpole from '../../../../../dist/index.js'

const main = flagpole("Smoke")

main.scenario('Check todos', 'json')
.open('/users')
.setMethod('get')
.next(async (context) => {
  context.assert(context.response.statusCode).equals(200)
  context.assert(context.response.jsonBody.$.length).equals(10)
})
