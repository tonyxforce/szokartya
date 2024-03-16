const mongoose = require("mongoose");
const consts = require("../../const.js");

module.exports = new mongoose.Schema({
    meanings: {
        orig: {
            lang: String,
            word: String,
        },
        meaning: {
            lang: String,
            word: String,
        },
    }
});
