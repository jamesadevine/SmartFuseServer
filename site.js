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
        energyContent:[{
            id:"stats",
            url:"/api/stats/",
            type:"GET",
            description:"Retrieves all available stats held for the date passed.",
            parameters:{
                  date:"A string in the format DD-MM-YYYY",
            },
            expected:{
              content:'{success: "Stats retrieved!",stats: { STATS OBJECT} }'
            },
            error:{
              content:'{error: "Stats couldn\'t be retrieved for this date.", stats:{}}'
            }
          },
          {
            id:"currentstats",
            url:"/api/stats/current",
            type:"GET",
            description:"Retrieves all available stats with field names beginning with current, for the date passed.",
            parameters:{
                  date:"A string in the format DD-MM-YYYY",
            },
            expected:{
              content:'{success: "Stats retrieved!",stats: { STATS OBJECT} }'
            },
            error:{
              content:'{error: "Stats couldn\'t be retrieved for this date.", stats:{}}'
            }
          },
          {
            id:"historicstats",
            url:"/api/stats/historic",
            type:"GET",
            description:"Retrieves all available stats with field names beginning with historic, for the date passed.",
            parameters:{
                  date:"A string in the format DD-MM-YYYY",
            },
            expected:{
              content:'{success: "Stats retrieved!",stats: { STATS OBJECT} }'
            },
            error:{
              content:'{error: "Stats couldn\'t be retrieved for this date.", stats:{}}'
            }
          },
        ],
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
            description:"Registers a user with the Smart Monitoring Project.",
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
            id:"getappliances",
            url:"/api/appliances",
            type:"GET",
            description:"Gets the appliances based on a supplied user ID",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
            },
            expected:{
              content:'{success: "appliances retrieved",appliances: [array of appliances]}'
            },
            error:{
              content:'{success: "appliances retrieved",appliances: [empty array]}'
            }
          },
          {
            id:"appliancessummary",
            url:"/api/appliances/summary",
            type:"GET",
            description:"Gets the users appliance summary for the date given",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  date:"A string containing the desired date for summary in the format DD-MM-YYYY"
            },
            expected:{
              content:'{success: "appliance summary retrieved",summary: {summary object}}'
            },
            error:{
              content:'None'
            }
          },
          {
            id:"addappliance",
            url:"/api/appliance/add [DEPRECATED]",
            type:"POST",
            description:"Adds a appliance manually to Smart appliance Project [DEPRECATED in favour of adddata]",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  applianceID:"The ID of the appliance to add.",
                  applianceName:"The symbolic name of the appliance"
            },
            expected:{
              content:'{success: "appliances retrieved",appliances: []}'
            },
            error:{
              content:'{error: "appliance already exists"}'
            }
          },
          {
            id:"uploadappliance",
            url:"/api/appliance/upload",
            type:"POST",
            description:"Uploads an image in base 64 format to the server.",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  applianceID:"The ID of the appliance to upload an icon for.",
                  image:"The base 64 string of the image."
            },
            expected:{
              content:'{success: "appliance data added"}'
            },
            error:{
              content:'{error: "appliance not found"}'
            }
          },
          {
            id:"getappliance",
            url:"/api/appliance",
            type:"GET",
            description:"Gets a singular appliance based on a user ID and a appliance ID",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  applianceID:"The ID of the appliance to fetch.",
            },
            expected:{
              content:'{success: "appliance retrieved",appliance: [appliance object]}'
            },
            error:{
              content:'{error: "appliance not found"}'
            }
          },
          {
            id:"postappliance",
            url:"/api/appliance/",
            type:"POST",
            description:"If the appliance exists it adds an item to the data array - otherwise it creates it.\nManual creation can be manged by using the /api/appliance/add url\n Also notifys any live data listeners! COOL!",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  applianceID:"The ID of the appliance to add.",
                  applianceVal:"The data to be added"
            },
            expected:{
              content:'{success: "appliance data added"}'
            },
            error:{
              content:'{error: "appliance not found"}'
            }
          },
          {
            id:"putappliance",
            url:"/api/appliance/",
            type:"PUT",
            description:"Updates the details of appliance held on the server.",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  applianceID:"The ID of the appliance to upload an icon for.",
                  applianceName:"The new name of the appliance",
                  applianceDescription:"The new description of the appliance",
            },
            expected:{
              content:'{success: "appliance data added"}'
            },
            error:{
              content:'{error: "appliance not found"}'
            }
          },
          {
            id:"delappliance",
            url:"/api/appliance",
            type:"DELETE",
            description:"Removes a appliance from the Smart appliance Project",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  applianceID:"The ID of the appliance to remove."
            },
            expected:{
              content:'{success: "appliance removed"}'
            },
            error:{
              content:'{error: "appliance couldn\'t be removed"}'
            }
          },
          {
            id:"appliancesummary",
            url:"/api/appliance/summary",
            type:"GET",
            description:"Fetches the seven day summary for the selected appliance",
            parameters:{
                  userID:"A string containing the id of the user - retrieved from \"/api/user/login\"",
                  applianceID:"The ID of the appliance to fetch the summary for."
            },
            expected:{
              content:'{success: "appliance summary retrieved",summary:{SUMMARY OBJECT}}'
            },
            error:{
              content:'{error: "appliance not found"}'
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