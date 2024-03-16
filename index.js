var express = require("express");
var app = express();
var path = require("path")
var config = require("./config.js");

app.use(express.static(path.join(__dirname, "public")))

app.listen(config.port, ()=>{
    console.log(`listening on port ${config.port}`)
})