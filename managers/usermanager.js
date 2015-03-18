module.exports = {
  init:function (mongoinstance,uuid){
    this.mongoose=mongoinstance;

    this.uuid = uuid;

    this.User = this.mongoose.model('User',{
      id:String,
      email:String,
      name:String,
      password:String,
      countryCode:String,
      houseSize:String,
    });
    //this.User.remove().exec();
  },
  add:function(email,name,password,callback){
    var uuid = this.uuid;
    var User = this.User;
    this.User.findOne({email:email},function (err, user) {
      if (err){
        callback(-1);
        return;
      }
      if(user===null){
        var newUser = new User({id:uuid.v1(),email:email,name:name,password:password,countryCode:"uk",houseSize:"medium",hubs:[]});
        newUser.save(function (err, user) {
          if (err){
            callback(-1,null);
            return;
          }
          user.password = undefined;
          callback(true,user);
          return;
        });
      }else{
        callback(-1,null);
        return;
      }
    });
    
  },
  remove:function(id,callback){
    this.User.remove({id:id},function (err) {
      if (err){
        callback(false);
        return;
      }
      callback(true);
      return;
    });
  },
  update:function(id,name,email,countryCode,houseSize,callback){
    this.User.findOne({id:id},function (err, user) {
      if (err){
        callback(-1);
        return;
      }

      if(user === null){
        console.log("null",user);
        callback(-1);
      }else{
        user.name=name;
        user.email=email;
        user.countryCode=countryCode;
        user.houseSize = houseSize;
        user.save(function(err){
          if (err){
            console.log("ERR ",err);
            callback(-1);
            return;
          }
          callback(true);
          return;
        });
      }
    });
  },
  login:function(email,password,callback){

    console.log(email,password);

    this.User.findOne({email:email,password:password},function (err, user) {
      if (err){
        callback(-1);
        return;
      }
      console.log("login: ",user," type: ",typeof user);
      if(user === null){
        callback(-1);
        return;
      }else{
        user.password=undefined;
        callback(user);
        return;
      }
    });
  },
  get:function(id,callback){
    this.User.findOne({id:id},function (err, user) {
      if (err){
        callback(-1);
        return;
      }
      callback(user);
      return;
    });
  }
};