"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBClient = void 0;
var mongoose = require("mongoose");
const schemaParser_1 = require("./schemaParser");
var { Word } = (0, schemaParser_1.default)();
class DBClient {
    /**
     * Creates an instance of DBClient.
     * @param {*} async_param
     * @memberof DBClient
     */
    constructor(async_param) {
        if (typeof async_param === 'undefined') {
            throw new Error('Cannot be called directly');
        }
        this.client = async_param.connections[0];
    }
    /**
     *
     *
     * @type {typeof mongoose.connection}
     * @memberof DBClient
     */
    client;
    /**
     *
     *
     * @static
     * @param {String} url
     * @return {*}
     * @memberof DBClient
     */
    static async init(url) {
        var async_result = await mongoose.connect(url);
        ;
        return new DBClient(async_result);
    }
    /**
    *
     * @param {Object} filter
     * @return {Object}
     * @memberof DBClient
     */
    async getWord(filter) {
        const projection = {};
        const sort = {};
        const collation = {};
        //console.log(this.client)
        const coll = this.client.collection('words');
        const cursor = coll.find(filter, { projection, sort, collation });
        const result = await cursor.toArray();
        return result;
    }
    /**
     *
     *
     * @param {{
     *         newWord: String;
     *         lang: String;
     *         meaning: String;
     *         meaningLang: String;
     *     }}
     * @return {*}
     * @memberof DBClient
     */
    async createNew({ newWord: origWord, lang, meaning, meaningLang, }, ignoreTest = false) {
        if (!ignoreTest) {
            var test = await this.getWord({ "meanings.orig.word": origWord, "meanings.orig.lang": lang, "meanings.meaning.lang": meaningLang });
            var test2 = await this.getWord({ "meanings.meaning.word": meaning, "meanings.orig.lang": lang, "meanings.meaning.lang": meaningLang });
            console.log("test1", { "meanings.orig.word": origWord, "meanings.orig.lang": lang, "meanings.meaning.lang": meaningLang });
            console.log("test2", { "meanings.meaning.word": meaning, "meanings.orig.lang": lang, "meanings.meaning.lang": meaningLang });
            if (test.length != 0 || test.length != 0) {
                console.log("found something like this already!");
                console.log(test);
                console.log(test2);
                return { error: true, code: 409 };
            }
        }
        var word = new Word({
            meanings: {
                orig: {
                    lang: lang,
                    word: origWord,
                },
                meaning: {
                    lang: meaningLang,
                    word: meaning,
                },
            }
        });
        var resp = await word.save();
        resp.error = false;
        return resp;
    }
    /**
     *
     *
     * @return {*}
     * @memberof DBClient
     */
    async getAll() {
        return await this.getWord({});
    }
}
exports.DBClient = DBClient;
