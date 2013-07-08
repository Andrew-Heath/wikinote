var fs = require("fs");
var config = require("../config.json");
var wikiFS = require("./wikiFS.node.js");

var marked = require("./marked.js");

var Path = require("./path.node.js");

marked.setOptions({
	gfm: true,
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: false,
	smartLists: true
});

exports.init = function(app){
	//app.get("!list", listAll);
	app.get("/", redirectToFront);
	app.get(/^\/!public\/.*$/, publicfile);
	app.get(/^.*\.[^.\/]+$/, wikiApp.staticFiles);
	app.get(/^.*\/[^.\/]+$/, wikiGetRoute);
	app.post(/^.*\/[^.\/]+$/, wikiPostRoute);
}

exports.preModule = function(req, res, next){
	req.wikiPath = new Path(req.path);
	res.locals.path = req.path;
	res.locals.bread = req.wikiPath.toArray();
	res.locals.notename = req.wikiPath.name;
	next();
}

var saveDir = config.wikiDir;
function redirectToFront(req, res){
	if("find" in req.query){
		wikiApp.find(req, res);
	} else {
		res.redirect("/" + config.frontPage);
	}
}
function wikiGetRoute(req, res){
	if("edit" in req.query){
		wikiApp.edit(req, res);
	} else if ("attach" in req.query){
		wikiApp.attach(req, res);
	} else if ("move" in req.query){
		wikiApp.moveForm(req, res);
	} else if ("presentation" in req.query){
		wikiApp.presentation(req, res);
	} else if("find" in req.query){
		wikiApp.find(req, res);
	} else {
		wikiApp.view(req, res);
	}
}
function wikiPostRoute(req, res){
	if("edit" in req.query){
		wikiApp.save(req, res);
	} else if ("attach" in req.query){
		wikiApp.upload(req, res);
	} else if ("move" in req.query){
		wikiApp.move(req, res);
	}
}
function publicfile(req, res){
	res.sendfile(req.path.substring(2));
}

var wikiApp = {};

wikiApp.view = function(req, res){
	wikiFS.readWiki(req.wikiPath, function(err, data){
		if(err) {
			console.log(err);
			data = null;
		} else {
			data = marked(data);
		}
		res.render("view", {title : "Wiki Note", wikiData: data});
	});
}
wikiApp.edit = function(req, res){
	wikiFS.readWiki(req.wikiPath, function(err, data){
		res.render("edit", {title : "Wiki Note::Edit", wikiData: data});
	});
}
wikiApp.save = function(req, res){
	var data = req.param("data");
	wikiFS.writeWiki(req.wikiPath, data, function(err){
		res.redirect(req.path); 
	});
}
wikiApp.moveForm = function(req, res){
	res.render("move", {title : "Wiki Note::Move"});
}
wikiApp.move = function(req, res){
	wikiFS.move(req.wikiPath, new Path(req.param("target")), function(){
		res.redirect(req.param("target"));
	});
}
wikiApp.attach = function(req, res){
	wikiFS.fileList(req.wikiPath, function(err, files){
		res.render("attach", {title : "Wiki Note::Attach", files: files || []});
	});
}
wikiApp.upload = function(req, res){
	var file = req.files.upload;
	wikiFS.acceptFile(file.path, req.wikiPath, file.name, function(err){
		if(err) {console.log(err); res.send(500); return;}
		res.redirect(req.path + "?attach");
	});
}
wikiApp.staticFiles = function(req, res){
	res.sendfile(saveDir + decodeURIComponent(req.path));
}
wikiApp.presentation = function(req, res){
	wikiFS.readWiki(req.wikiPath, function(err, data){
		var option = {}; 
		try {
			option = JSON.parse(data.match(/^<!--({.*})-->/)[1]);
		} catch (e){
		}
		res.render("presentation", {title : "Wiki Note::Presentation", wikiData: data, option : option});
	});
}
wikiApp.find = function(req, res){
	var word = req.param("find");
	if(word == ""){
		res.render("find", {title : "Wiki Note::Find", finddata : null});
		return;
	}
	wikiFS.find(req.wikiPath, word, function(e, data){
		res.render("find", {title : "Wiki Note::Find", finddata : data});
	});
}
