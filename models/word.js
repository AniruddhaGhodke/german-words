import { Schema, model, models } from "mongoose";

const WordSchema = new Schema ({
    email: {
        type: String,
        required: [true, 'email is required']
    },
    data: {
        type: Array,
        required: [true, 'data is required']
    }
})

const Word = models.Word || model('Word', WordSchema);

export default Word;