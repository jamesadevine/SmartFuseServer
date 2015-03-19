module.exports = {
  init:function (mongoinstance,uuid){
    this.mongoose=mongoinstance;

    this.uuid = uuid;

    //get the model
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
  //add a user to the system (Register function)
  add:function(email,name,password,callback){
    //give instance of the uuid and user schema objects
    var uuid = this.uuid;
    var User = this.User;
    this.User.findOne({email:email},function (err, user) {
      if (err){
        callback(-1);
        return;
      }
      //check if the user exists
      if(user===null){
        //if not create the user
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
        //else return an error.
        callback(-1,null);
        return;
      }
    });  
  },
  //remove the user from the system
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
  //update user details tored in the server
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
        //update and save!
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
  //checks for the existance of user, and returns a user object if exists
  login:function(email,password,callback){

    this.User.findOne({email:email,password:password},function (err, user) {
      if (err){
        callback(-1);
        return;
      }

      //check if user exists
      if(user === null){
        //user doesn't return error
        callback(-1);
        return;
      }else{
        //otherwise return the user object with the password omitted.
        user.password=undefined;
        callback(user);
        return;
      }
    });
  },
  //get a user based on a user id
  get:function(id,callback){
    this.User.findOne({id:id},function (err, user) {
      if (err){
        callback(-1);
        return;
      }
      //return the user
      callback(user);
      return;
    });
  }
};