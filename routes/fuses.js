module.exports = function(app,commonFunctions,fuseManager,userManager,hubManager){
  /*
    --------------------Fuses FETCH----------------------
  */
  app.get('/api/fuses', function (req, res) {

    var required = ["userID"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }


    commonFunctions.logRequest("/api/fuses",req.query);
    var outerCallback = function(result,hubs){
      var callback = function(fuses){

        var returnObject = {};
        console.log(hubs);
        console.log(fuses);
        for(var i=0;i<hubs.length;i++){
          var hubsFuses = fuses.filter(function(el){
            return el.hubID==hubs[i].id;
          });
          console.log('hubsfuses',hubsFuses,hubs[i].name);
          returnObject[String(hubs[i].name)]=hubsFuses;
        }

        res.status(200).json({success:"Fuses retrieved",fuses:returnObject});
      };

      fuseManager.getFusesByOwner(req.query.userID,callback);
    };
    hubManager.getHubs(req.query.userID,outerCallback);
    
    
  });

  /*
    --------------------Fuses Summary----------------------
  */
  app.get('/api/fuses/summary', function (req, res) {
    var required = ["userID","date"];
    var allParams = commonFunctions.checkParams(req.query,required);
    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    commonFunctions.logRequest("/api/fuses/summary",req.query);
    var callback = function(result){
      res.status(200).json({success:"Fuse summary retrieved",summary:result});
    };
    var callback2 = function(user){
      fuseManager.getSummaryData(user,req.query.userID,req.query.date,callback);
    };
    userManager.get(req.query.userID,callback2);
    
  });
};