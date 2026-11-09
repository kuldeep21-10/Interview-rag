import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({

text:{type:String,
    required:true
},
topic:{
    type:String,
    required:true
},
difficulty:{
    type:String,
    enum:["easy", "medium", "hard"],
    required:true
},
idealAnswer:{
    type:String
}


},{timestamps:true});

export const question = mongoose.model('question',questionSchema);