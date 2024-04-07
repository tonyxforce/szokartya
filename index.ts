const { existsSync, writeFileSync, readFileSync } = require("fs");
const { default: chalk } = require("chalk");
const { env } = require("process");
require("dotenv").config();
import express from 'express';
var app = express();
let path = require("path")
var config = require("./config.js");
import { DBClient, DBError } from "./dbManage"
/* import { text } from 'body-parser'; */

import xlsx from 'node-xlsx';
import parseXls, { UploadError } from "./parseXls"


import * as deepl from 'deepl-node';
import { WordIf, OptionalWordIf, DbWordIf } from './schemaparser';
const translator = new deepl.Translator(env.DEEPL_KEY);

import fileUpload from "express-fileupload";
import fs, { unlinkSync } from 'fs';
import capabilities from './capabilities';


if (!existsSync(".env")) {
    console.error(chalk.red("No .env file!"))
    console.warn(chalk.yellow("retrieving from example..."));
    writeFileSync(".env", readFileSync(".env.example"));
}

var db: DBClient;

const bodyParser = require('body-parser');

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: config.tmpFolder,
    parseNested: true
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

DBClient.init(env.MONGOURL).then((deb) => {
    app.listen(config.port, async () => {
        console.log(`listening on port ${config.port}`);
        db = deb;
    })
});

app.get("/api/v1/getAllWords", async (req: express.Request, res: express.Response) => {
    res.send(await db.getAll());
})

app.post("/api/v1/newWord", async (req: express.Request, res: express.Response) => {
    var { newWord, lang, meaning, meaningLang, ignoreWarning } = req.body;

    if (!newWord || !lang || !meaning || !meaningLang) {
        res.status(400);
        res.send({ error: true, message: "missing parameters!", code: 400 });
        return;
    }

    var resp: WordIf | DBError = await db.createNew({
        meanings: {
            orig: {
                word: newWord,
                lang: lang,
            },
            meaning: {
                word: meaning,
                lang: meaningLang,
            }
        },
        correctGuesses: 0,
        incorrectGuesses: 0
    }, ignoreWarning);

    if (db.isError(resp)) {
        if (resp.code == 409) {
            res.status(409);
            res.send({ error: true, message: "content already exists!", code: 409, firstlast: resp.data.firstlast });
            return;
        }
        res.status(resp.code ? resp.code : 400);
        res.send({ error: true, message: "something went wrong!", code: resp.code ? resp.code : 400 });
        return;

    }
    res.send(resp);
})

app.get("/api/v1/getWord", async (req: express.Request, res: express.Response) => {
    var wordToGet: string = req.query.word.toString();
    var origLang: string = req.query.origLang.toString();
    var meaningLang: string = req.query.meaningLang.toString();

    if (!wordToGet || !origLang || !meaningLang) {
        res.status(400);
        res.send({ error: true, message: "missing parameters!", code: 400 });
        return;
    }
    var word = await db.getWord({ "meanings.orig.word": wordToGet, "meanings.orig.lang": origLang, "meanings.meaning.lang": meaningLang });
    if (word.length != 0)
        word = await db.getWord({ "meanings.meaning.word": wordToGet, "meanings.orig.lang": origLang, "meanings.meaning.lang": meaningLang })

    res.send(word);
    //res.send({wordToget, meaning: meaning[newLang]})
})


app.get("/api/v1/translate", async (req, res) => {
    var transText = req.query.text;
    if (!transText) {
        res.status(400);
        res.send({ error: true, message: "missing parameters!", code: 400, text: "" });
        return;
    }
    transText = transText.toString();

    var cache = require("./cache.json");
    if (cache[transText]) {
        console.log(`found ${transText} in cache! (${cache[transText]})`)
        res.send({ error: false, text: cache[transText] })
        return;
    }

    transText = transText.toString();

    const targetLang = 'fi';
    var transed = await translator.translateText(
        transText,
        'hu',
        targetLang,
    );
    cache[transText] = transed.text
    writeFileSync("./cache.json", JSON.stringify(cache))
    res.send({ error: false, text: transed.text });
})

app.get("/api/v1/getCount", async (req, res) => {
    var resp = (
        await db.getWord(
            db.toDBWord({
                meanings: {
                    orig: { lang: "hu" },
                    meaning: { lang: "fi" }
                }
            })
        )
    ).length;

    res.send(resp.toString());
})


var usedIds: Array<number> = [];

app.get("/api/v1/clearNoRepeat", async (req, res) => {
    usedIds = [];
    console.log("cleared")
    res.send({ error: false });
})



app.get("/api/v1/getRandom", async (req, res) => await random(req, res, 0))

