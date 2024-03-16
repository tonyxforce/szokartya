var mongoose = require("mongoose");
import schemaParser from "./schemaParser";
var { Word } = schemaParser();




export class DBClient {

    /**
     * Creates an instance of DBClient.
     * @param {*} async_param
     * @memberof DBClient
     */
    constructor(async_param: any) {
        if (typeof async_param === 'undefined') {
            throw new Error('Cannot be called directly');
        }
        this.client = async_param.connections[0]
    }


    /**
     *
     *
     * @type {typeof mongoose.connection}
     * @memberof DBClient
     */
    public client: typeof mongoose.connection;


    /**
     *
     *
     * @static
     * @param {String} url
     * @return {*} 
     * @memberof DBClient
     */
    public static async init(url: String) {
        var async_result = await mongoose.connect(url);
        if(async_result){
            console.log("mongodb connection successful!");
        }
        return new DBClient(async_result);
    }

    /**
    *
     * @param {Object} filter
     * @return {Object} 
     * @memberof DBClient
     */
    public async getWord(filter: Object) {
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
    public async createNew({
        newWord,
        lang,
        meaning,
        meaningLang,
    }: {
        newWord: String;
        lang: String;
        meaning: String;
        meaningLang: String;
    }, ignoreTest: boolean = false) {

        if (!ignoreTest) {
            var test = await this.getWord({ "meanings.orig.word": newWord, "meanings.orig.lang": lang, "meanings.meaning.lang": meaningLang });
            var test2 = await this.getWord({ "meanings.meaning.word": meaning, "meanings.orig.lang": lang, "meanings.meaning.lang": meaningLang });

            if(test.length != 0 || test2.length != 0){
                console.log("found something like this already!");
                console.log(test);
                console.log(test2);
                var firstlast = 0;
                if(test.length != 0 && test2.length != 0){
                    firstlast = 2;
                }else if(test.length != 0){
                    firstlast = 0;
                }else{
                    firstlast = 1;
                }
                return {error: true, code: 409, firstlast};
            }
        }

        var word = new Word({
            meanings: {
                orig: {
                    lang: lang,
                    word: newWord,
                },
                meaning: {
                    lang: meaningLang,
                    word: meaning,
                },
            }
        });
        var resp = await word.save();
        resp.error = false;
        return resp
    }

    /**
     *
     *
     * @return {*} 
     * @memberof DBClient
     */
    public async getAll():Promise<Array<Object>> {
        return await this.getWord({});
    }

    
    /**
     *
     *
     * @return {Number} 
     * @memberof DBClient
     */
    public async getCount(): Promise<number>{
        return (await this.getAll()).length;
    }
}

