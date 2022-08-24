if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const mysql = require('mysql')
const flash = require('connect-flash')
const flash1 = require('express-flash')
const session = require('express-session')
const bcrypt = require('bcrypt')
const passport = require('passport')

const { ensureAuthenticated } = require('./config/auth')

db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'portfolio'
})

app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use('/public', express.static(__dirname + '/public'))
app.use(expressLayouts)
app.set("view engine", "ejs")

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true, 
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(flash());
app.use(flash1());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    next()
})

app.get('/', (req, res) => {
    if(req.user != null && req.user.logged == 1) {
        res.redirect('/dashboard')
    }
    else 
        res.redirect('/welcome')
})

app.get('/welcome', (req, res) => {
    res.render('welcome')
})

app.get('/login', (req, res) => {
    if(req.user != null && req.user.logged == 1) {
        res.redirect('/dashboard')
    }
    else 
        res.render('login')
})

app.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard', {user: req.user})
})

app.get('/logout', (req, res, next) => {

    const sqlLogout = "UPDATE users SET logged = 0 WHERE id = ?"
    db.query(sqlLogout, req.user.id, (errLogout, resultLogout) => {
        if (errLogout) {
            req.flash('error_msg', 'Something went wrong while logging out!')
            res.render('login', {logged: true});
            throw errLogout;
        } else {
            req.flash('success_msg', 'Logged out successfully!')
            req.logout(function(err) {
                if (err) { 
                    return next(err); 
                }
                res.redirect('/login');
            });
        }
    })

})

app.get("/inbox", ensureAuthenticated, (req, res) => {
    const sqlSelect = "SELECT * FROM contacts"
    db.query(sqlSelect, (err, result) => {
        if (err) {
            throw err;
        } else {
            res.render('inbox', {contacts: result});
        }
    })
})

app.get("/contacts", ensureAuthenticated, (req, res) => {
    const sqlSelect = "SELECT * FROM people"
    db.query(sqlSelect, (err, result) => {
        if (err) {
            throw err;
        } else {
            res.render('contacts', {people: result})
        }
    })
})

app.get('/delete', ensureAuthenticated, (req, res) => {
    const id = req.query.id;

    const sqlDelete = "DELETE FROM contacts WHERE id = ?"
    db.query(sqlDelete, id, (err, result) => {
        res.redirect('/inbox')
    })
})

app.get('/mar', ensureAuthenticated, (req, res) => {
    const id = req.query.id
    const asr = req.query.asr
    var sqlMar = ""

    if(asr == "0")
        sqlMar = "UPDATE contacts SET asread = 1 WHERE id = ?"
    else if(asr == "1")
        sqlMar = "UPDATE contacts SET asread = 0 WHERE id = ?"

    db.query(sqlMar, id, (err, result) => {
        res.redirect('/inbox')
    })
})

app.post('/contact', (req, res) => {
    const email = req.body.email
    const subject = req.body.subject
    const message = req.body.message

    const sqlInsert = "INSERT INTO contacts(email, subject, message) Values(?, ?, ?)"

    try {
        db.query(sqlInsert, [email, subject, message], (err, result) => {
            console.log('err try db query insert contact :' + err)
            console.log('result db query insert contact :' + result)
            res.send(result)
        })
    } 
    catch (error) {
        console.log('error catch db query insert contact :' + error)
        res.send(error)
    }
    
})

app.post('/people', (req, res) => {
    const name = req.body.name
    const email = req.body.email
    const other = req.body.other

    const sqlInsert = "INSERT INTO people(name, email, other) Values(?, ?, ?)"
    db.query(sqlInsert, [name, email, other], (err, result) => {
        res.redirect('/contacts')
    })
})

app.post('/editPpl', ensureAuthenticated, (req, res) => {
    const id = req.body.pplId;

    const sqlEdit = "SELECT * FROM people WHERE id = ?"
    db.query(sqlEdit, id, (err, resultEdit) => {

        const sqlSelectPpl = "SELECT * FROM people"
        db.query(sqlSelectPpl, (err, resultPpl) => {
            if (err) {
                throw err;
            } else {
                res.render('contacts', {person: resultEdit[0], people: resultPpl})
            }
        })

    })
})

app.post('/updPpl', ensureAuthenticated, (req, res) => {
    const id = req.body.pplId
    const name = req.body.name
    const email = req.body.email
    const other = req.body.other

    const sqlUpdate = "UPDATE people SET name = ?, email = ?, other = ? WHERE id = ?"
    db.query(sqlUpdate, [name, email, other, id], (err, result) => {
        res.redirect('/contacts')
    })
})

app.get('/deletePpl', ensureAuthenticated, (req, res) => {
    const id = req.query.id;

    const sqlDelete = "DELETE FROM people WHERE id = ?"
    db.query(sqlDelete, id, (err, result) => {
        res.redirect('/contacts')
    })
})

app.post('/login', (req, res, next) => {
    const email = req.body.email
    const password = req.body.password

    const sqlLogin = "SELECT * FROM users WHERE email = ? AND active = 1"
    db.query(sqlLogin, email, async (err, result) => {
        if (err) {
            req.flash('error_msg', 'Something went wrong while looking for the user!')
            res.render('login', {logged: null})
            throw err;
        } 
        else if(result.length > 0) {
            if(await bcrypt.compare(password, result[0].password)) {
                const sqlLogged = "UPDATE users SET logged = 1 WHERE id = ?"
                db.query(sqlLogged, result[0].id, (errLogged, resultLogged) => {
                    if (errLogged) {
                        req.flash('error_msg', 'Something went wrong while logging in!')
                        res.render('login', {logged: false});
                        throw errLogged;
                    } else {
                        result[0].logged = 1
                        req.user = result[0]
                        req.user.logged = 1
                        require('./passport-config')(passport, result[0])
                        req.flash('success_msg', 'Logged in successfully!')
                        passport.authenticate('local', {
                            successRedirect: '/dashboard',
                            failureRedirect: '/login',
                            failureFlash: true
                        })(req, res, next)
                    }
                })
            }
            else {
                req.flash('error_msg', 'Password incorrect!')
                res.redirect('/login')
            }
        }
        else {
            req.flash('error_msg', 'User not exist!')
            res.redirect('/login')
        }
    })
})

// app.get('/selected', function (req, res) {

//     let id = req.query.id;
//     var licence = await selected(id);

// })

app.listen(process.env.PORT || PORT, () => {
    console.log(`Server running on ${PORT}`);
})
