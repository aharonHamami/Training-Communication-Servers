const {Schema, model, SchemaType, SchemaTypes} = require('mongoose');

const userSchema = new Schema({
    publicId: {
        type: String,
        unique: true,
        default: () => `user_${Date.now()}`,
        // !! problem: need to block puting that field outside the schema !!
    },
    name: {
        type: String,
        required: true,
        minLength: 0,
        validate: {
            validator: value => /.{1,}/.test(value), // name pattern
            message: 'Invalid name'
        }
    },
    email: {
        type: String,
        unique: true,
        required: true,
        validate: {
            validator: value => /^\w+([-.]?\w+)+@([\w-]+\.)+[\w-]{2,4}$/.test(value), // email pattern
            message: 'Invalid email address'
        }
    },
    password: {
        type: String,
        required: true,
        validate: {
            validator: value => /^[a-zA-Z0-9]{5,15}$/.test(value),
            message: 'Invalid password'
        }
    },
    admin: {
        type: Boolean,
        default: false
    }
});

const UserDB = model('users', userSchema);

module.exports = UserDB;