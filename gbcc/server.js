var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, {path:'/socket.io'});
var express = require('express');
var config = require('./config.json');
var exportworld = require('./export/exportworld.js');
var formidable = require('formidable');
var fs = require("node-fs");
const PORT = process.env.PORT || 3000;
var myTimer;
var schools = {};
 
app.use(express.static(__dirname));

var activityType = ((config.interfaceJs.teacherComponents.componentRange[0] === config.interfaceJs.studentComponents.componentRange[0])
  && (config.interfaceJs.teacherComponents.componentRange[1] === config.interfaceJs.studentComponents.componentRange[1])) ?
	"gbcc" : "hubnet";

app.get('/', function(req, res){
	res.sendfile('index.html');
});

app.get('/:id',function(req,res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  var url = socket.handshake.headers.referer;
  var school = url.substr(url.lastIndexOf("/")+1,url.length);
  socket.school = school;
  
	var rooms = [];
  if (schools[socket.school] === undefined) {
    schools[socket.school] = {};
  } 
  var allRooms = schools[socket.school];
	
  for (var key in allRooms) { rooms.push(key); }
	socket.emit("display interface", {userType: "login", rooms: rooms, components: config.interfaceJs.loginComponents, activityType: activityType });
	socket.join("login");

	function enableTimer() {
		//console.log("enable");
		var myTimer = setInterval(function() {
			for (var key in allRooms) {
				if (socket) {
					socket.to(key+"-student").emit("send update", {turtles: allRooms[key].turtles, patches: allRooms[key].patches});
				}
			}
		}, 250);
	}

	function disableTimer() {
		//console.log("disable");
		clearInterval(myTimer);
	}

	// user enters room
	socket.on("enter room", function(data) {
    var allRooms = schools[socket.school];
		var myUserType, myUserId;
		socket.leave("login");
		if (data.room === "admin") {
			socket.emit("display admin", {allRooms: getAdminData(school)});
		} else {
			// if user is first to enter a room, and only one room exists, then enable the timer
			if (Object.keys(allRooms).length === 0) {
				if (activityType === "hubnet") { enableTimer(); }
			}
			// declare myRoom
			socket.myRoom = data.room;
			var myRoom = socket.myRoom;
			if (!allRooms[myRoom]) {
				allRooms[myRoom] = {};
				allRooms[myRoom].turtles = {};
				allRooms[myRoom].patches = {};
				allRooms[myRoom].userData = {};
				allRooms[myRoom].canvasOrder = [];
				allRooms[myRoom].settings = {};
			}
			// declare myUserType, first user in is a teacher, rest are students
			socket.myUserType = (countUsers(myRoom, school) === 0) ? "teacher" : "student";
			myUserType = socket.myUserType;
			// declare myUserId
			myUserId = socket.id;
			allRooms[myRoom].userData[myUserId] = {};
			allRooms[myRoom].userData[myUserId].exists = true;
      if (activityType != "hubnet") { 
        socket.emit("gbcc user enters", {userId: myUserId});
        socket.to(myRoom+"-teacher").emit("gbcc user enters", {userId: myUserId});
      }
			// send settings to client
			socket.emit("save settings", {userType: myUserType, userId: myUserId, gallerySettings: config.galleryJs});
			// join myRoom
			socket.join(myRoom+"-"+myUserType);
			// tell teacher or student to display their interface
			if (myUserType === "teacher") {
				// send the teacher a teacher interface
				socket.emit("display interface", {userType: "teacher", room: myRoom, components: config.interfaceJs.teacherComponents});
				//send to all students on intro page
				rooms = [];
				for (var key in allRooms) { rooms.push(key); }
				socket.to("login").emit("display interface", {userType: "login", rooms: rooms, components: config.interfaceJs.loginComponents, activityType: activityType});
				if (activityType === "hubnet") { allRooms[myRoom].settings.displayView = true;}
			} else {
				if (activityType === "hubnet") {
					// send student a student interface
					socket.emit("display interface", {userType: "hubnet student", room: myRoom, components: config.interfaceJs.studentComponents});
					// send teacher a hubnet-enter-message
					socket.to(myRoom+"-teacher").emit("execute command", {hubnetMessageSource: myUserId, hubnetMessageTag: "hubnet-enter-message", hubnetMessage: ""});
					socket.emit("display my view", {"display":allRooms[myRoom].settings.displayView});
				} else {
					// it's gbcc, so send student a teacher interface
					socket.emit("display interface", {userType: "gbcc student", room: myRoom, components: config.interfaceJs.teacherComponents});
					var dataObject;
					if (allRooms[myRoom].userData != {}) {
						var canvases;
            for (var j=0; j < allRooms[myRoom].canvasOrder.length; j++) {
              socket.emit("gbcc user enters", {userId: allRooms[myRoom].canvasOrder[j]});
              canvases = allRooms[myRoom].userData[allRooms[myRoom].canvasOrder[j]]["canvas"];
              if (canvases != undefined) {
                for (var canvas in canvases) {
  								dataObject = {
  									hubnetMessageSource: allRooms[myRoom].canvasOrder[j],
  									hubnetMessageTag: canvas,
  									hubnetMessage: allRooms[myRoom].userData[allRooms[myRoom].canvasOrder[j]]["canvas"][canvas],
  									userId: myUserId,
  									activityType: activityType
  								};  
  								socket.emit("display reporter", dataObject);
                }
							}
						}
					}
				}
			}
		}

    schools[socket.school] = allRooms;
	});
  
  socket.on("request user broadcast data", function() {
    var allRooms = schools[socket.school];
    console.log("request user broadcast data");
    var myRoom = socket.myRoom;
		var myUserId = socket.id;
    var canvases;
    for (var j=0; j < allRooms[myRoom].canvasOrder.length; j++) {
      canvases = allRooms[myRoom].userData[allRooms[myRoom].canvasOrder[j]]["canvas"];
      if (canvases != undefined) {
        for (var canvas in canvases) {
          dataObject = {
            hubnetMessageSource: allRooms[myRoom].canvasOrder[j],
            hubnetMessageTag: canvas,
            hubnetMessage: allRooms[myRoom].userData[allRooms[myRoom].canvasOrder[j]]["canvas"][canvas],
            userId: myUserId,
            activityType: activityType
          };  
          socket.emit("display reporter", dataObject);
        }
      }
    }
  });

	// store updates to world
	socket.on("update", function(data) {
    var allRooms = schools[socket.school];
		var myRoom = socket.myRoom;
		var turtleId, turtle;
		var patchId, patch;
		for (var key in data.turtles)
		{
			turtle = data.turtles[key];
			turtleId = key;
			if (allRooms[myRoom].turtles[turtleId] === undefined) {
				allRooms[myRoom].turtles[turtleId] = {};
			}
			if (Object.keys(turtle).length > 0) {
				for (var attribute in turtle) {
					allRooms[myRoom].turtles[turtleId][attribute] = turtle[attribute];
				}
			}
		}
		for (var key in data.patches)
		{
			patch = data.patches[key];
			patchId = key;
			if (allRooms[myRoom].patches[patchId] === undefined) {
				allRooms[myRoom].patches[patchId] = {};
			}
			if (Object.keys(patch).length > 0) {
				for (var attribute in patch) {
					allRooms[myRoom].patches[patchId][attribute] = patch[attribute];
				}
			}
		}
    schools[socket.school] = allRooms;
	});

	// pass command from student to teacher
	socket.on("send command", function(data) {
    var allRooms = schools[socket.school];
		var myRoom = socket.myRoom;
		var myUserId = socket.id;
		socket.to(myRoom+"-teacher").emit("execute command", {
			hubnetMessageSource: myUserId,
			hubnetMessageTag: data.hubnetMessageTag,
			hubnetMessage: data.hubnetMessage
		});
	});

	// pass reporter from server to student
	socket.on("send reporter", function(data) {
    var allRooms = schools[socket.school];
		var myRoom = socket.myRoom;
		var myUserId = socket.id;
		var destination = data.hubnetMessageSource;
		if (allRooms[myRoom].userData[myUserId]) {
			if (( data.hubnetMessageTag.includes("canvas")) && (allRooms[myRoom].userData[myUserId]["canvas"] === undefined)) {
				allRooms[myRoom].canvasOrder.push(myUserId);
        allRooms[myRoom].userData[myUserId]["canvas"] = {};
			}
			if (destination === "server") {
				allRooms[myRoom].userData[myUserId][data.hubnetMessageTag] = data.hubnetMessage;
			} else {
				var dataObject = {
					hubnetMessageSource: myUserId,
					hubnetMessageTag: data.hubnetMessageTag,
					hubnetMessage: data.hubnetMessage,
					userId: myUserId,
					activityType: activityType
				};
			 	if (destination === "all-users"){
          if ( data.hubnetMessageTag.includes("canvas")) {
            
            if (data.hubnetMessageTag === "canvas-clear") {
              allRooms[myRoom].userData[myUserId]["canvas"] = {};
            }
            allRooms[myRoom].userData[myUserId]["canvas"][data.hubnetMessageTag] = data.hubnetMessage;
          }  
					dataObject.hubnetMessage = data.hubnetMessage;
					socket.to(myRoom+"-teacher").emit("display reporter", dataObject);
					socket.to(myRoom+"-student").emit("display reporter", dataObject);
					socket.emit("display reporter", dataObject);
				} else {
					io.to(destination).emit("display reporter", dataObject);
				}
			}
		}
    schools[socket.school] = allRooms;
	});

	app.post('/exportgbccworld', function(req,res){
    var allRooms = schools[socket.school];
		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) {
		 var myRoom = fields.roomname;
		 exportworld.exportData(allRooms[myRoom], myRoom, res);
	 });
	});

  // select, deselect, forever-select, forever-deselect
  socket.on("request user data", function(data) {
    var allRooms = schools[socket.school];
    var myRoom = socket.myRoom;
    if (allRooms[myRoom].userData != undefined) {
      var userData = allRooms[myRoom].userData[data.userId];
      var key = (data.status === "forever-select") ? "gbcc-forever-button-code-"+data.userId : undefined;
      socket.emit("accept user data", {userId: data.userId, status: data.status, userData: userData, key: key});
    }
  });

	// pass reporter from student to server
	socket.on("get reporter", function(data) {
    var allRooms = schools[socket.school];
		var myRoom = socket.myRoom;
		var myUserId = socket.id;
		if (allRooms[myRoom].userData[data.hubnetMessageSource]) {
			var dataObject = {
				hubnetMessageSource: data.hubnetMessageSource,
				hubnetMessageTag: data.hubnetMessageTag,
				hubnetMessage: allRooms[myRoom].userData[data.hubnetMessageSource][data.hubnetMessageTag],
				userId: myUserId,
				activityType: activityType
			};
			socket.emit("display reporter", dataObject);
		}
	});

	// get value from server
	socket.on("get value", function(data) {
    var allRooms = schools[socket.school];
		var myRoom = socket.myRoom;
		var myUserId = socket.id;
		if (data.hubnetMessageSource === "") { data.hubnetMessageSource = myUserId; }
		if (allRooms[myRoom].userData[data.hubnetMessageSource]) {
			var dataObject = {
				hubnetMessageSource: data.hubnetMessageSource,
				hubnetMessageTag: data.hubnetMessageTag,
				hubnetMessage: allRooms[myRoom].userData[data.hubnetMessageSource][data.hubnetMessageTag],
			};
			socket.emit("display value", dataObject);
		}
	});

	socket.on("admin clear room", function(data) {
		clearRoom(data.roomName);
	});
	
	/*
  socket.on("display view", function(data) {
    var allRooms = schools[socket.school];
		var myRoom = socket.myRoom;
		allRooms[myRoom].settings.displayView = data.display;
		socket.to(myRoom+"-student").emit("display my view", {"display":data.display});
    schools[socket.school] = allRooms;
	});
  */
  
  socket.on("teacher requests UI change", function(data) {
    var allRooms = schools[socket.school];
    var myRoom = socket.myRoom;
    allRooms[myRoom].settings.displayView = data.display;
    socket.to(myRoom+"-student").emit("student accepts UI change", {"display":data.display, "type":data.type});
    schools[socket.school] = allRooms;
  });
	
	// user exits
	socket.on('disconnect', function () {
		//clearInterval(myTimer);
		var school = socket.school;
		var allRooms = schools[school];
		var myRoom = socket.myRoom;
		var myUserId = socket.id;
		if (allRooms[myRoom] != undefined && allRooms[myRoom].userData[myUserId] != undefined) {
			allRooms[myRoom].userData[myUserId].exists = false;
		}
		if (activityType != "hubnet") { 
			socket.to(myRoom+"-teacher").emit("gbcc user exits", {userId: myUserId});
		}
		if (socket.myUserType === "teacher") {
			if (activityType === "hubnet") {
				clearRoom(myRoom, school);
				disableTimer();
			} else {
				if (countUsers(myRoom, school) === 0) {	delete allRooms[myRoom]; }
			}
		} else {
			if (allRooms[myRoom] != undefined) {
				socket.to(myRoom+"-teacher").emit("execute command", {
					hubnetMessageSource: myUserId,
					hubnetMessageTag: "hubnet-exit-message",
					hubnetMessage: ""
				});
				if (countUsers(myRoom, school) === 0) { delete allRooms[myRoom];}
				if (Object.keys(allRooms).length === 0) { disableTimer();}
			}
		}
		schools[school] = allRooms;
	});
});



