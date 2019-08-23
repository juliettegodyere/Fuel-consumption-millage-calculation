/*server.js*/

const http = require('http');
const request = require('request');
const btoa = require('btoa');
const moment = require('moment');
const fetch = require("node-fetch");
const Config = require('./config')

const hostname = '127.0.0.1';
const port = 3000;

var FUEL_LIMIT = 100;

const server = http.createServer(function(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  var result = "";
  var minusThirtyDate = moment().subtract(30, "days").format("YYYY-MM-DD");
  var today = moment().format("YYYY-MM-DD");
  var startDate = "2019-06-28";
  var test = moment(minusThirtyDate).isBefore(today); // true
  var isAfterDate = moment(startDate).isAfter(minusThirtyDate); // true
  var isBeforeDate = moment(startDate).isBefore(today); // true
  res.end("withinDate");
});

async function fetchAllTransaction(){
    const res = await fetch(Config.BASE_URL + '/api/records?model.id=4jpqpwr1&pagesize=200', {
        method:'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(Config.USERNAME + ":" + Config.ACCESS_TOKEN),
        },
    });
    let json = await res.json();
    TotalTransactionOneMonth(json);
}

async function updateOverageField(modifiedObj){
    var url = ConfigBASE_URL + '/api/records/' + modifiedObj.id + '.json';
    //console.log(url);
    console.log(modifiedObj);
    var response = await fetch(url, {
        method:'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(Config.USERNAME + ":" + Config.ACCESS_TOKEN),
        },
        body: JSON.stringify(modifiedObj)
    });
    let json = await response.json();
    console.log("Updated Successfully");
}

function TotalTransactionOneMonth(data){
    var minusThirtyDate = moment().subtract(30, "days").format("YYYY-MM-DD");
    var today = moment().format("YYYY-MM-DD");
    var startDate = "";
    var test = moment(minusThirtyDate).isBefore(today); // true
    var isAfterDate = moment(startDate).isAfter(minusThirtyDate); // true
    var isBeforeDate = moment(startDate).isBefore(today); // true
    var isSameDate = moment(startDate).isSame(minusThirtyDate); // true
    var OneMonthTransaction = [];
    var OneMonthStaffId = [];

    for(var i = 0; i < data.length; i++){
        startDate = data[i].created_date;
        var isAfterDate = moment(startDate).isAfter(minusThirtyDate); // true
        var isBeforeDate = moment(startDate).isBefore(today); // true

        if(isAfterDate && isBeforeDate){
            
            OneMonthTransaction.push(data[i]);
            OneMonthStaffId.push(data[i].data.staff_id);
        }
    }
    calOverage(OneMonthTransaction, OneMonthStaffId);
}

async function calOverage(OneMonthTransaction, OneMonthStaffId){
    var filteredArray = OneMonthStaffId.filter(function(item, pos){
        return OneMonthStaffId.indexOf(item) == pos; 
    });

    var totalVolumnDispensed = 0;
    var Overage = 0;
    var count = 0;
    var OverageSum = 0;

    while(count !== filteredArray.length-1){
        if(count == filteredArray.length-1){
            break;
        }
        for(var i = 0; i < OneMonthTransaction.length; i++){
            if(filteredArray[count] == OneMonthTransaction[i].data.staff_id){
                totalVolumnDispensed = totalVolumnDispensed + parseInt(OneMonthTransaction[i].data.volume_dispensed);
                if(typeof(OneMonthTransaction[i].data.overage) != 'undefined'){
                    OverageSum = OverageSum + parseInt(OneMonthTransaction[i].data.overage);
                }
                if(totalVolumnDispensed > FUEL_LIMIT){
                    Overage = totalVolumnDispensed - FUEL_LIMIT - OverageSum;
                    OneMonthTransaction[i].data.overage = Overage;
                    await updateOverageField(OneMonthTransaction[i]);
                }
            }
        }
        count++;
        totalVolumnDispensed = 0;
        Overage = 0;
        OverageSum = 0;
    }
}

fetchAllTransaction();

server.listen(port, hostname, function() {
  console.log('Server running at http://'+ hostname + ':' + port + '/');
});
