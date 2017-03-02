/**
 * Created by dhwani on 2/26/17.
 */
var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var characterSchema= new Schema({
    characterId: {type:String, unique:true, index:true},
    name: String,
    gender: String,
    bloodline: String,
    wins: {type:Number, default:0},
    losses: {type:Number, default:0},
    reports: {type:Number, default:0},
    random: {type:[Number], index:'2d'},
    voted: {type:Boolean, default:false}

});

module.exports = mongoose.model('Character', characterSchema);