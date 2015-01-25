module.exports = {
  init:function (mongoinstance,uuid){
    this.mongoose=mongoinstance;

    this.uuid = uuid;

    this.Hub = this.mongoose.model('Hub',{
      id:String,
      ownerid:String,
      macaddr:String,
      name:String
    });
    //this.Hub.remove().exec();
  },
  retrieve:function(macaddr,callback){
    var uuid = this.uuid;
    var User = this.User;
    this.Hub.findOne({macaddr:macaddr},function (err, hub) {
      if (err){
        callback(-1);
        return;
      }
      if(hub===null){
        var newHub = new Hub({id:uuid.v1(),macaddr:macaddr});
        newHub.save(function (err, hub) {
          if (err){
            callback(-1,null);
            return;
          }
          callback(true,hub);
          return;
        });
      }else{
        callback(-1,null);
        return;
      }
    });
    
  },
  remove:function(id,callback){
    this.Hub.remove({id:id},function (err) {
      if (err){
        callback(false);
        return;
      }
      callback(true);
      return;
    });
  },
  linkHub:function(id,hubid,callback){
    var User = this.User;
    this.Hub.findOne({id:hubid},function (err, hub) {
      if (err||hub===null){
        callback(-1);
        return;
      }
      if(hub.ownerid !== undefined){
        callback(-1);
        return;
      }else{
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
  getHubs:function(userid,callback){
    this.User.find({ownerid:userid},function (err, hubs) {
      if (err){
        callback(-1);
        return;
      }
      for(var i =0;i<hubs.length;i++)
        hubs.macaddr=undefined;
      callback(true,hubs);
      return;
    });
  }
};