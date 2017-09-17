var pg = require('pg');

var user = "postgres";
var password = "1qaz2wsx3edc";
var database = "miniverse";


const connectionString = process.env.DATABASE_URL || `postgres://${user}:${password}@localhost/${database}`;

const client = new pg.Client(connectionString);
exports.connect = function(){
    client.connect();
    // console.log("CONNECTED TO DATABASE");
}

var _logResponse = false;
exports.logResponse = function(val){
    _logResponse = val;
}

var queryQueue = [];
var activeQuery = null;
var queueEnd = false;
var query;

exports.query = function (newQuery, newCallback){
    if(newQuery != null)
        queryQueue.push({query: newQuery, callback: newCallback});

    if(activeQuery == null)
        doQuery();
}

function doQuery(){

    activeQuery = null;

    if(queryQueue.length > 0){

        activeQuery = queryQueue.splice(0, 1)[0];

        query = client.query(activeQuery.query, (e, r) => {

            if(e) handleError(e, query);

            if (activeQuery.callback != undefined){
                activeQuery.callback(r.rows);
            }
        });

        query.on('end', () => {
            doQuery();
        });

        // query.catch(e => handleError(e));
    }
    else{
        if(queueEnd){
            client.end();
            if (onEndCallback != undefined){
                onEndCallback();
                onEndCallback = undefined;
            }
        }
    }
}

exports.getExistingTables = function(callback){
    var tableQuery = client.query(

        `SELECT table_name
        FROM information_schema.tables
        WHERE table_schema='public'
        AND table_type='BASE TABLE';`,

        (e, r) => {

            if(e) handleError(e, tableQuery);

            if(r.rows.length > 0)
                callback(r.rows.map(table => table.table_name));
            else
                callback([]);
        }
    );
}

function handleError(e, query){
    console.log("Error running query: " + e.message);
    console.log("   query: " + query.text);
    process.exit(1);
    doQuery();
}


var onEndCallback;
exports.endOnComplete = function(callback){

    onEndCallback = callback;

    // if still querying, queue
    if(activeQuery != null){
        queueEnd = true;
    }
    //else, end right away
    else{
        client.end();
        if (onEndCallback != undefined){
            onEndCallback();
            onEndCallback = undefined;
        }
    }
}
