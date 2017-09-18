#!/usr/bin/env sh
var shell = require('shelljs');
var pjson = require('./package.json');

shell.exec('git add -A');
if(process.argv[2]){
    shell.exec(`git commit -m "${process.argv[2]}"`);
    shell.exec(`npm version patch -m "${process.argv[2]}"`);
}
else{
    shell.exec(`git commit -m "-no description-"`);
    shell.exec(`npm version patch -m "-no description-"`);
}
shell.exec('git tag ' + pjson.version);
shell.exec('git push origin master --tags');
shell.exec('npm publish');
