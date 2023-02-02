
function getRandomString(stringLength) {
    let result = '';
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for(let i = 0; i < stringLength; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = {getRandomString};