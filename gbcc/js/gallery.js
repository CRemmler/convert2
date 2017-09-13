Gallery = (function() {
  
  var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
  var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
  var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
  var is_safari = navigator.userAgent.indexOf("Safari") > -1;
  var is_opera = navigator.userAgent.toLowerCase().indexOf("op") > -1;
  if ((is_chrome)&&(is_safari)) { is_safari = false; }
  if ((is_chrome)&&(is_opera)) { is_chrome = false; }
  var allowMultipleButtonsSelected = false;
  
  function setupGallery(data) {
    allowMultipleButtonsSelected = data.allowMultipleButtonsSelected; 
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
  
  if (!allowMultipleButtonsSelected) {
    $(".forever-icon").remove();
  }
  
  function itemMouseoverHandler(thisLi) {
    var thisId = $(thisLi).attr("id") || "";
    if ($("#"+thisId).find(".card").length > 1) { 
      $("#"+thisId+" .arrow").css("display","block");
    } 
    $("#"+thisId+" .forever-icon").css("display","block");
  }
      
  function itemMouseoutHandler(thisLi) {
    var thisId = $(thisLi).attr("id") || "";
    if ($("#"+thisId).find(".card").length > 1) { 
      $("#"+thisId+" .arrow").css("display","none");
    } 
    $("#"+thisId+" .forever-icon:not(.selected)").css("display","none");    
  }
  
  function cardClickHandler(thisElt) {
    var userId = $(thisElt).parent().attr("id").replace("gallery-item-","");
    if (allowMultipleButtonsSelected) {
      if ($(thisElt).parent().hasClass("selected")) {
        $(thisElt).parent().removeClass("selected");
        if ($(thisElt).parent().find(".forever-icon").hasClass("selected")) {
          $(thisElt).parent().find(".forever-icon").removeClass("selected");
          socket.emit("request user forever data", {userId: userId, status: "off"});  
        }
      } else { $(thisElt).parent().addClass("selected"); }
    } else {
      if ($(thisElt).parent().hasClass("selected")) { $(thisElt).parent().removeClass("selected");
      } else {
        $(".selected").removeClass("selected");
        $(thisElt).parent().addClass("selected");
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
      $(thisSpan).parent().removeClass("selected");
      socket.emit("request user forever data", {userId: userId, status: "off"});  
    } else {
      $(thisSpan).addClass("selected");
      $(thisSpan).parent().addClass("selected"); 
      session.compileObserverCode("gbcc-on-gallery-forever-go \""+userId+"\"", "gallery-forever-button-code-"+userId);
      socket.emit("request user forever data", {userId: userId, status: "on"})  
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
    canvasImg.src = data.src;
    canvasImg.userId = data.userId;
    canvasImg.onclick = function() { 
      socket.emit("request user data", {userId: canvasImg.userId})  
    };
    var label = $(".gbcc-gallery li").length;
    if ($(".gbcc-gallery").length === 0) { 
      $(".netlogo-gallery-tab-content").append("<div class='gbcc-gallery'><ul></ul></div>"); 
    }
    var newLiHtml = "<li id='gallery-item-"+data.userId+"'>";
    newLiHtml += "<span class=\"arrow arrow-left z20\"><i class=\"fa fa-chevron-left\" aria-hidden=\"true\"></i></span>";
    newLiHtml += "<span class=\"arrow arrow-right z20\"><i class=\"fa fa-chevron-right\" aria-hidden=\"true\"></i></span>";
    if (allowMultipleButtonsSelected) {
      newLiHtml += "<span class=\"forever-icon z20\"><i class=\"fa fa-refresh\" aria-hidden=\"true\"></i></span>";
    }
    newLiHtml += "<span class=\"label z20\">"+label+"</span>";
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
    canvasImg.src = data.src;
    canvasImg.userId = data.userId;
    canvasImg.onclick = function() { 
      socket.emit("request user data", {userId: canvasImg.userId})  
    };
    newSpan = "<span class=\"card card-image\"><img id='"+data.id+"' src='"+data.src+"'></span>";
    $("#gallery-item-"+data.userId).append(newSpan);
    var zIndex = $("#gallery-item-"+data.userId+" span:not(.text-span)").length - 5;
    $("#"+data.id).parent().css("z-index",zIndex);
    ($("#"+data.id).parent()).click(function() { cardClickHandler(this); });
  }
  
  function updateImageCard(data) {
    $(data.id).attr("src", data.src);
  }

  function createTextCard(data) {
    newSpan = "<span class=\"card card-text\"><span id=\""+data.id+"\" class=\"text-span\"><p>"+data.src.replace("gallery-text","")+"</span></span>";
    $("#"+data.id).onclick = function() {
      socket.emit("request user data", {userId: data.userId})        
    }
    $("#gallery-item-"+data.userId).append(newSpan);
    var zIndex = $("#gallery-item-"+data.userId+" span:not(.text-span)").length - 5;
    $("#"+data.id).parent().css("z-index",zIndex);
    ($("#"+data.id).parent()).click(function() { cardClickHandler(this); });
  }
  
  function updateTextCard(data) {
    $("#"+data.id).attr("html", data.src);
  }
  
  function displayCanvas(data) {
    //console.log("checking for #"+data.+"-"+data.source);
    var canvasData = { 
            id : data.tag + "-" + data.source,
            src : data.message,
            userId : data.source
          }
    if ($("#gallery-item-"+data.source).length === 0 ) { createCanvas(canvasData); } 
    if (data.message.substring(0,12) === "gallery-text") {
      ($("#" + data.tag + "-" + data.source).length === 0) ? createTextCard(canvasData) : updateTextCard(canvasData);
    } else {
      ($("#" + data.tag + "-" + data.source).length === 0) ? createImageCard(canvasData) : updateImageCard(canvasData);
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
    }
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
  
  function drawView() {
    miniCanvas = document.getElementById(miniCanvasId);
    miniCtx = miniCanvas.getContext('2d');            
    miniCtx.drawImage(document.getElementsByClassName("netlogo-canvas")[0], 0, 0, canvasLength, canvasWidth);
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
      if ($(".highcharts-title tspan", this).text()){ return this; } 
    });
    plotWidth = $(matchingPlots[0]).width();
    plotHeight = $(matchingPlots[0]).height();
    ratio = plotWidth / plotHeight;
    max = canvasWidth;
    width = max;
    height = max;
    (plotWidth > plotHeight) ? height = width / ratio : width = height * ratio;
    if (matchingPlots.length > 0) {
      miniCanvas = document.getElementById(miniCanvasId);
      miniCtx = miniCanvas.getContext('2d');      
      img = document.createElement("img");
      svgData = new XMLSerializer().serializeToString(matchingPlots[0]);
      img.setAttribute("src","data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(svgData))));
      img.onload = function () {
        miniCtx.fillStyle="#FFFFFF";
        miniCtx.fillRect(0,0,max,max);
        miniCtx.fillStyle="#000000";
        miniCtx.fillRect(0,((max - height) / 2),width,height + 2);
        miniCtx.drawImage(img, 1, ((max - height) / 2) + 1, width - 2, height);
        message = document.getElementById(miniCanvasId).toDataURL("image/jpeg", imageQuality);  
        socket.emit("send reporter", {
          hubnetMessageSource: "all-users", 
          hubnetMessageTag: "canvas-plot-populations", 
          hubnetMessage: message
        });
      }
    }
  }
  
  /*
  //gbcc:import-drawing ["img-from-webpage" "url" 0 0 200 200]
  //gbcc:import-drawing ["img-from-file-upload" "" 0 0 200 200 ]
  //gbcc:import-drawing ["img-from-file" "" 0 0 200 200]
  //gbcc:import-drawing ["img-remove" "" 0 0 200 200]
  function importDrawing(data) {
    var action = data[0];
    var filename = data[1];
    var xmin = data[2];
    var ymin = data[3];
    var width = data[4];
    var height = data[5];
    if (action === "img-remove") {
      repaintPatches = true;
      $(".uploadImage").remove();
    } else {
      repaintPatches = false;
      if (action === "img-from-webpage") {
        // Code from: https://shkspr.mobi/blog/2015/11/google-secret-screenshot-api/
        site = filename || "https://google.com/";
        $.ajax({
          url: 'https://www.googleapis.com/pagespeedonline/v1/runPagespeed?url=' + site + '&screenshot=true',
          context: this,
          type: 'GET',
          dataType: 'json',
          success: function(data) {
              data = data.screenshot.data.replace(/_/g, '/').replace(/-/g, '+');
              $(this).attr('src', 'data:image/jpeg;base64,' + data);
              $("body").append("<img class='uploadImage' id='"+filename+"-"+xmin+"-"+ymin+"-"+width+"-"+height+"' src='"+data+"' style='display:none'>");
            
            }
        });
      } else if (action = "img-from-file-upload") {
        
        
        
        
      } else if (action = "img-from-file") {
        if ($("#"+filename+"-"+xmin+"-"+ymin+"-"+width+"-"+height).length > 0) {
          $("#"+filename+"-"+xmin+"-"+ymin+"-"+width+"-"+height).remove();
        }
        $("body").append("<img class='uploadImage' id='"+filename+"-"+xmin+"-"+ymin+"-"+width+"-"+height+"' src='images/"+filename+"' style='display:none'>");
      }
    }
  }*/

  return {
    displayCanvas: displayCanvas,
    broadcastToGallery: broadcastToGallery,
    setupGallery: setupGallery
  };

})();