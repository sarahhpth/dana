function parseJwt(token) {
    var base64Payload = token.split('.')[1];
    var payload = Buffer.from(base64Payload, 'base64');
    return JSON.parse(payload.toString()).rows[0];
}

module.exports = parseJwt