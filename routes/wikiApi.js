var wikiFS = require("../app/wikiFS");
var config = require("../config");
var userApp = require("./userApp");
var user = require("../app/user")
var WikiPath = require("./wikipath");

exports.save = function(req, res){
	var data = req.param("data");
	var location = req.param("location");
    var wikipath = new WikiPath(location);

	wikiFS.writeWiki(wikipath, data, req.session.user, function(err){
		if(err) return res.status(500).json(err);
		res.status(200).json({});
	});
}