var fs = require("fs");
var config = require("../config.json");
var wikiFS = require("./wikiFS.node.js");

var marked = require("./marked.js");
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
  app.get("/", redirectToFront)
  app.get(/^\/!public\/.*$/, publicfile);
  app.get(/^.*\.[^.\/]+$/, wikiApp.staticFiles);
  app.get(/^.*\/[^.\/]+$/, wikiGetRoute);
  app.post(/^.*\/[^.\/]+$/, wikiPostRoute);
}

var saveDir = config.wikiDir;
function redirectToFront(req, res){
  res.redirect("/" + config.frontPage);
}
function wikiGetRoute(req, res){
  if("edit" in req.query){
    wikiApp.edit(req, res);
  } else if ("attach" in req.query){
    wikiApp.attach(req, res);
  } else if ("move" in req.query){
    wikiApp.moveForm(req, res);
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
  var path  = decodeURIComponent(req.path);
  wikiFS.readWiki(path, function(err, data){
    if(err) {
      console.log(err);
      data = null;
    } else {
      data = marked(data);
      //data = converter.makeHtml(data);
    }
    res.render("view", {title : "Wiki Note", wikiData: data});
  });
}
wikiApp.edit = function(req, res){
  var path  = decodeURIComponent(req.path);
  wikiFS.readWiki(path, function(err, data){
    res.render("edit", {title : "Wiki Note::edit", wikiData: data});
  });
}
wikiApp.save = function(req, res){
  var path = req.path;
  var data = req.param("data");
  wikiFS.writeWiki(decodeURIComponent(path), data, function(err){
    res.redirect(path); 
  });
}
wikiApp.moveForm = function(req, res){
  res.render("move", {title : "Wiki Note::move"});
}
wikiApp.move = function(req, res){
  wikiFS.move(decodeURIComponent(req.path), decodeURIComponent(req.param("target")), function(){
      res.redirect(req.param("target"));
  });
}
wikiApp.attach = function(req, res){
  var path = decodeURIComponent(req.path);
  wikiFS.fileList(path, function(err, files){
    res.render("attach", {title : "Wiki Note::attach", files: files || []});
  });
}
wikiApp.upload = function(req, res){
  var file = req.files.upload;
  wikiFS.acceptFile(file.path, decodeURIComponent(req.path), file.name, function(err){
    if(err) {console.log(err); res.send(500); return;}
    res.redirect(decodeURIComponent(req.path) + "?attach");
  });
}
wikiApp.staticFiles = function(req, res){
  res.sendfile(saveDir + decodeURIComponent(req.path));
}
