var socket;
var universe;
var commandQueue = [];
var userData = {};
var myData = {};
var activityType;
var repaintPatches = true;
var foreverButtonCode = new Object();

jQuery(document).ready(function() {
  var userId;
  var userType;
  var turtleDict = {};
  var allowMultipleButtonsSelected = true;
  socket = io();

  // save student settings
  socket.on("save settings", function(data) {
    userId = data.userId;
    userType = data.userType;
    Gallery.setupGallery({settings: data.gallerySettings, userId: userId});
    allowMultipleButtonsSelected = data.gallerySettings.allowMultipleButtonsSelected; 
  });

  // display teacher or student interface
  socket.on("display interface", function(data) {
    switch (data.userType) {
      case "teacher": //as teacher, show teacher interface
        Interface.showTeacher(data.room, data.components);
        break;
      case "hubnet student": //as hubnet student, show hubnet student interface
        Interface.showStudent(data.room, data.components);
        break;
      case "gbcc student": //as gbcc student, show teacher interface, but hide teacher controls
        Interface.showTeacher(data.room, data.components);
        $(".teacherControls").css("display","none");
        break;
      case "login":
        activityType = data.activityType;
        Interface.showLogin(data.rooms, data.components);
        break;
      case "disconnected":
        Interface.showDisconnected();
        break;
    }
  });

  socket.on("gbcc user enters", function(data) {
    if (procedures.gbccOnEnter != undefined) {
      session.run('gbcc-on-enter "'+data.userId+'"');
    }
  });
  
  socket.on("gbcc user exits", function(data) {
    if (procedures.gbccOnExit != undefined) {
      session.run('gbcc-on-exit ["'+data.userId+'"]');
    }
  });

  // display admin interface
  socket.on("display admin", function(data) {
    Interface.showAdmin(data.roomData);
  });

  // student repaints most recent changes to world (hubnet, not gbcc)
  socket.on("send update", function(data) {
    universe.applyUpdate({turtles: data.turtles, patches: data.patches});
    universe.repaint();
  });

  // show or hide student view or gallery
  socket.on("student accepts UI change", function(data) {
    if (data.type === "view") {
      (data.display) ? $(".netlogo-view-container").css("display","block") : $(".netlogo-view-container").css("display","none");
    } else {
      (data.display) ? $(".netlogo-tab-area").css("display","block") : $(".netlogo-tab-area").css("display","none");
    }
  });

  // students display reporters
  socket.on("display reporter", function(data) {
    if (data.hubnetMessageTag.includes("canvas")) {
      Gallery.displayCanvas({message:data.hubnetMessage,source:data.hubnetMessageSource,tag:data.hubnetMessageTag});
    } else {
      var matchingMonitors = session.widgetController.widgets().filter(function(x) { 
        return x.type === "monitor" && x.display === data.hubnetMessageTag; 
      });
      if (matchingMonitors.length > 0) {
        matchingMonitors[0].compiledSource = data.hubnetMessage;
        matchingMonitors[0].reporter       = function() { return data.hubnetMessage; };
      }
      else if (activityType === "hubnet") {
        world.observer.setGlobal(data.hubnetMessageTag.toLowerCase(),data.hubnetMessage);
      } else {
        // WARNING: gbcc-set-globals overwrites globals, may not want this feature
        if (world.observer.getGlobal(data.hubnetMessageTag) != undefined) {
          world.observer.setGlobal(data.hubnetMessageTag, data.hubnetMessage);
        }
      }
    }
  });
  
  socket.on("accept user data", function(data) {
    userData[data.userId] = data.userData;
    if (data.status === "select") {
      if (procedures.gbccOnSelect != undefined) {
        session.run('gbcc-on-select "'+data.userId+'"');        
      }
    } else if (data.status === "deselect") {
      if (procedures.gbccOnDeselect != undefined) {
        session.run('gbcc-on-deselect "'+data.userId+'"');        
      }
    } else if (data.status === "forever-deselect") {
      delete foreverButtonCode[data.userId];
      if ($.isEmptyObject(foreverButtonCode)) { clearInterval(myVar); }
    } else if (data.status === "forever-select") {
      if ($.isEmptyObject(foreverButtonCode)) { 
        myVar = setInterval(runForeverButtonCode, 1000); 
      }
      foreverButtonCode[data.userId] = data.key;
    } else if (data.status === "go") {
      if (procedures.gbccOnGo != undefined) {
        session.runObserverCode(foreverButtonCode[userId]); 
      }
    }
  });

  var myVar = "";
  function runForeverButtonCode() {
    console.log("run forever button code");
    for (userId in foreverButtonCode) { 
      socket.emit("request user forever data go", {userId: userId});
    }
  }

  socket.on("execute command", function(data) {
    var commandObject = {};
    commandObject.messageSource = data.hubnetMessageSource;
    commandObject.messageTag = data.hubnetMessageTag;
    commandObject.message = data.hubnetMessage;
    commandQueue.push(commandObject);
    world.hubnetManager.hubnetMessageWaiting = true;
  });

  // student leaves activity and sees login page
  socket.on("teacher disconnect", function(data) {
    Interface.showDisconnected();
  });

});