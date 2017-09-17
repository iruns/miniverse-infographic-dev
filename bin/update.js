#! /usr/bin/env node
var shell = require("shelljs");
var path = require("path");

shell.exec("echo shell.exec works");
console.log("working");

var configPath;
var config;
configPath = path.resolve("miniverse.config.js");
if(fs.existsSync(configPath)) {
	config = require(configPath);
    console.log(config.name);
}
