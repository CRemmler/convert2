Gallery = (function() {
  
  var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
  var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
  var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
  var is_safari = navigator.userAgent.indexOf("Safari") > -1;
  var is_opera = navigator.userAgent.toLowerCase().indexOf("op") > -1;
  if ((is_chrome)&&(is_safari)) { is_safari = false; }
  if ((is_chrome)&&(is_opera)) { is_chrome = false; }
  
  var allowTabs;                 //done
  var allowMultipleLayers;       //done
  var allowMultipleSelections;   //done
  var allowCanvasForeverButtons; //done
  var allowGalleryForeverButton; //done
  var allowTeacherControls;
  var galleryForeverButton = "on";

  function setupGallery(data) {
    var settings = data.settings;
    myUserId = data.userId;
    allowTabs = settings.allowTabs || false;
    allowMultipleLayers = settings.allowMultipleLayers || false;
    allowMultipleSelections = settings.allowMultipleSelections || false;
    allowCanvasForeverButtons = settings.allowCanvasForeverButtons || false;
    allowGalleryForeverButton = settings.allowGalleryForeverButton || false;
    allowTeacherControls = settings.allowTeacherControls || false;
    if (allowTabs) { // student, hubnet
      $(".netlogo-tab-area").removeClass("hidden");
    } else {
      $(".netlogo-gallery-tab").css("display","none");
    }
    if (allowGalleryForeverButton) {
      $(".netlogo-gallery-tab").append("<span class='gallery-forever-icon'><i class='fa fa-refresh' aria-hidden='true'></i></span>")
      socket.emit("request gallery data", {userId: myUserId, status: "select"}); 
      $(".gallery-forever-icon").on("click",function() {
        if ($(".netlogo-gallery-tab").hasClass("selected")) {
          $(".netlogo-gallery-tab").removeClass("selected");
          $(".netlogo-gallery-tab-content").removeClass("selected");
          $(".gbcc-gallery li").removeClass("gray-border");
          galleryForeverButton = "on";
          socket.emit("request user broadcast data");
        } else {
          $(".netlogo-gallery-tab").addClass("selected");
          $(".netlogo-gallery-tab-content").addClass("selected");
          $(".gbcc-gallery li").addClass("gray-border");
          galleryForeverButton = "off"; 
        }
      });
    }
    if (!allowTeacherControls) { $(".teacherControls").css("display","none"); }
  }
  
  assignZIndex();
  
  function assignZIndex() {
    $("li").each(function() {
      var index = 0;
      $(this).children().each( function() {
        if ($(this).hasClass("card")) {
          $(this).css("z-index",index);
          index++;
        }
      });
    });
  }
  
  if (!allowCanvasForeverButtons) {
    $(".forever-icon").remove();
  }
  
  function itemMouseoverHandler(thisLi) {
    var thisId = $(thisLi).attr("id") || "";
    if ($("#"+thisId).find(".card").length > 1) { 
      $("#"+thisId+" .arrow").css("display","block");
    } 
    if ($("#"+thisId).hasClass("selected")) {
      $("#"+thisId+" .forever-icon").css("display","block");
    }
  }
      
  function itemMouseoutHandler(thisLi) {
    var thisId = $(thisLi).attr("id") || "";
    if ($("#"+thisId).find(".card").length > 1) { 
      $("#"+thisId+" .arrow").css("display","none");
    } 
    if ($("#"+thisId).hasClass("selected")) {
      $("#"+thisId+" .forever-icon:not(.selected)").css("display","none");    
    }
  }
  
  function cardClickHandler(thisElt) {
    var userId = $(thisElt).parent().attr("id").replace("gallery-item-","");
    if (procedures.gbccOnGo != undefined) {
      if ($(thisElt).parent().hasClass("selected")) {
        $("#gallery-item-"+userId+" .forever-icon").css("display","none").removeClass("selected");
        socket.emit("request user action", {userId: userId, status: "forever-deselect"});  
      } else {
        $("#gallery-item-"+userId+" .forever-icon").css("display","block");
      }
    }
    if ($(thisElt).parent().hasClass("selected")) {
      $(thisElt).parent().removeClass("selected");
      socket.emit("request user action", {userId: userId, status: "deselect"}); 
    } else { 
      if (allowMultipleSelections) {
        $(thisElt).parent().addClass("selected"); 
        socket.emit("request user action", {userId: userId, status: "select"});
      } else {
        $(".selected").each(function() {
          if ($(this).attr("id") && $(this).attr("id").includes("gallery-item-")) {
            thisUserId = $(this).attr("id").replace("gallery-item-","");
            socket.emit("request user action", {userId: thisUserId, status: "deselect"}); 
            $(this).removeClass("selected");
            if ($(this).children(".forever-icon").hasClass("selected")) {
              $(this).children(".forever-icon").removeClass("selected").css("display","none");
              socket.emit("request user action", {userId: thisUserId, status: "forever-deselect"});  
            }
          }
        });
        $(thisElt).parent().addClass("selected");
        socket.emit("request user action", {userId: userId, status: "select"}); 
      }
    }
  }

  function arrowClickHandler(thisSpan) {
    var direction = $(thisSpan).hasClass("arrow-left") ? "left" : "right";
    var cards = [];
    $(thisSpan).parent().children().each(function() {
      if ($(this).hasClass("card")) { cards.push(this);}
    });
    rotateCards(direction, cards);    
  }
  
  function foreverClickHandler(thisSpan, userId) {
    if ($(thisSpan).hasClass("selected")) {  
      $(thisSpan).removeClass("selected");
      socket.emit("request user action", {userId: userId, status: "forever-deselect"});  
    } else {
      $(thisSpan).addClass("selected");
      $(thisSpan).parent().addClass("selected"); 
      session.compileObserverCode("gbcc-forever-button-code-"+userId, "gbcc-on-go \""+userId+"\"");
      socket.emit("request user action", {userId: userId, status: "forever-select"})  
    }      
  }

  function rotateCards(direction, cards) {
    var length = cards.length;
    var zIndex;
    if (direction === "right") {
      for (card in cards) {
        zIndex = $(cards[card]).css("z-index");
        if (zIndex === (length - 1)+"") {
          $(cards[card]).css("z-index",0);
        } else {
          $(cards[card]).css("z-index",zIndex - -1);		
        }
      }
    } else {
      for (card in cards) {
        zIndex = $(cards[card]).css("z-index");
        if (zIndex === "0") {
          $(cards[card]).css("z-index",length - 1);
        } else {
          $(cards[card]).css("z-index",zIndex - 1);					
        }
      }
    }
  }
  
  function createCanvas(data) {
    var canvasImg = new Image();
    canvasImg.id = data.id;
    canvasImg.userId = data.userId;
    var label = $(".gbcc-gallery li").length;
    if ($(".gbcc-gallery").length === 0) { 
      $(".netlogo-gallery-tab-content").append("<div class='gbcc-gallery'><ul></ul></div>"); 
    }
    var newLiHtml = "<li id='gallery-item-"+data.userId+"'>";
    newLiHtml += "<span class=\"arrow arrow-left z20\"><i class='fa fa-chevron-left' aria-hidden='true'></i></span>";
    newLiHtml += "<span class=\"arrow arrow-right z20\"><i class='fa fa-chevron-right' aria-hidden='true'></i></span>";
    if (allowCanvasForeverButtons) {
      newLiHtml += "<span class=\"forever-icon z20\"><i class='fa fa-refresh' aria-hidden='true'></i></span>";
    } else {
      newLiHtml += "<span></span>";      
    }
    newLiHtml += (myUserId === data.userId) ? "<span class=\"label z20 selected\">"+label+"</span>" : "<span class=\"label z20\">"+label+"</span>";
    newLiHtml += "</li>";
    $(".gbcc-gallery ul").append(newLiHtml);
    $("#gallery-item-"+label+" .card-image").append(canvasImg);
    $("#gallery-item-"+data.userId+" .arrow").click(function() { arrowClickHandler(this) });
    $("#gallery-item-"+data.userId+" .forever-icon").click(function() { foreverClickHandler(this, data.userId) });
    $("#gallery-item-"+data.userId).mouseover(function() { itemMouseoverHandler(this); });
    $("#gallery-item-"+data.userId).mouseout(function() { itemMouseoutHandler(this); });
  }
  
  function createImageCard(data) {
    var canvasImg = new Image();
    canvasImg.id = data.id;
    data.id = data.id.replace(" ","-");
    canvasImg.src = data.src;
    canvasImg.userId = data.userId;
    newSpan = "<span class=\"card card-image\"><img id='"+data.id+"' src='"+data.src+"'></span>";
    $("#gallery-item-"+data.userId).append(newSpan);
    var zIndex = $("#gallery-item-"+data.userId+" span:not(.text-span)").length - 5;
    $("#"+data.id).parent().css("z-index",zIndex);
    ($("#"+data.id).parent()).click(function() { cardClickHandler(this); });
  }
  
  function updateImageCard(data) {
    data.id = data.id.replace(" ","-");
    $("#"+data.id).attr("src", data.src);
  }

  function createTextCard(data) {
    newSpan = "<span class=\"card card-text\"><span id=\""+data.id+"\" class=\"text-span\"><br>"+data.src.replace("gallery-text","")+"</span></span>";
    $("#gallery-item-"+data.userId).append(newSpan);
    var zIndex = $("#gallery-item-"+data.userId+" span:not(.text-span)").length - 5;
    $("#"+data.id).parent().css("z-index",zIndex);
    ($("#"+data.id).parent()).click(function() { cardClickHandler(this); });
  }
  
  function updateTextCard(data) {
    $("#"+data.id).html("<br>"+data.src.replace("gallery-text",""));
  }
  
  function displayCanvas(data) {
    if (galleryForeverButton === "off") { return; } 
    var canvasData = { 
            id : data.tag + "-" + data.source,
            src : data.message,
            userId : data.source
          }
    if ($("#gallery-item-"+data.source).length === 0 ) { createCanvas(canvasData); } 
    if (data.message.substring(0,13) === "gallery-clear") {
      $("#gallery-item-" + data.source +" .card").remove(); 
      canvasData.src="";
      createTextCard(canvasData);
      return;
    }
    if (allowMultipleLayers) {
      if (data.message.substring(0,15) === "<p>gallery-text") {
        ($("#" + data.tag + "-" + data.source).length === 0) ? createTextCard(canvasData) : updateTextCard(canvasData);
      } else {
        ($("#" + data.tag + "-" + data.source).length === 0) ? createImageCard(canvasData) : updateImageCard(canvasData);
      }
    } else {
      // remove existing cards
      $("#gallery-item-" + data.source +" .card").remove(); 
      // make another one
      if (data.message.substring(0,15) === "<p>gallery-text") {
        createTextCard(canvasData);
      } else {
        createImageCard(canvasData);
      }
    }
  }
  
  var miniCanvasId, miniCanvas, miniCtx, message;
  var canvasLength, canvasWidth, imageQuality;
  var svgData, img;

  function broadcastToGallery(key, value) {
    if (is_safari) {  
      miniCanvasId = "miniSafariCanvas";
      canvasLength = 200; canvasWidth = 200;
      imageQuality = 0.5;
    } else {
      miniCanvasId = "miniCanvas";
      canvasLength = 500; canvasWidth = 500;
      imageQuality = 0.75;
    }
    if (key === "view") {
      drawView();
    } else if (key === "plot") {
      drawPlot(value);
    } else if (key === "text") {
      drawText(value);
    } else if (key === "clear") {
      drawClear();
    }
  }
  
  function drawClear(text) {
    var message = "gallery-clear";
    socket.emit("send reporter", {
      hubnetMessageSource: "all-users", 
      hubnetMessageTag: "canvas-clear", 
      hubnetMessage: message
    }); 
  }
  
  function drawText(text) {
    var message = "gallery-text"+text;
    socket.emit("send reporter", {
      hubnetMessageSource: "all-users", 
      hubnetMessageTag: "canvas-text", 
      hubnetMessage: message
    }); 
  }
  
  function drawHoverText(text) {
    console.log("draw hover text",text);
  }
  
  function scaleCanvas(sourceWidth, sourceHeight) {
    var dataObj = {};
    var ratio = sourceWidth / sourceHeight;
    var width = canvasWidth;
    var height = canvasWidth;
    (sourceWidth > sourceHeight) ? height = width / ratio : width = height * ratio;
    dataObj.width = width;
    dataObj.height = height;
    return dataObj;
  }
  
  function drawView() {
    var dataObj = scaleCanvas($(".netlogo-canvas").width(), $(".netlogo-canvas").height());
    var width = dataObj.width;
    var height = dataObj.height;
    miniCanvas = document.getElementById(miniCanvasId);
    miniCtx = miniCanvas.getContext('2d');
    miniCtx.fillStyle="#ffffff";
    miniCtx.fillRect(0,0,canvasWidth,canvasWidth);
    miniCtx.fillStyle="#000000";
    miniCtx.fillRect(0,((canvasWidth - height) / 2),width,height + 2);
    miniCtx.drawImage(document.getElementsByClassName("netlogo-canvas")[0], 1, ((canvasWidth - height) / 2) + 1, width - 2, height);
    message = document.getElementById(miniCanvasId).toDataURL("image/jpeg", imageQuality); 
    socket.emit("send reporter", {
      hubnetMessageSource: "all-users", 
      hubnetMessageTag: "canvas-view", 
      hubnetMessage: message
    }); 
  }
  
  function drawPlot(plotName) {
    var plotWidth, plotHeight, ratio, max, width, length;
    var plotName, matchingPlots;
    matchingPlots =  $("svg").filter(function() {
      if ($(".highcharts-title tspan", this).text() === plotName){ 
        return this; } 
    });
    if (matchingPlots.length > 0) {
      var dataObj = scaleCanvas($(matchingPlots[0]).width(), $(matchingPlots[0]).height());
      var width = dataObj.width;
      var height = dataObj.height;
      miniCanvas = document.getElementById(miniCanvasId);
      miniCtx = miniCanvas.getContext('2d');      
      img = document.createElement("img");
      svgData = new XMLSerializer().serializeToString(matchingPlots[0]);
      img.setAttribute("src","data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(svgData))));
      img.onload = function () {
        miniCtx.fillStyle="#FFFFFF";
        miniCtx.fillRect(0,0,canvasWidth,canvasWidth);
        miniCtx.fillStyle="#000000";
        miniCtx.fillRect(0,((canvasWidth - height) / 2),width,height + 2);
        miniCtx.drawImage(img, 1, ((canvasWidth - height) / 2) + 1, width - 2, height);
        message = document.getElementById(miniCanvasId).toDataURL("image/jpeg", imageQuality);  
        socket.emit("send reporter", {
          hubnetMessageSource: "all-users", 
          hubnetMessageTag: "canvas-plot-"+plotName.replace(" ","-"), 
          hubnetMessage: message
        });
      }
    }
  }
  
  return {
    displayCanvas: displayCanvas,
    broadcastToGallery: broadcastToGallery,
    setupGallery: setupGallery
  };

})();