/**
 * Created by dhwani on 2/26/17.
 */

var xml2js = require('xml2js');

module.exports = function(app) {
    app.post('/api/characters', function (req, res, next) {
        var characterName = req.body.name;
        var gender = req.body.gender;
        console.log(characterName);
        parser = new xml2js.Parser();
        var characterIdSearch = 'https://api.eveonline.com/eve/CharacterID.xml.aspx?names=' + characterName;
        request.get(characterIdSearch, function (err, request, xml) {
            if (err) {
                console.log(err.message);
            }
            parser.parseString(xml, function (err, result) {
                if (err) {
                    console.log("error in xml parsing" + err);
                    return next(err);
                }
                var  characterId = result.eveapi.result[0].rowset[0].row[0].$.characterID;
                if (characterId > 0) {
                    Character.findOne({characterId: characterId}, function (err, character) {
                        if (err) {
                            console.error("can't find characterId ");
                            return next(err);
                        }
                        if (character) {
                            return res.status(409).send({message: characterName + 'is already exist'})
                        }
                        fetchCharacterById(characterId, gender)
                    })
                }
            })
        });

        function fetchCharacterById(characterId, gender){
            var characterInfo='https://api.eveonline.com/eve/CharacterInfo.xml.aspx?characterID=' + characterId;
            request.get(characterInfo, function (err, request, xml) {
                if (err) {
                    return console.log(err.message);
                }
                parser.parseString(xml, function (err, parsedXml) {
                    if (err) {
                        return console.log("error in xml parsing" + err);
                    }
                    var name = parsedXml.eveapi.result[0].characterName[0];
                    var race = parsedXml.eveapi.result[0].race[0];
                    var bloodline = parsedXml.eveapi.result[0].bloodline[0];
                    var character = new Character({
                        characterId: characterId,
                        name: name,
                        race: race,
                        bloodline: bloodline,
                        gender: gender,
                        random: [Math.random(), 0]
                    });

                    character.save(function(err) {
                        if (err)
                            console.error(err);
                        res.send({ message: characterName + ' has been added successfully!' });
                    });
                })
            });
        }
    });

    app.get('/api/characters', function (req, res, next) {
        var num=1;
        var gender = (num == 0 ? 'female' : 'male');
        Character.find({random : {$near :[Math.random(), 0]}})
            .where('voted',false)
            .where('gender',gender)
            .limit(2)
            .exec(function(err,characters){
                if(err){
                    return next(err)
                }
                return res.send(characters)
            })
    });

    app.get('/api/characters/search', function (req, res, next) {
        var name = new RegExp(req.query.name, 'i');
        Character.findOne({name:name},function(err,character){
            if(err){
                return next(err)
            }
            if(!character){
                return res.status(404).send()
            }
            return res.send(character)
        })
    });

    app.get('/api/characters/shame', function(req, res, next) {
        Character
            .find()
            .sort('-losses')
            .limit(100)
            .exec(function(err, characters) {
                if (err) return next(err);
                res.send(characters);
            });
    });

    app.get('/api/characters/top', function(req, res, next) {
        var params = req.query;
        var conditions = {};

        for (var propName in params) {
            conditions[propName] = new RegExp('^' + req.query[propName] + '$', 'i');
        }

        Character
            .find(conditions)
            .sort('-wins')
            .limit(100)
            .exec(function(err, characters) {
                if (err) return next(err);
                res.send(characters);
            });
    });

    app.get('/api/characters/count', function(req, res, next) {
        Character.count({}, function(err, count) {
            if (err) return next(err);
            res.send({ count: count });
        });
    });

    app.get('/api/characters/:id', function (req, res, next) {
        var id = req.params.id;
        Character.findOne({characterId:id},function(err,character){
                if(err){
                    return next(err)
                }
                if(!character){
                    return res.status(404).send()
                }
                return res.send(character)
            })
    });


    app.put('/api/characters', function (req, res, next) {
        var id = req.body.characterId;
        var isWinner = (req.body.winner)? true : false;
        Character.findOne({characterId:id},function(err,character){
            if(err){
                return next(err)
            }
            if(!character){
                return res.status(404).send()
            }
            if(isWinner){
                character.wins++;
            }else{
                character.losses++;
            }
            character.voted = true;
            character.random = [Math.random(), 0];

            character.save(function (err) {
                if(err){
                    console.log(err);
                    return next(err);
                }
                res.status(200).send(character);
            })
        })
    });

    app.post('/api/report', function(req, res, next){
       var id = req.body.characterId;
        Character.findOne({characterId:id},function(err,character){
            if(err){
                return next(err);
            }

            if(!character) {
                return res.status(404).send();
            }

            if(character.reports >= 4){
                character.remove();
                return res.status(200).send("Character has been deleted.");
            }
            character.reports++;

            character.save(function (err) {
                if(err){
                    console.log(err);
                    return next(err);
                }
                res.status(200).send(character);
            });
        })
    });
}