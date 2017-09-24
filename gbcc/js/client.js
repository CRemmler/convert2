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
      case "teacher":
        Interface.showTeacher(data.room, data.components);
        break;
      case "student":
        Interface.showStudent(data.room, data.components);
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
    console.log("gbcc user enters");
    console.log("gbcc user enters",data);
    if (procedures.gbccOnUserEnters) {
      session.run('gbcc-on-user-enters "'+data.userId+'"');
    }
  });
  
  socket.on("gbcc user exits", function(data) {
    if (procedures.gbccOnUserExits) {
      session.run('gbcc-on-user-exits ["'+data.userId+'"]');
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

  // show or hide student view
  socket.on("display my view", function(data) {
    (data.display) ? $(".netlogo-view-container").css("display","block") : $(".netlogo-view-container").css("display","none");
  });

  // students display reporters
  socket.on("display reporter", function(data) {
    console.log("display reporter");
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

  // This function is called after the user clicks on a canvas in the gallery.
  // The data from that user is downloaded before the gallery click handler is initiated
  // WARNING: This means you should not call the gallery click handler from within NetLogo
  // AND You should not call gbcc-get-from-user from outside of the click handler
  socket.on("accept user data", function(data) {
    console.log("accept user data "+data.status);
    userData = data.userData;
    //if (allowMultipleButtonsSelected) {
    if (data.status === "on") {
      if (procedures.gbccOnCanvasSelect) {
        session.run('gbcc-on-canvas-select "'+data.userId+'"');        
      }
    } else {
      if (procedures.gbccOnCanvasDeselect) {
        session.run('gbcc-on-canvas-deselect "'+data.userId+'"');        
      }
    }
  });
  
  var myVar = "";
  function runForeverButtonCode() {
    for (userId in foreverButtonCode) { 
      console.log(foreverButtonCode[userId]);
      session.runObserverCode(foreverButtonCode[userId]); 
    }
  }
  
  socket.on("accept user forever data", function(data) {
    console.log("accept user forever data "+data.status);
    if (data.status === "on") {
      if ($.isEmptyObject(foreverButtonCode)) { 
        myVar = setInterval(runForeverButtonCode, 1000); 
      }
      foreverButtonCode[data.userId] = data.key;
    } else {
      delete foreverButtonCode[data.userId];
      if ($.isEmptyObject(foreverButtonCode)) { clearInterval(myVar); }
    }
  });

  socket.on("execute command", function(data) {
    var commandObject = {};
    commandObject.messageSource = data.hubnetMessageSource;
    commandObject.messageTag = data.hubnetMessageTag;
    commandObject.message = data.hubnetMessage;
    commandQueue.push(commandObject);
    world.hubnetManager.setHubnetMessageWaiting(true);
  });

  // student leaves activity and sees login page
  socket.on("teacher disconnect", function(data) {
    Interface.showDisconnected();
  });

});