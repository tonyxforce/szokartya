"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { readdirSync } = require("fs");
let path = require("path");
var mongoose = require("mongoose");
function default_1() {
    var outObj = {};
    readdirSync("./tools/schemas").forEach((e) => {
        var schema = require(path.join(__dirname, "tools", "schemas", e));
        var schemaName = e.split(".")[0];
        var className = schemaName[0].toUpperCase() + schemaName.slice(1);
        outObj[className] = mongoose.model(className, schema);
    });
    return outObj;
}
exports.default = default_1;
;
