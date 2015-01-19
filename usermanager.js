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
      houseSize:String
    });
    //this.User.remove().exec();
  },
  add:function(email,name,password,callback){
    var newUser = new this.User({id:this.uuid.v1(),email:email,name:name,password:password,countryCode:"uk",houseSize:"medium"});
    newUser.save(function (err, user) {
      if (err)
        callback(-1);
      callback(user.id);
    });
  },
  remove:function(id,callback){

  },
  update:function(id,name,email,countryCode,houseSize,callback){
    this.User.findOne({id:id},function (err, user) {
      if (err)
        callback(-1);
      if(user === null){
        callback(-1);
      }else{
        user.name=name;
        user.email=email;
        user.countryCode=countryCode;
        user.houseSize = houseSize;
        user.save(function(err){
          if (err)
            callback(-1);
          else
            callback(true);
        });
      }
    });
  },
  login:function(email,password,callback){
    this.User.findOne({email:email,password:password},function (err, user) {
      if (err)
        callback(-1);
      console.log("login: ",user," type: ",typeof user);
      if(user === null){
        callback(-1);
      }else{
        user.password=undefined;
        callback(user);
      }
    });
  },
  get:function(id,callback){
    this.User.findOne({id:id},function (err, user) {
      if (err)
        callback(-1);
      console.log("get: ",user);
      callback(user);
    });
  }
};