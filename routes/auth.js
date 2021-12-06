const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();

router.post('/register', authController.register );

router.post('/login', authController.login );

router.get('/logout', authController.logout );

router.post('/innit', authController.innit );

router.get('/fimcliente', authController.fimcliente );
router.get('/fimclientevip', authController.fimclientevip );

router.post('/deletevip', authController.deletevip );

router.post('/registrovip', authController.registrovip );



module.exports = router;