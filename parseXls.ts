import ISO6391 from 'iso-639-1';
import { WordIf } from "./schemaparser"
import { DBClient } from './dbManage';
import express from 'express';



export class UploadError {
    constructor({ code, message, data }: { code?: number, message?: string, data?: object }) {
        this.code = code || 409;
        this.message = message;
        this.data = data;
    }
    code: number
    message: string
    data: object
    error: boolean = true
}

export default async ({
    decodedData,
    skip,
    db,
    res
}:
    {
        decodedData: Array<WordIf>,
        skip: boolean,
        db: DBClient,
        res: express.Response
    }): Promise<any> => {


    decodedData.forEach(async (e, i) => {
        e.meanings.meaning.lang = ISO6391.getCode(e.meanings.meaning.lang);
        e.meanings.orig.lang = ISO6391.getCode(e.meanings.orig.lang);
        var resp = await db.createNew(e, skip);
        if ("error" in resp) {
            console.log("error occured!");
            if (resp.code == 409) {
                console.log(`${e.meanings.orig.word} or ${e.meanings.meaning.word} already exists`)
            } else {
                res.send(resp);
            }
        }
    })
    return;
}