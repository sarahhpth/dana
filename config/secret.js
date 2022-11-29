var dateNow = new Date();
var currentDate = dateNow.getFullYear() + dateNow.getDay() + (dateNow.getMonth() + 1) + dateNow.getDate() + dateNow.getHours() + dateNow.getMinutes() + dateNow.getSeconds() + dateNow.getMilliseconds()

module.exports = {
    'secret':'48ee0e52b82b7e0c3d43b4e8a74eadf3ebf075aa090ce6e1cf28c370d8793c07c6970843dbefa1231bf5401ffc1811ee8dedebd64bd5f7805ca8c57bd7c85970',
    'secretKeyMoney': 'a5f42c3c57e5c9f7ab5f30f261cf30ac4e19dd8dbe55afa28ee2a01fbd46a4d365373eb293c38aa322b3ec743a9a4fecaf18aa4529d981cdb8821b168a69dece',
    'secretKey': currentDate.toString(16)
}