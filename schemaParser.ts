import word, {WordIf} from "./tools/schemas/word"
import mongoose from "mongoose";

export var Word         =   mongoose.model<WordIf>( "Word",          word, "words"    );
export {WordIf, OptionalWordIf, DbWordIf} from "./tools/schemas/word"