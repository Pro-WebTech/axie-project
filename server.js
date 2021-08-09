const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const path = require('path')
const moment = require('moment');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 80;
app.use(cors())


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

var pool      =    mysql.createPool({
    connectionLimit : 10000000, //important
    host     : 'sql6.freemysqlhosting.net',
    user     : 'sql6429122',
    password : 'fA8ilfHUsJ',
    database : 'sql6429122',
    debug    :  false
});

var midnight = "0:00:10";
var now = null;

setInterval(function () {
    var utcMoment = moment.utc();
    now = utcMoment.format("H:mm:ss");
    if (now === midnight) {
        console.log("Hi, happy new day.");
        pool.getConnection(function(err,connection){
            connection.query("SELECT ronin from users", (err, rows) => {
                connection.release()
                console.log(rows)
            })
        });
    }
}, 1000);

const check_tbl_query = "SELECT count(*) from information_schema.tables WHERE table_schema = 'sql6429122' AND table_name = 'users' LIMIT 1;"
const create_tbl_query = "CREATE TABLE users(id int NOT NULL AUTO_INCREMENT, name VARCHAR(50), ronin VARCHAR(255), percent_manager int,  PRIMARY KEY (id));"
const get_all_users = "SELECT * from users"
const get_all_day_data = "SELECT * from dayscholars"
const get_total_day_scholar = "SELECT * from total_dayscholar"

pool.getConnection(function(err,connection){
    if (err) {
      connection.release();
      res.json({"code" : 100, "status" : "Error in connection database"});
      return;
    }   
    console.log('connected as id ' + connection.threadId);
});

app.get("/daydata", function(req, res) {
    pool.getConnection((err, connection) => {
        if(!err) 
        connection.query(get_all_day_data, (err, rows) => {
            console.log("daydata", rows)
            connection.release()
            res.send(rows);
        })
    })
})

app.get("/total_daydata", function(req, res) {
    pool.getConnection((err, connection) => {
        if(!err) 
        connection.query(get_total_day_scholar, (err, rows) => {
            console.log("total", rows)
            connection.release()
            res.send(rows);
        })
    })
})


app.get("/ronins",function(req,res){
     pool.getConnection((err, connection) => {
        if(err) throw err
        console.log('connected as id ' + connection.threadId)
        connection.query(check_tbl_query, (err, rows) => {
            if (Object.values(rows[0])[0] === 1) {
                console.log("Exist")
                connection.query(get_all_users, (err, rows) => {
                    connection.release()
                    res.send(rows);
                })
            }
            else {
                console.log("Not exist create")
                connection.query(create_tbl_query, (err, rows) => {
                    if (!err) {
                        res.send("Created");
                    }
                });
            }
        })
    })
});

app.post("/add-new", function (req,res) {
    pool.getConnection((err, connection) =>{
        if (!err) 
        connection.query("INSERT INTO users (name, ronin, percent_manager) VALUES ('" +req.body.name + "','" + req.body.ronin + "', '" + req.body.percent_manager + "')"), (err, rows) =>{
            if (!err) {
                res.send("Created");
            }
        }

    })
})

app.post("/delete-user", function (req,res) {
    pool.getConnection((err, connection) =>{
        if (!err) 
        connection.query("DELETE FROM users WHERE name='" + req.body.name + "';"), (err, rows) =>{
            if (!err) {
                res.send("Deleted");
            }
        }

    })
})
app.post("/download", function (req,res) {
    pool.getConnection((err, connection) => {
        if(err) throw err
        console.log('connected as id ' + connection.threadId)
        connection.query(check_tbl_query, (err, rows) => {
            if (Object.values(rows[0])[0] === 1) {
                console.log("Exist")
                connection.query(get_all_users, (err, rows) => {
                    connection.release()
                    res.send(rows);
                })
            }
            else {
                res.send("no data");
            }
        })
    })
})
app.post("/edit-name", function (req, res) {
    pool.getConnection((err, connection) =>{
        if (!err) {
            connection.query("UPDATE users SET name = '" + req.body.name + "' WHERE name = '" + req.body.old_name + "';")
        }
    })
    
})

app.post("/edit-ronin", function (req, res) {
    pool.getConnection((err, connection) => {
        if (!err) {
            console.log(connection.query("UPDATE users SET `name` = '" + req.body.name + "' , ronin ='" + req.body.ronin + "', percent_manager = '" + req.body.percent + "' WHERE `name` = '" + req.body.old_name + "';" ), (err, rows) =>{
                if (!err) {
                    connection.query("UPDATE users SET name = '" + req.body.name + "' , ronin ='" + req.body.ronin + "', percent_manager = '" + req.body.percent + "';" )
                    console.log(rows);
                    res.send("Edited")
                }
            })
        }
    })
    
})


// app.get('*', (req, res) => {
// 	res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
// 	//res.sendFile(path.join(__dirname, 'frontend/public', 'index.html'));
// });

app.get("/get-all-data", function (req, res) {
    
})

app.listen(port, () => console.log(`Listening on port ${port}`))