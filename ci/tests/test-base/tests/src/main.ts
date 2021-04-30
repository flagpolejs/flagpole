import flagpole from '../../../../../dist/index.js'

const main = flagpole("Main")

main.scenario('Check todos', 'json')
  .open('/todos/1')
  .setMethod('get')
  .next(async (context) => {
    context.assert(context.response.statusCode).equals(200)
    context.assert(context.response.jsonBody.$.id).equals(1)
  })
