const { readdirSync } = require("fs");
let path = require("path");
var mongoose = require("mongoose");

export default function () {
    var outObj: any = {};
    readdirSync("./tools/schemas").forEach((e: String) => {
        var schema: String = require(path.join(__dirname, "tools", "schemas", e));
        var schemaName: String = e.split(".")[0];
        var className: string = schemaName[0].toUpperCase() + schemaName.slice(1);
        outObj[className] = mongoose.model(className, schema);
    });
    return outObj;
};
