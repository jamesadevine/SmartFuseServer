module.exports = function(app,userManager,projectName){

  /*
    --------------------INDEX/API DETAILS!!----------------------
  */

  app.get('/', function (req, res) {
    console.log("index session ",req.session.userID);
    var callback = function(result){

      //render the api details if the user is logged in!
      res.render('index',{
        header:projectName+' Home',
        user:result,
        userContent:[{
            id:"login",
            url:"/api/user/login",
            type:"POST",
            description:"Logs in a user and returns the userid for use with subsequent requests",
            parameters:{
                  email:"A string containing the email address of the user.",
                  password:"A string containing the password for the user, that was previously defined in the registration view."
            },
            expected:{
              content:'{success: "User logged in!",id: "3a28e870-8bd2-11e4-b4b2-55ea3c35d9e2"}'
            },
            error:{
              content:'{error: "User credentials incorrect"}'
            }
          },
          {
            id:"register",
            url:"/api/user/register",
            type:"POST",
            description:"Registers a user with the Smart Fuse Project.",
            parameters:{
                  email:"A string containing the email address of the user.",
                  password:"A string containing the password for the user, this must match the \"confpassword\" parameter.",
                  confpassword:"A string containing the password for the user, this must match the \"password\" parameter.",
                  name:"A string containing the password for the user, that was previously defined in the registration view."

            },
            expected:{
              content:'{success: "User logged in!",id: "3a28e870-8bd2-11e4-b4b2-55ea3c35d9e2"}'
            },
            error:{
              content:'{error: "User credentials incorrect"}'
            }
          },
          {
            id:"putuser",
            url:"/api/user",
            type:"PUT",
            description:"Updates the user object stored in MongoDB",
            parameters:{
                  id:"A string containing the id of the user.",
                  name:"A string containing the name of the user.",
                  email:"A string containing the email address of the user.",
                  countryCode:"A string containing the countryCode of the user.",
                  houseSize:"A string containing the houseSize of a user, is selected throught the app."
            },
            expected:{
              content:'{success:"User updated!"}'
            },
            error:{
              content:'{error:"User could not be updated"}'
            }
          },
          {
            id:"deluser",
            url:"/api/user",
            type:"DELETE",
            description:"Deletes the user object stored in MongoDB",
            parameters:{
                  userID:"A string containing the id of the user."
            },
            expected:{
              content:'{success:"User removed!"}'
            },
            error:{
              content:'{error:"User couldn\'t be removed}'
            }
          }],
      hubContent:[{
            id:"posthub",
            url:"/api/hub",
            type:"POST",
            description:"Links a user account with a hub",
            parameters:{
                  userID:"A string containing the id of the user",
                  hubID:"A string containing the hub the user is trying to link"
            },
            expected:{
              content:'{success: "Hub added"}'
            },
            error:{
              content:'{"error": "Hub couldn\'t be added"}'
            }
          },
          {
            id:"delhub",
            url:"/api/hub",
            type:"DELETE",
            description:"Removes a hub from the system",
            parameters:{
                  hubID:"A string containing the hub the user is trying to remove"

            },
            expected:{
              content:'{success: "Hub removed"}'
            },
            error:{
              content:'{error: "Hub couldn\'t be removed"}'
            }
          },
          {
            id:"gethub",
            url:"/api/hub",
            type:"GET",
            description:"Retrieves a hub object using the mac address - used by the hub to fetch its' owner!\n Creates a hub object if this hub is new, otherwise retrieves the object",
            parameters:{
                  macaddr:"The macaddress of the hub trying to fetch its' owner!"
            },
            expected:{
              content:'{success:"Hub retrieved!", hub:{HUB OBJECT}}'
            },
            error:{
              content:'{error:"Hub not linked!", hub:{HUB OBJECT}}'
            }
          },
          {
            id:"gethubs",
            url:"/api/hubs",
            type:"GET",
            description:"Retrieves a list of hubs owned by the user",
            parameters:{
                  userID:"A string containing the id of the user",
            },
            expected:{
              content:'{success:"Hubs retrieved!", hubs:[HUB OBJECTs]}'
            },
            error:{
              content:'{success:"Hubs retrieved!", hubs:[EMPTY ARRAY]}'
            }
          }],
      fuseContent:[
          {
            id:"getfuses",
            url:"/api/fuses",
            type:"GET",
            description:"Gets the fuses based on a supplied user ID",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
            },
            expected:{
              content:'{success: "Fuses retrieved",fuses: [array of fuses]}'
            },
            error:{
              content:'{success: "Fuses retrieved",fuses: [empty array]}'
            }
          },
          {
            id:"fusessummary",
            url:"/api/fuses/summary",
            type:"GET",
            description:"Gets the users fuse summary for the date given",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  date:"A string containing the desired date for summary in the format DD-MM-YYYY"
            },
            expected:{
              content:'{success: "Fuse summary retrieved",summary: {summary object}}'
            },
            error:{
              content:'None'
            }
          },
          {
            id:"addfuse",
            url:"/api/fuse/add [DEPRECATED]",
            type:"POST",
            description:"Adds a fuse manually to Smart Fuse Project [DEPRECATED in favour of adddata]",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  fuseID:"The ID of the fuse to add.",
                  fuseName:"The symbolic name of the fuse"
            },
            expected:{
              content:'{success: "Fuses retrieved",fuses: []}'
            },
            error:{
              content:'{error: "Fuse already exists"}'
            }
          },
          {
            id:"uploadfuse",
            url:"/api/fuse/upload",
            type:"POST",
            description:"Uploads an image in base 64 format to the server.",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  fuseID:"The ID of the fuse to upload an icon for.",
                  image:"The base 64 string of the image."
            },
            expected:{
              content:'{success: "Fuse data added"}'
            },
            error:{
              content:'{error: "Fuse not found"}'
            }
          },
          {
            id:"getfuse",
            url:"/api/fuse",
            type:"GET",
            description:"Gets a singular fuse based on a user ID and a fuse ID",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  fuseID:"The ID of the fuse to fetch.",
            },
            expected:{
              content:'{success: "Fuse retrieved",fuse: [fuse object]}'
            },
            error:{
              content:'{error: "Fuse not found"}'
            }
          },
          {
            id:"postfuse",
            url:"/api/fuse/",
            type:"POST",
            description:"If the fuse exists it adds an item to the data array - otherwise it creates it.\nManual creation can be manged by using the /api/fuse/add url\n Also notifys any live data listeners! COOL!",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  fuseID:"The ID of the fuse to add.",
                  fuseVal:"The data to be added"
            },
            expected:{
              content:'{success: "Fuse data added"}'
            },
            error:{
              content:'{error: "Fuse not found"}'
            }
          },
          {
            id:"putfuse",
            url:"/api/fuse/",
            type:"PUT",
            description:"Updates the details of fuse held on the server.",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  fuseID:"The ID of the fuse to upload an icon for.",
                  fuseName:"The new name of the fuse",
                  fuseDescription:"The new description of the fuse",
            },
            expected:{
              content:'{success: "Fuse data added"}'
            },
            error:{
              content:'{error: "Fuse not found"}'
            }
          },
          {
            id:"delfuse",
            url:"/api/fuse",
            type:"DELETE",
            description:"Removes a fuse from the Smart Fuse Project",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  fuseID:"The ID of the fuse to remove."
            },
            expected:{
              content:'{success: "Fuse removed"}'
            },
            error:{
              content:'{error: "Fuse couldn\'t be removed"}'
            }
          },
          {
            id:"fusesummary",
            url:"/api/fuse/summary",
            type:"GET",
            description:"Fetches the seven day summary for the selected fuse",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  fuseID:"The ID of the fuse to fetch the summary for."
            },
            expected:{
              content:'{success: "Fuse summary retrieved",summary:{SUMMARY OBJECT}}'
            },
            error:{
              content:'{error: "Fuse not found"}'
            }
          }
      ]
    });
  };

  var currentUser = userManager.get(req.session.userID,callback);
    
  }),

  /*
    --------------------LOGIN----------------------
  */

  app.get('/login', function (req, res) {
    res.render('login',{header:projectName+' Login'});
  }),

  /*
    --------------------REGISTER----------------------
  */

  app.get('/register', function (req, res) {
    res.render('register',{header:projectName+' Register'});
  }),

  /*
    --------------------LOGOUT----------------------
  */

  app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
  });
};