var express = require('express');
var router = express.Router();
var verifikasi = require('./verifikasi');
var controller = require('./controller');


router.get('/', controller.index);
router.post('/register', controller.register);
router.post('/login', controller.login);

//Authentication
router.put('/topup', verifikasi(), controller.topup)
router.post('/transfer', verifikasi(), controller.transfer)
router.post('/transaksi', verifikasi(), controller.transaksi)
router.get('/profile', verifikasi(), controller.profile)
router.get('/history', verifikasi(), controller.history)
router.get('/history/:id', verifikasi(), controller.history_inst)

module.exports = router;