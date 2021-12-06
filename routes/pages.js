const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();
const mysql = require('mysql2');
const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

router.get('/', authController.isLoggedIn, (req, res) => {
    res.render('index', {
        user: req.user
    });
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/registrovip', (req, res) => {
    res.render('registrovip');
});

router.get('/profile', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('profile', {
            user: req.user
        });
    } else {
        res.redirect('/login');
    }
});

router.get('/prenda.hbs', authController.hbsRendaDiaria, (req, res) => {
    if (req.user) {
        res.render('prenda', {
            rendadiaria: req.user
        });
    } else {
        res.redirect('/login');
    }
});

router.get('/pclivip.hbs', authController.hbsClivip, (req, res) => {
    if (req.user) {
        res.render('pclivip', {
            clivip: req.user
        });
    } else {
        res.redirect('/login');
    }
});

router.get('/pvagas.hbs', authController.hbsVagas, (req, res) => {
    if (req.user) {
        res.render('pvagas', {
            vagas: req.user
        });
    } else {
        res.redirect('/login');
    }
});

router.get('/prentotal.hbs', authController.hbsRendatotal, (req, res) => {
    if (req.user) {
        res.render('prentotal', {
            rendatotal: req.user
        });
    } else {
        res.redirect('/login');
    }
});



router.get('/payment', authController.isCustomer, (req, res) => {
    if (req.user) {
        res.render('payment', {
            user: req.user
        });
    } else {
        res.redirect('/');
    }
});


router.get('/paymentvip', authController.isCustomerVip, (req, res) => {
    if (req.user) {
        res.render('paymentvip', {
            user: req.user
        });
    } else {
        res.redirect('/');
    }
});





module.exports = router;