const User = require('./user')
const Room = require('./room')

const models = { User, Room }

Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
        models[modelName].associate(models)
    }
})

module.exports = {
    User,
    Room,
}
