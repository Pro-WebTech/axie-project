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

// app.use(express.static(path.join(__dirname, 'frontend/build')));
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname+'/frontend/build/index.html'));
//   });



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

var midnight = "0:00:00";
var oneminute = "0:01:00";
var now = null;

setInterval(function () {
    var utcMoment = moment.utc();
    now = utcMoment.format("H:mm:ss");
    console.log(now);
    if (now === midnight) {
        console.log("Hi, happy new day.");
        pool.getConnection(function(err,connection){
            connection.query("SELECT ronin from users", (err, rows) => {
                for (let index = 0; index < rows.length; index++) {
                    const element = rows[index].ronin;
                    var ronin = element.replace("ronin:", "0x");
                    axios.get('https://api.lunaciarover.com/stats/' + ronin)
                        .then(function(response) {
                            console.log(response.data.total_slp);
                            var today_total = response.data.total_slp;
                            connection.query("UPDATE everybody_tot_scholars SET before7 = before6 ,before6 = before5, before5 = before4, before4 = before3, before3= before2, before2 = yesterday,yesterday = today, today = '" + today_total+ "' WHERE name = '" +element + "' ;"),(err,rows)=>{
                            }
                        })
                    
                }
            })
        });
    }
}, 1000);

setInterval(function () {
    var utcMoment = moment.utc();
    now = utcMoment.format("H:mm:ss");
    console.log(now);
    if (now === oneminute) {
        console.log("Hi, one minute.");
        pool.getConnection(function(err,connection){
            connection.query("UPDATE everybody_day_scholars, everybody_tot_scholars SET everybody_day_scholars.yesterday = everybody_tot_scholars.today - everybody_tot_scholars.yesterday, everybody_day_scholars.before2 = everybody_tot_scholars.yesterday - everybody_tot_scholars.before2, everybody_day_scholars.before3 = everybody_tot_scholars.before2 - everybody_tot_scholars.before3, everybody_day_scholars.before4 = everybody_tot_scholars.before3 - everybody_tot_scholars.before4, everybody_day_scholars.before5 = everybody_tot_scholars.before4 - everybody_tot_scholars.before5, everybody_day_scholars.before6 = everybody_tot_scholars.before5 - everybody_tot_scholars.before6, everybody_day_scholars.before7 = everybody_tot_scholars.before6 - everybody_tot_scholars.before7 WHERE everybody_day_scholars.name = everybody_tot_scholars.name;"),(err,rows)=>{
                console.log("GOOD");        
            };
        })
    }
}, 1000);


// setInterval(function () {
//     var utcMoment = moment.utc();
//     now = utcMoment.format("H:mm:ss");
//     console.log(now)

//     if (now === midnight) {
//         console.log("hi dear");
//         pool.getConnection(function (err, connection) {
//             connection.query("DELETE FROM everybody_tot_scholars WHERE (field-1) < 1;")
//         })
//     }
// }, 1000)

const check_tbl_query = "SELECT count(*) from information_schema.tables WHERE table_schema = 'sql6429122' AND table_name = 'users' LIMIT 1;"
const create_tbl_query = "CREATE TABLE users(id int NOT NULL AUTO_INCREMENT, name VARCHAR(50), ronin VARCHAR(255), percent_manager int,  PRIMARY KEY (id));"
const get_all_users = "SELECT * from users"
const get_all_day_data = "SELECT * from everybody_tot_scholars"
const get_total_day_scholar = "SELECT * from total_dayscholar"
const get_all_sums = "SELECT SUM(before7) as before7, SUM(before6) as before6 , SUM(before5) as before5, SUM(before4) as before4, SUM(before3) as before3, SUM(before2) as before2, SUM(yesterday) as yesterday from everybody_tot_scholars"

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
            connection.release()
            res.send(rows);
        })
    })
})

app.get("/total_daydata", function(req, res) {
    pool.getConnection((err, connection) => {
        if(!err) 
        connection.query(get_all_sums, (err, result) => {
            if(!err)
            connection.query("UPDATE total_dayscholar SET before7 = '" + result[0].before7 + "' , before6 ='" + result[0].before6 + "', before5 ='" + result[0].before5 + "', before4 ='" + result[0].before4 + "', before3 ='" + result[0].before3 + "', before2 ='" + result[0].before2 + "', yesterday = '" + result[0].yesterday + "';", (err, rows) => {
                if(!err)
                    connection.query(get_total_day_scholar, (err, rows) => {
                        connection.release()
                        res.send(rows);
                    })
            })
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
    var address = req.body.ronin;
    pool.getConnection((err, connection) =>{
        if (!err) {
            connection.query("INSERT INTO users (name, ronin, percent_manager) VALUES ('" +req.body.name + "','" + req.body.ronin + "', '" + req.body.percent_manager + "'); "),(err, rows) =>{
                // if (!err) {
                //     connection.query("INSERT INTO everybody_tot_scholars (name) VALUES ('" + address + "');")
                    res.send("Created");
                    
                // }
            }
        }

    })
})
app.post("/add-day-scholar", function(req, res) {
    pool.getConnection((err, connection) => {
        if (!err) {
            connection.query("INSERT INTO everybody_tot_scholars (name) VALUES ('" + req.body.ronin + "');"), (err, rows) => {
                res.send("add-day created")
            }
        }
    })
    
})
app.post("/delete-user", function (req,res) {
    pool.getConnection((err, connection) =>{
        if (!err) 
        // DELETE `users`, `everybody_tot_scholars` FROM `users`, `everybody_tot_scholars` 
        // WHERE `users`.`ronin`=`everybody_tot_scholars`.`name`
        // AND `users`.`name` = 'brown';
        connection.query("DELETE `users`, `everybody_tot_scholars` FROM `users`, `everybody_tot_scholars` WHERE `users`.`ronin` = `everybody_tot_scholars`.`name` AND `users`.`name` = '" + req.body.name + "';"), (err, rows) =>{
            if (!err) {
                // connection.query("DELETE FROM everybody_tot_scholars WHERE name='"+ address +"';"), (err, rows) => {
                    res.send("Deleted");

                // }
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




app.listen(port, () => console.log(`Listening on port ${port}`))