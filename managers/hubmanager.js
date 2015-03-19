module.exports = {
  init:function (mongoinstance,uuid){
    this.mongoose=mongoinstance;

    this.uuid = uuid;

    //set up mongoose model object
    this.Hub = this.mongoose.model('Hub',{
      id:String,
      ownerid:String,
      macaddr:String,
      name:String
    });
    //this.Hub.remove().exec();
  },
  //fetch a hub based on the mac address
  retrieve:function(macaddr,callback){
    console.log(macaddr);
    var uuid = this.uuid;
    var Hub = this.Hub;
    this.Hub.findOne({macaddr:macaddr},function (err, hub) {
      if (err){
        callback(-1);
        return;
      }
      //check if the hub exists...
      if(hub===null||typeof hub === 'undefined'){
        //if it doesn't exist... create
        var newHub = new Hub({id:uuid.v1(),macaddr:macaddr});
        //save
        newHub.save(function (err, hub) {
          if (err){
            callback(-1,null);
            return;
          }
          callback(-1,hub);
          return;
        });
      }else{
        //check if this hub has an owner
        if(hub.ownerid === undefined){
          //it doesn't so return an error
          callback(-1,hub);
          return;
        }else{
          // if it has an owner, return the hub object
          callback(true,hub);
          return;
        }
      }
    });
    
  },
  //remove the hub from the system
  remove:function(id,ownerid,callback){
    this.Hub.remove({id:id,ownerid:ownerid},function (err) {
      if (err){
        callback(false);
        return;
      }
      callback(true);
      return;
    });
  },
  //update the hub details (Name only)
  update:function(id,ownerid,name,callback){
    this.Hub.findOne({id:id,ownerid:ownerid},function (err,hub) {
      if (err){
        callback(-1);
        return;
      }
      //check for hub existance
      if(hub === null){
        //return an error
        callback(-1);
      }else{
        //update name for the found hub
        hub.name=name;
        hub.save(function(err){
          if (err){
            callback(-1);
            return;
          }
          callback(true);
          return;
        });
      }
    });
  },
  //Links a hub to a user account
  linkHub:function(id,hubid,callback){

    this.Hub.findOne({id:hubid},function (err, hub) {
      if (err||!hub){
        callback(-1);
        return;
      }
      //check if ownerid is already defined
      if(hub.ownerid !== undefined){
        //if it is return an error
        callback(-1);
        return;
      }else{
        //otherwise link the hub!
        hub.ownerid=id;
        hub.name ="Your new Hub!";
        hub.save(function(err){
          if (err){
            callback(-1);
            return;
          }else{
            callback(true);
            return;
          }
        });
      }
    });
  },
  //retrieve the hubs for a user
  getHubs:function(userid,callback){
    this.Hub.find({ownerid:userid},function (err, hubs) {
      if (err){
        callback(-1);
        return;
      }
      //don't return the macaddress of the hubs!
      for(var i =0;i<hubs.length;i++)
        hubs.macaddr=undefined;
      callback(true,hubs);
      return;
    });
  }
};