async function random(req: express.Request, res: express.Response, iter: number = 0) {


    var count = await db.getCount(db.toDBWord({
        meanings: {
            orig: { lang: "hu" },
            meaning: { lang: "fi" }
        }
    }));
    var randomId = Math.floor(Math.random() * count);
    var resp = await db.getWordById(randomId, db.toDBWord({
        meanings: {
            orig: { lang: "hu" },
            meaning: { lang: "fi" }
        }
    }));

    if (req.query.noRepeat) {

        if (usedIds.includes(randomId)) {
            console.log("repeating!");
            if (iter >= count) {
                console.log("too much");
                res.send({ error: true, code: 429, message: "No more words in DB!" });
                return;
            }
            return await random(req, res, iter + 1);
        } else console.log("not repeating");

        usedIds.push(randomId);
    }

    console.log(count);
    console.log(randomId);
    console.log(resp);

    res.send(resp);
}


app.post('/api/v1/upload', async function (req: express.Request, res: express.Response) {



    if (!req.files) {
        console.log("no file uploaded");
        res.status(409);
        res.send(new UploadError({
            code: 409,
            message: "no file uploaded",
            data: null
        }));
        return;
    }

    let file = req.files.file as fileUpload.UploadedFile;

    if (!file) {
        console.log(req.files);
        console.log("bad param!");
        res.send(new UploadError({
            message: "no file named 'file' found in request",
            data: req.files
        }))
        return;
    }

    var extension = path.parse(file.name).ext;
    if (!capabilities.filetypes.includes(extension)) {
        console.log("bad filetype")
        res.send(new UploadError({
            code: 415,
            message: "bad filetype!",
            data: { type: extension, accepted: capabilities.filetypes }
        }))
        return;
    }
    if (!req.body.existing) {
        console.log("missing skip", req.body)
        res.send(new UploadError({
            code: 406,
            message: "missing parameters!",
            data: { missing: "skip" }
        }));
        return;
    }

    var skipChecks: boolean = req.body.existing == "skip" ? false : true;
    console.log("skipChecks", skipChecks);


    var workSheetsFromFile: Array<Array<string>> = xlsx.parse(`${file.tempFilePath}`)[0].data;
    workSheetsFromFile.shift();

    var toWrite: Array<WordIf> = []

    var foundError: boolean = false;

    workSheetsFromFile.forEach((e, i) => {
        if (foundError) return;

        var lang = e[0]
        var newWord = e[1]
        var meaningLang = e[2]
        var meaning = e[3]

        if (!lang || !newWord || !meaningLang || !meaning) {
            foundError = true;
            console.log("missing columns!", e)
            res.send(new UploadError({
                code: 407,
                message: "missing columns!",
                data: e
            }));
            return;
        }

        var word: WordIf = {
            meanings: {
                orig: {
                    lang,
                    word: newWord
                },
                meaning: {
                    lang: meaningLang,
                    word: meaning
                }
            },
            correctGuesses: 0,
            incorrectGuesses: 0
        }
        toWrite.push(word);
    });
    if (foundError) return console.log("found error");

    console.log(toWrite);

    if (req.body.cold_run) {
        console.log("cold run");
    } else {
        await parseXls({ decodedData: toWrite, skip: skipChecks, db, res });
    }


    for (const file of fs.readdirSync(config.tmpFolder)) {
        fs.unlinkSync(path.join(config.tmpFolder, file));
    }

    res.send({ error: false });

    //res.redirect("/success.html");
    //res.redirect("/error.html");

});

interface Guess {
    word: string
    lang: string
    guessWord: string
    guessLang: string
}
const isGuess = (value: Guess): value is Guess => !!value?.word;

app.get("/api/v1/guess", async (req, res) => {

    if (!isGuess(req.query as unknown as Guess)) {
        console.log(req.query);
        res.send(new UploadError({
            code: 406,
            message: "missing parameters",
        }));
        return;
    }

    var body: Guess = req.query as unknown as Guess;

    var filter: DbWordIf = {
        "meanings.meaning.lang": body.guessLang,
        "meanings.meaning.word": body.guessWord,
        "meanings.orig.lang":    body.lang,
        "meanings.orig.word":    body.word
    }
    console.log(filter)
    var resp = await db.getWord(filter)
    console.log(resp)

    if (resp.length != 0) {
        console.log("found something");

        db.modifyVal({
            filter,
            prop: "correctGuesses",
            newVal: resp[0].correctGuesses + 1
        })

        res.send({ error: false, res: true });
        return;
    }
    console.log("wrong word or not in db");

    delete filter['meanings.meaning.word'];
    var resp2 = await db.getWord(filter);
    console.log(resp2);

    if (resp2.length != 0) {
        console.log("found in db");

        db.modifyVal({
            filter,
            prop: "incorrectGuesses",
            newVal: resp2[0].incorrectGuesses + 1
        });

        res.send({ error: false, res: false, correct: resp2[0].meanings.meaning.word });
        return;
    }

    res.send({ error: true, code: 404, message: "word not found" });
    return;
})