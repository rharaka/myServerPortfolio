var express = require('express')
var router = express.Router()
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const mysql = require('mysql')
// const http = require('http')

db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'portfolio'
})

app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({extended: true}))

router.get('/', function(request, response, next){
    const sqlSelect = "SELECT * FROM contacts"
    db.query(sqlSelect, function(error, data){
        if(error) {
            throw error
        }
        else {
            response.render('inbox', {title: 'My Inbox', action: 'list', emails: data})
        }
    })
})