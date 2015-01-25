module.exports = function(app,commonFunctions,fuseManager,io){

  /*
    --------------------ADD FUSE (DEPRECATED)----------------------
  */
  app.post('/api/fuse/add', function (req, res) {

    var required = ["userID","fuseID","fuseName"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    commonFunctions.logRequest("/api/fuse/add",req.body);
    var callback = function(result){
      if(result===-1){
        res.status(403).json({error:"Fuse already exists"});
      }else{
        res.status(200).json({success:"Fuse added",fuse:result});
      }
    };
    fuseManager.add(req.body.userID,req.body.fuseID,req.body.fuseName,callback);
    
  }),

  /*
    --------------------Fuse image upload----------------------
  */

  app.post('/api/fuse/upload', function (req, res) {

    var required = ["userID","fuseID","image"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/fuse/upload",req.body);

    var fullUrl = req.protocol + '://' + req.get('host');

    var base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
    var callback = function(result){
      console.log("RESULT ",result);
      if(result!==-1)
        res.status(200).json({success:"Image uploaded"});
      else
        res.status(400).json({error:"Image upload failed"});
    };
    fuseManager.uploadImage(req.body.userID,req.body.fuseID,base64Data,fullUrl,callback);
    
  }),

  /*
    --------------------Fuse edit----------------------
  */

  app.put('/api/fuse/', function (req, res) {

    var required = ["userID","fuseID","fuseName","fuseDescription"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/fuse",req.body);

    var callback = function(result){
      if(result)
        res.status(200).json({success:"Fuse edited"});
      else
        res.status(403).json({error:"Fuse couldn't be edited"});
    };

    fuseManager.editFuse(req.body.userID,req.body.fuseID,req.body.fuseName,req.body.fuseDescription,callback);
    
  }),

  /*
    --------------------Fuse add data----------------------
  */

  app.post('/api/fuse/', function (req, res) {
    var required = ["userID","fuseID","fuseVal"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/fuse/adddata",req.body);

    var callback = function(result,data){
      if(result===-1){
        res.status(404).json({error:"Fuse not found"});
      }else{
        io.sockets.in(req.body.userID).emit("dataAdded",{fuseID:req.body.fuseID,value:data});//
        res.status(200).json({success:"Fuse data added"});
      }
    };
    fuseManager.addData(req.body.userID,req.body.fuseID,req.body.fuseVal,callback);
    
  }),

  /*
    --------------------Fuse delete----------------------
  */

  app.delete('/api/fuse/', function (req, res) {
    var required = ["userID","fuseID"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/fuse",req.body);

    var callback = function(result){
      if(result)
        res.status(200).json({success:"Fuse removed"});
      else
        res.status(403).json({error:"Fuse couldn't be removed"});
    };
    fuseManager.remove(req.body.userID,req.body.fuseID,callback);
    
  }),

  /*
    --------------------GET FUSE----------------------
  */

  app.get('/api/fuse', function (req, res) {

    var required = ["userID","fuseID"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/fuse",req.query);

    var callback = function(result){
      if(result === -1){
        res.status(404).json({error:"Fuse not found"});
      }else{
        res.status(200).json({success:"Fuse retrieved",fuse:result});
      }
    };
    fuseManager.getFuse(req.query.userID,req.query.fuseID,callback);
  }),

  /*
    --------------------Fuse summary----------------------
  */

  app.get('/api/fuse/summary', function (req, res) {
    var required = ["userID","fuseID"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/fuse/summary",req.query);

    var callback = function(result){
      if(result === -1){
        res.status(404).json({error:"Fuse not found"});
      }else{
        res.status(200).json({success:"Fuse summary retrieved",summary:result});
      }
    };
    fuseManager.getSevenDaySummary(req.query.userID,req.query.fuseID,callback);
  });
};