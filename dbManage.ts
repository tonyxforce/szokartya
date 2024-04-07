var mongoose = require("mongoose");
import { ObjectEncodingOptions } from "fs";
import { Word } from "./schemaparser";
import { WordIf, OptionalWordIf, DbWordIf } from "./tools/schemas/word"

export interface DBError {
    error: boolean,
    code: number,
    data: any
}

export class DBClient {

    /**
     * Creates an instance of DBClient.
     * @param {DBClient} async_param
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
     * @param {string} url
     * @return {*} 
     * @memberof DBClient
     */
    public static async init(url: string): Promise<DBClient> {
        var async_result = await mongoose.connect(url);
        if (async_result) {
            console.log("mongodb connection successful!");
        }
        return new DBClient(async_result);
    }

    /**
    *
     * @param {DbWordIf} filter
     * @return {WordIf} 
     * @memberof DBClient
     */
    public async getWord(filter: DbWordIf | DbWordIf): Promise<Array<WordIf>> {
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
     * @param {number} id
     * @return {Word} 
     * @memberof DBClient
     */
    public async getWordById(id: number, filter?: DbWordIf): Promise<WordIf> {
        var words = await this.getWord(filter);
        return words[id];
    }


    /**
     *
     *
     * @param {WordIf} data
     * @param {boolean} [ignoreTest=false]
     * @return {(Promise<WordIf | DBError>)}
     * @memberof DBClient
     */
    public async createNew(data: WordIf, ignoreTest: boolean = false): Promise<WordIf | DBError> {

        var newWord = data.meanings.orig.word;
        var lang = data.meanings.orig.lang;
        var meaning = data.meanings.meaning.word;
        var meaningLang = data.meanings.meaning.lang;

        var testCrit = { "meanings.orig.word": newWord, "meanings.orig.lang": lang, "meanings.meaning.lang": meaningLang };
        var test2Crit = { "meanings.meaning.word": meaning, "meanings.orig.lang": lang, "meanings.meaning.lang": meaningLang }



        var test = await this.getWord(testCrit);
        var test2 = await this.getWord(test2Crit);

        if (test.length != 0 || test2.length != 0) {
            console.log("found something like this already!");

            console.log(test);
            console.log(test2);

            var firstlast = 0;
            if (test.length != 0 && test2.length != 0) {
                firstlast = 2;
            } else if (test.length != 0) {
                firstlast = 0;
            } else {
                firstlast = 1;
            }
            if (!ignoreTest) {

                return { error: true, code: 409, data: { firstlast } };
            } else {
                console.log("deleting already existing items...");
                await Word.deleteMany(testCrit);
                await Word.deleteMany(test2Crit);
                console.log("done!");
            }
        } else {
            console.log("found no duplicates");
            console.log(testCrit);
            console.log(test2Crit);
        }


        var word = new Word(data);
        console.log("word")
        var resp = await word.save();

        return resp
    }

    /**
     *
     *
     * @return {*} 
     * @memberof DBClient
     */
    public async getAll(): Promise<Array<WordIf>> {
        return await this.getWord({});
    }


    /**
     *
     *
     * @return {Number} 
     * @memberof DBClient
     */
    public async getCount(filter?: DbWordIf): Promise<number> {
        return (await this.getWord(filter)).length;
    }

    /**
     *
     *
     * @param {*} object
     * @return {object is DBError}
     * @memberof DBClient
     */
    public isError(object: any): object is DBError {
        return 'error' in object;
    }


    /**
     *
     *
     * @return {(Promise<boolean | DBError>)}
     * @memberof DBClient
     */
    public async modifyVal({ filter, prop, newVal }: { filter: DbWordIf, prop: string, newVal: unknown }): Promise<boolean | DBError> {
        var obj = {};
        obj[prop] = newVal;
        console.log(await Word.updateMany(filter, obj));
        return true;
    }

    public toDBWord(word: OptionalWordIf): DbWordIf {
        var a: DbWordIf = {};
        if (word.correctGuesses) {
            a.correctGuesses = word.correctGuesses;
        }
        if (word.incorrectGuesses) {
            a.incorrectGuesses = word.incorrectGuesses;
        }
        if (word.meanings) {
            if (word.meanings.orig) {
                if (word.meanings.orig) {
                    if (word.meanings.orig.lang) {
                        a["meanings.orig.lang"] = word.meanings.orig.lang
                    }
                    if (word.meanings.orig.word) {
                        a["meanings.orig.word"] = word.meanings.orig.word
                    }
                }
                if (word.meanings.meaning) {
                    if (word.meanings.meaning.lang) {
                        a["meanings.meaning.lang"] = word.meanings.meaning.lang
                    }
                    if (word.meanings.meaning.word) {
                        a["meanings.meaning.word"] = word.meanings.meaning.word
                    }
                }
            }
        }
        return a;
    }
}

