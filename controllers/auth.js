const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {promisify} = require('util');
const e = require('express');

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;

        if( !email || !password ) {
            return res.status(400).render('login',{
                message: 'Please enter your e-mail and password!'
            })
        }

        db.query('SELECT * FROM Admins WHERE Email = ?', [email], async (error, results) => {
            console.log(results);
            if( results == 0 || !(await bcrypt.compare(password, results[0].Senha ))){
                res.status(401).render('login', {
                    message: 'Credenciais Inválidas'
                })
            } else {
                const id = results[0].ID_Admin;

                const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                

                console.log("The token is: " + token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }
                res.cookie('jwt', token, cookieOptions );
                res.status(200).redirect("/");
            }

            
        })

    } catch (error) {
        console.log(error);
    }
}

exports.register = (req, res) => {
    console.log(req.body);

    const { name, email, password, passwordConfirm } = req.body;

    db.query('SELECT Email FROM Admins WHERE Email = ?', [email], async (error, results) => {
        if(error) {
            console.log(error);
        }
        if (results.length > 0) {
            return res.render('register', {
                message: 'That e-mail is already in use'
            })
        } else if(password !== passwordConfirm) {
            return res.render('register', {
                message: 'Passwords do not match'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query('INSERT INTO Admins SET ?', {Nome: name, Email: email, Senha: hashedPassword }, (error, results) => {
            if(error) {
                console.log(error);
            } else {
                console.log(results);
                return res.render('register', {
                    message: 'User registered'
                })
            }
        })

    });

} //ATUALIZADO 01:26

exports.deletevip = (req, res) => {
    console.log(req.body);
    const {placa} = req.body;
    const upper = placa.toUpperCase();
    const regex = '[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$';
    if( !upper.match(regex) ) {
        return res.status(400).render('pclivip',{
            message: 'Placa Inválida!'
        })
    }
    db.query('SELECT * FROM Clientes_Vip WHERE Placa_Vip = ?',[upper], async (error, results) => {
        if (error) {
            console.log(error);
        }
        if (results.length == 0) {
            return res.status(400).render('pclivip', {
                message: 'Não existe esse cliente VIP!'
            })
        } else {
            db.query('DELETE FROM Clientes_Vip WHERE Placa_Vip = ?',[upper], async (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    return res.status(200).render('pclivip', {
                        message: 'Usuário removido com sucesso!'
                    })
                }
            });
        }
    });

}

exports.isLoggedIn = async (req, res, next) => {
    if(req.cookies.jwt) {
        try {
            //Verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,
                process.env.JWT_SECRET);

                console.log(decoded);

                //Check if the user still exists
                db.query('SELECT * FROM Admins WHERE ID_Admin = ?',[decoded.id], (error, result)=> {
                    console.log(result);

                    if(!result) {
                        return next();
                    }

                    req.user = result[0];
                    return next();
                });
                
        } catch(error) {
            console.log(error);
            return next();
        } 
    } else {
        next();
    }
}

exports.hbsClivip = async (req, res, next) => {
    if(req.cookies.jwt) {
        try {
            db.query('SELECT COUNT(Placa_Vip) as consultavip from Clientes_Vip', (error, result)=>{
                console.log(result);

                req.user = result[0];
                return next();
            });

        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
} //ATUALIZADO 01:23

exports.hbsVagas = async (req, res, next) => {
    if(req.cookies.jwt) {
        try {
            db.query('SELECT COUNT(Placa_Carro) as consultavagas from Clientes_Ativos', (error, result)=>{
                console.log(result);

                req.user = result[0];
                return next();
            });

        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
} //ATUALIZADO 01:27

exports.hbsRendatotal = async (req, res, next) => { //mexer
    if(req.cookies.jwt) {
        try {
            db.query('SELECT SUM(Valor) as consultarendatotal from Pagamentos', (error, result)=>{
                console.log(result);

                req.user = result[0];
                return next();
            });

        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
} //ATUALIZADO 01:31

exports.hbsRendaDiaria = async (req, res, next) => { 
    if(req.cookies.jwt) {
        try {
            db.query('SELECT SUM(Valor) as consultarendadiaria from Pagamentos where Data = curdate()', (error, result)=>{
                console.log(result);

                req.user = result[0];
                return next();
            });

        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
} //ATUALIZADO 01:31


exports.logout = async (req, res) => {
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2*1000),
        httpOnly: true
    });

    res.status(200).redirect('/');
}


exports.innit = async (req, res) => {
    try {
        const {placa} = req.body;
        const upper = placa.toUpperCase();
        const regex = '[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$';

        if( !upper.match(regex) ) {
            return res.status(400).render('index',{
                message: 'Placa Inválida!'
            })
        }

        db.query('SELECT * FROM clientes_vip WHERE placa_vip = ?', [upper], async (error, results) => {
            console.log(results);
            if( results.length > 0 ) {
                const id_vip = results[0].ID_Vip;
                
                db.query('INSERT INTO Pagamentos SET ?', {Valor: 0}, async (error, results) => {
                    if (error) { 
                        console.log(error);
                    } else {
                        db.query('SELECT * FROM Pagamentos ORDER BY(ID_NF) DESC', async (error, results) => {
                            if (error) {
                                console.log(error);
                            } else {
                                const id_nf = results[0].ID_NF;
                                db.query('INSERT INTO eLogs SET ?', {Placa_Veicular : upper, ID_CliVip : id_vip, ID_PNF : id_nf });
                                db.query('SELECT * FROM eLogs WHERE ID_PNF = ?',[id_nf], async (error, results) =>{
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        const id_clilog = results[0].ID_Log;
                                        db.query('INSERT INTO Clientes_Ativos SET ?', {Placa_Carro : upper, ID_LogCli : id_clilog});
                                    }
                                });
                            }
                        });
                        
                    }
                });

                const token = jwt.sign({ id_vip }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                    
                });

                console.log("The token is: " + token);
                console.log("The const id_vip is: " + id_vip);


                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }
                res.cookie('clientevip', token, cookieOptions );
                res.status(200).redirect("/paymentvip");
                
                
                //Até aqui atualizado 00:43
            } else {
                db.query('INSERT INTO Pagamentos SET ?', {Valor: 14}, async (error, results) => {
                    if (error) { 
                        console.log(error);
                    } else {
                        db.query('SELECT * FROM Pagamentos ORDER BY(ID_NF) DESC', async (error, results) => {
                            if (error) {
                                console.log(error);
                            } else {
                                const id_nf = results[0].ID_NF;
                                db.query('INSERT INTO eLogs SET ?', {Placa_Veicular : upper, ID_PNF : id_nf });
                                db.query('SELECT * FROM eLogs WHERE ID_PNF = ?',[id_nf], async (error, results) =>{
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        const id_clilog = results[0].ID_Log;
                                        db.query('INSERT INTO Clientes_Ativos SET ?', {Placa_Carro : upper, ID_LogCli : id_clilog});
                                        db.query('SELECT * FROM Clientes_Ativos WHERE Placa_Carro = ?',[upper], async (error, results) =>{
                                            if(results.length > 0) { 
                                                const id_logcli = results[0].ID_LogCli

                                                const token = jwt.sign({ id_logcli }, process.env.JWT_SECRET, {
                                                    expiresIn: process.env.JWT_EXPIRES_IN
                                                    
                                                });
                                                console.log("O token é "+ token);
                                                console.log("A const id_logcli é:" + id_logcli);
                                                const cookieOptions = {
                                                    expires: new Date(
                                                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                                                    ),
                                                    httpOnly: true
                                                }
                                                res.cookie('clientenormal', token, cookieOptions);
                                                res.status(200).redirect("/payment");
                                            } else {
                                                console.log(error);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                        
                    }
                }); //ATÉ AQUI PARECE ESTAR ATUALIZADO 01:11

            }

            
        })

    } catch (error) {
        console.log(error);
    }
} // ATUALIZADO 01:18

exports.isCustomer = async (req, res, next) => {
    if(req.cookies.clientenormal) {
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.clientenormal,
                process.env.JWT_SECRET);

                console.log(decoded);

                db.query('SELECT Placa_Carro, DAYOFMONTH(curdate()) as Dia, MONTH(curdate()) as Mes, curtime() as Tempo FROM Clientes_Ativos WHERE ID_LogCli = ?',[decoded.id_logcli], async (error, result)=> {
                    console.log(result);

                    if(!result) {
                        return next();
                    }

                    req.user = result[0];
                    return next();
                });
        }   catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
} // ATUALIZADO 03:20

exports.isCustomerVip = async (req, res, next) => {
    if(req.cookies.clientevip) {
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.clientevip,
                process.env.JWT_SECRET);

                console.log(decoded);
                db.query('SELECT Placa_Vip, DAYOFMONTH(curdate()) as Dia, MONTH(curdate()) as Mes, curtime() as Tempo FROM Clientes_Vip WHERE ID_Vip = ?',[decoded.id_vip], (error, result)=> {
                    console.log(result);

                    if(!result) {
                        return next();
                    }

                    req.user = result[0];
                    return next();
                });
        }   catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
} //ATUALIZADO 01:20


//DEU CERTO EVITAR MEXER
exports.fimcliente = async (req, res, next) => {
    if(req.cookies.clientenormal) {
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.clientenormal,
                process.env.JWT_SECRET);

                db.query('UPDATE eLogs SET Hora_Saida = curtime() WHERE ID_Log = ?',[decoded.id_logcli]);
                db.query('DELETE FROM Clientes_Ativos WHERE ID_LogCli = ?',[decoded.id_logcli], async (error, result)=> {
                    console.log(result);

                    if(!result) {
                        return next();
                    }

                    res.cookie('clientenormal', 'fimcliente', {
                        expires: new Date(Date.now() + 2*1000),
                        httpOnly: true
                    });
                    res.status(200).redirect('/')
                });
        }   catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
} //ATUALIZADO 02:21

exports.fimclientevip = async (req, res, next) => {
    if(req.cookies.clientevip) {
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.clientevip,
                process.env.JWT_SECRET);

                console.log(decoded);
                db.query('SELECT * FROM eLogs WHERE ID_CliVip = ?',[decoded.id_vip], async (error, results) => {
                    if (error) {
                        console.log(error);
                    } else {
                        const idplaca = results[0].Placa_Veicular;
                        db.query('UPDATE eLogs SET Hora_Saida = curtime() WHERE Placa_Veicular = ?',[idplaca]);
                        db.query('DELETE FROM Clientes_Ativos WHERE Placa_Carro = ?',[idplaca], async (error, result)=> {
                            console.log(result);
        
                            if(!result) {
                                return next();
                            }
        
                            res.cookie('clientevip', 'fimclientevip', {
                                expires: new Date(Date.now() + 2*1000),
                                httpOnly: true
                            });
                            res.status(200).redirect('/')
                        });
                    }
                });
        }   catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
}

exports.registrovip = (req, res) => {
    console.log(req.body);
    const {placacarro, cpf, telefone, numcartao, mescvv, cvv} = req.body;
    const upper = placacarro.toUpperCase();
    const regex = '[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$';
    if( !upper.match(regex) ) {
        return res.status(400).render('pclivip',{
            badmessage: 'Placa Inválida!'
        })
    }
    if (!placacarro || !cpf || !telefone || !numcartao || !mescvv || !cvv ) {
        return res.status(400).render('registrovip', {
            badmessage: 'Insira todas as informações!'
        })
    }
    db.query('SELECT * FROM Clientes_Vip WHERE Placa_Vip = ?',[upper], async (error, results)=> {
        if (error) {
            console.log(error);
        } if (results.lenght > 0) {
            return res.status(400).render('registrovip', {
                badmessage: 'Usuário já é VIP!'
            })
        } else {
            db.query('INSERT INTO Clientes_Vip SET ?', {Placa_Vip: upper, CPF : cpf, Telefone : telefone }, async (error, results)=> {
                if (error) {
                    console.error(error);
                } else {
                    db.query('INSERT INTO Pagamentos SET ?', {Valor : 200});
                    return res.status(200).render('registrovip', {
                        message: 'Usuário registrado com sucesso!'
                    })
                }
            });
        }
    });
    
}

