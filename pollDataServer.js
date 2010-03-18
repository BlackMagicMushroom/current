var fu = require("./lib/fu");
var sys = require('sys');
require("./client-side/js/underscore");
var lpb = require("./lib/longpollingbuffer");
var url = require("url");

HOST = null; // localhost
PORT = 8070;

sys.exec("echo $SITESV_SERVER_HOST", function (err, stdout, stderr) {
  if (err) throw err;
  thehost = stdout.trim();
  if(thehost !== ''){
      HOST = thehost
  }
});

sys.exec("echo $SITESV_SERVER_PORT", function (err, stdout, stderr) {
  if (err) throw err;
  theport = stdout.trim();
  if(theport !== ''){
      PORT = theport
  }
});


// Now start the program
fu.listen(PORT, HOST);
var rb = new lpb.LongPollingBuffer(70);
var dump = process.createChildProcess("tcpdump",["-i","en1","-A","-n","port", "80"]);
var ignorelist = ['localhost','foxnews.com'];
//Setup the listener to handle the flow of data from the dump 
dump.addListener("output", function (data) {    
    var hosts = data.match(/Host: (.*)/g);
    if(hosts){
        _.each(hosts, function(item){
            var out = item.slice(6);
            sys.puts(out);
            if(!_.detect(ignorelist, function(s){ return (item.indexOf(s) > -1); })){
                rb.push(out);
            }
            
        });    
    }
});


//Setup the updater page for long polling  
fu.get("/update", function (req, res) {
      res.sendHeader(200,{"Content-Type": "text/html"});
      var thesince;
      if(url.parse(req.url,true).hasOwnProperty('query') && url.parse(req.url,true).query.hasOwnProperty('since')){
          thesince = parseInt(url.parse(req.url,true)['query']['since']);
      }
      else {
          thesince = -1;
      }
      rb.addListenerForUpdateSince(thesince, function(data){
           var body = '['+_.map(data,JSON.stringify).join(',\n')+']';
           res.write( body );
           res.close();
      });
});
  
// Static Files
fu.get("/", fu.staticHandler("./client-side/index.html"));
fu.get("/css/site.css", fu.staticHandler("./client-side/css/site.css"));
fu.get("/js/underscore.js", fu.staticHandler("./client-side/js/underscore.js"));
fu.get("/js/site.js", fu.staticHandler("./client-side/js/site.js"));

//images
fu.get("/images/about-current.png", fu.staticHandler("./client-side/images/about-current.png"));
fu.get("/images/blank-favicon.png", fu.staticHandler("./client-side/images/blank-favicon.png"));
fu.get("/images/current-back.png", fu.staticHandler("./client-side/images/current-back.png"));
fu.get("/images/download-source-roll.png", fu.staticHandler("./client-side/images/download-source-roll.png"));
fu.get("/images/download-source.png", fu.staticHandler("./client-side/images/download-source.png"));
fu.get("/images/get-current.png", fu.staticHandler("./client-side/images/get-current.png"));
fu.get("/images/logo.png", fu.staticHandler("./client-side/images/logo.png"));
fu.get("/images/medium-labs.png", fu.staticHandler("./client-side/images/medium-labs.png"));
fu.get("/images/node-js-roll.png", fu.staticHandler("./client-side/images/node-js-roll.png"));
fu.get("/images/node-js.png", fu.staticHandler("./client-side/images/node-js.png"));
fu.get("/images/pause.png", fu.staticHandler("./client-side/images/pause.png"));
fu.get("/images/play.png", fu.staticHandler("./client-side/images/play.png"));
fu.get("/favicon.ico", fu.staticHandler("./client-side/images/favicon.ico"));

  
  