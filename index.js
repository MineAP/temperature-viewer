// request-promise-native
const request = require("request-promise-native");

// redis
const redis = require("redis");

// express
const express = require("express");
const app = express();
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');


const URL = "http://raspberrypi.local:5000/api/temperatureandhumidity";

const port = 3000
const intervl_ms = 5 * 60 * 1000
const history_max_count = 1000


// httpサーバーの起動
app.set('views', `${__dirname}/views`);
app.set('view engine', 'mustache');
app.engine('mustache', mustacheExpress());
app.use (bodyParser.urlencoded( {extended : true} ) );

var server = app.listen(port, function(){
    console.log("Node.js is listening to PORT:" + server.address().port);
});


// Redisへの接続とログ出力
var client = redis.createClient();
client.on('connect', function() {
    console.log("connected to Redis");

    // Redisに接続できたらAPIサーバーからのデータ収集を開始

    // 起動後一回目のデータ取得
    collectData()

    // 以降、定期的に取得
    setInterval(collectData, intervl_ms)
});
client.on('error', function (err) {
    console.log("error occured in redis connect：" + err);
});
// Redisにpromiseでアクセスする準備
const { promisify } = require("util");
const getAsync = promisify(client.get).bind(client);
const lrangeAsync = promisify(client.lrange).bind(client);


// topページにアクセスされた時の処理
app.get("/top", function(req, res, next){

    getAsync("currentdata").then((data)=>{
        console.log(data);
        const json=JSON.parse(data)
        res.render("top", 
        {
            pageTitle: "現在の温度と湿度",
            temp: json["data"]["room_temperature"],
            hum: json["data"]["room_humidity"],
            datetime: json["datetime"]
        });        
    }).catch((err)=>{
        console.error(err);
        throw err;
    })
});

// historyページにアクセスされた時の処理
app.get("/history", function(req, res, next){
    lrangeAsync("history", 0, history_max_count).then((data)=>{
        console.log(data);

        data = data.reverse()

        var data_label_1 = "温度(℃)";
        var data_label_2 = "湿度(%)";

        var labels = []
        var data1 = []
        var data2 = []

        data.forEach(element => {
            var data = JSON.parse(element)
            data1.push(data["data"]["room_temperature"])
            data2.push(data["data"]["room_humidity"])
            labels.push(data["datetime"].toString())
        });

        res.render("history", 
        {
            pageTitle: "温度と湿度の遷移",
            chartTitle1: "温度の遷移",
            chartTitle2: "湿度の遷移",
            labels:JSON.stringify(labels),
            data_label_1:data_label_1,
            data1:data1,
            data_label_2:data_label_2,
            data2:data2
        });        
    }).catch((err)=>{
        console.error(err);
        throw err;
    })
});


// WebAPI
app.get("/api/current", function(req, res, next){
    getAsync("currentdata").then((data)=>{
        console.log(data);
        res.json(JSON.parse(data));
    }).catch((err)=>{
        console.error(err);
        throw err;
    })
});
app.get("/api/history", function(req, res, next){
    lrangeAsync("history", 0, history_max_count).then((data)=>{
        console.log(data);
        var list = []
        data.forEach(element => {
            list.push(JSON.parse(element))
        });

        res.json(list);
    }).catch((err)=>{
        console.error(err);
        throw err;
    })
});


// APIサーバーから温度と湿度を取得
function collectData(retoryCount=0) {
    const options = {
        url: URL ,
        method: "GET",
        qs: {},
        json: true
    };
    request(options).then((json)=>{
        if(json["data"]["room_temperature"] == "N/A" || json["data"]["room_humidity"] == "N/A") {
            console.log("can't collect data (value is N/A)");
            
            if (retoryCount < 5) {
                console.log("retory collectData() ...")
                collectData(retoryCount++)
            }
        } else {
            json["datetime"] = new Date(json["timestamp"] * 1000)
            const value = JSON.stringify(json);
            client.lpush("history", value)
            client.ltrim("history", 0, history_max_count)
            client.set("currentdata", value)   
        }
    }).catch((err)=>{
        console.error(err);
    }).finally(()=>{
        console.log("collect data has finished.");
    })
}
