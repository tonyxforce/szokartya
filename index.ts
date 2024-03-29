const { existsSync, writeFileSync, readFileSync } = require("fs");
const { default: chalk } = require("chalk");
const { env } = require("process");
require("dotenv").config();
import * as express from 'express'
var app = express();
let path = require("path")
var config = require("./config.js");
import { DBClient } from "./dbManage"
import { text } from 'body-parser';

import * as deepl from 'deepl-node';
const translator = new deepl.Translator(env.DEEPL_KEY);



if (!existsSync(".env")) {
    console.error(chalk.red("No .env file!"))
    console.warn(chalk.yellow("retrieving from example..."));
    writeFileSync(".env", readFileSync(".env.example"));
}

var db: DBClient;

const bodyParser = require('body-parser');

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")))

app.listen(config.port, async () => {
    console.log(`listening on port ${config.port}`);
    db = await DBClient.init(env.MONGOURL);
})

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

    var resp = await db.createNew({ newWord, lang, meaning, meaningLang }, ignoreWarning);
    if (resp.error) {
        if (resp.code == 409) {
            res.status(409);
            res.send({ error: true, message: "content already exists!", code: 409, firstlast: resp.firstlast });
            return;
        }
        res.status(resp.code ? resp.code : 400);
        res.send({ error: true, message: "something went wrong!", code: resp.code ? resp.code : 400 });
        return;

    }
    resp.error = false;
    res.send(resp);
})

app.get("/api/v1/getWord", async (req: express.Request, res: express.Response) => {
    var wordToGet: String = req.query.word.toString();
    var origLang: String = req.query.origLang.toString();
    var meaningLang: String = req.query.meaningLang.toString();

    if (!wordToGet || !origLang || !meaningLang) {
        res.status(400);
        res.send({ error: true, message: "missing parameters!", code: 400 });
        return;
    }
    var word = await db.getWord({ "meanings.orig.word": wordToGet, "meanings.orig.lang": origLang, "meanings.meaning.lang": meaningLang });
    if (word.length = !0)
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

app.get("/api/v1/getCount", async(req, res)=>{
    var resp = await db.getCount();
/*     if(resp.error){
        res.status(400);
        res.send({error: true, code: resp.code});
        return;
    } */
    res.send({error: false, count: resp})
})