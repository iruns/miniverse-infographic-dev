var request = require('request');

exports.get = function getDataSet(url, params, callback){
    request(
        {
            url: 'http://localhost/miniverse/server/phps/'+ url +'.php',
            qs: params
        },
        (error, response, body) => {
            if(error == null && response.statusCode == 200){
                callback(body);
            }
            else{
                console.log('error:', error); // Print the error if one occurred
                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                console.log('body:', body); // Print the HTML for the Google homepage.
            }
        }
    );
}

exports.call = function getDataSet(url, functionName, params, callback){

    params.function = functionName;

    request(
        {
            url: 'http://localhost/miniverse/test/server/phps/' + url +'.php',
            qs: params
        },
        (error, response, body) => {
            if(error == null && response.statusCode == 200){
                callback(body);
            }
            else{
                console.log('error:', error); // Print the error if one occurred
                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                console.log('body:', body); // Print the HTML for the Google homepage.
            }
        }
    );
}
