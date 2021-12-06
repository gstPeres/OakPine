const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config({path: './.env'});

const app = express();
const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

const publicDirectory = path.join(__dirname, './public')
app.use(express.static(publicDirectory));

//Parse url-encoded bodies
app.use(express.urlencoded({ extended: false }));
//Parse JSOn bodies from html forms
app.use(express.json());
app.use(cookieParser());


app.set('view engine', 'hbs');

db.connect( (error) => {
    if(error) {
        console.log(error)
    } else {
        console.log('MySQL Connected...')
    }
})

//Define Routes
app.use('/', require('./routes/pages'))
app.use('/auth', require('./routes/auth'));

app.listen(5000, () => {
    console.log("server started");
})
