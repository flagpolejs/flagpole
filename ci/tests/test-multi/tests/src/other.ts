import flagpole from '../../../../../dist/index.js'

const main = flagpole("Other")

main.scenario('Check posts', 'json')
.open('/posts/1')
.setMethod('get')
.next(async (context) => {
  context.assert(context.response.statusCode).equals(200)
  context.assert(context.response.jsonBody.$.id).equals(1)
})