http.listen(PORT, function(){
	console.log('listening on ' + PORT );
});

function clearRoom(roomName, school) {
  var allRooms = schools[school];
	var myRoom = roomName;
	var clientList = [];
	if (allRooms && allRooms[myRoom]) {
		for (var key in allRooms[myRoom].userData) {
			clientList.push(key);
		}
		for (var i=0; i<clientList.length; i++) {
			if (io.sockets.sockets[clientList[i]]) {
				io.to(clientList[i]).emit("display interface", {userType: "disconnected"});
				io.sockets.sockets[clientList[i]].disconnect();
			}
		}
		delete allRooms[myRoom];
    schools[socket.school] = allRooms;
	}
}

function countUsers(roomName, school) {
  var allRooms = schools[school];
	var users = 0;
	if (allRooms[roomName]) {
		for (var key in allRooms[roomName].userData) {
			if (allRooms[roomName].userData[key].exists) { users++; }
		}
	}
	return users;
}

function getAdminData(school) {
  var allRooms = schools[school];
	var displayData = "";
	displayData = displayData + "<hr>Any rooms?";
	for (var roomKey in allRooms) {
		displayData = displayData + "<hr>Which room? " + roomKey;
		displayData = displayData + "<br>How many users?" + (countUsers(roomKey, school));
		displayData = displayData + "<br><button onclick=Interface.clearRoom('"+roomKey+","+school+"')>Clear Room</button>";
	}
	return displayData;
}
