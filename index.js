#!/usr/bin/env node
var ThaiIDReader = require('./ThaiIDReader');
console.log(ThaiIDReader)
var idread = new ThaiIDReader();
idread.read((e)=>{console.log(e)});