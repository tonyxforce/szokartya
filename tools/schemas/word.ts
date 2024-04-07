import mongoose from "mongoose";

export interface WordIf{
    meanings: {
        orig: {
            lang: string,
            word: string,
        },
        meaning: {
            lang: string,
            word: string,
        },
    },
    correctGuesses: number,
    incorrectGuesses: number
}


export interface OptionalWordIf{
    meanings?: {
        orig?: {
            lang?:      string,
            word?:      string,
        },
        meaning?: {
            lang?:      string,
            word?:      string,
        },
    },
    correctGuesses?:    number,
    incorrectGuesses?:  number
}

export interface DbWordIf {
    "meanings"?:                string,
    "meanings.orig"?:           object,
    "meanings.orig.lang"?:      string,
    "meanings.orig.word"?:      string,
    "meanings.meaning"?:        object,
    "meanings.meaning.lang"?:   string,
    "meanings.meaning.word"?:   string,
    correctGuesses?: number,
    incorrectGuesses?: number
}

var WordSchema = new mongoose.Schema<WordIf>({
    meanings: {
        orig: {
            lang: String,
            word: String,
        },
        meaning: {
            lang: String,
            word: String,
        },
    },
    correctGuesses: Number,
    incorrectGuesses: Number
});

export default WordSchema;


