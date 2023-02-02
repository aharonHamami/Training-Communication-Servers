const {Schema, model, SchemaType, SchemaTypes} = require('mongoose');

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        minLength: 0,
        validate: {
            validator: value => {
                console.log('validating the name **');
                /.{1,}/.test(value);
            }, // name pattern
            message: 'Invalid name'
        }
    },
    email: {
        type: String,
        validate: {
            validator: value => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value), // email pattern
            message: 'Invalid email address'
        }
    },
    password: {
        type: String,
        validate: {
            validator: value => /^[a-zA-Z0-9]{5,15}$/.test(value),
            message: 'Invalid password'
        }
    }
});

const UserDB = model('users', userSchema);

module.exports = UserDB;