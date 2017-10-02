
  jQuery(document).ready(function() {
    $(".demo").css("display","none");
    $("#container0 .basicTabs").css("display","block");
    $("#container1 .tabCover").css("display","block");
    $(".basicModel.notes").css("display","block");
    $(".allTabs.notes").css("display","block");
    $(".allTabs.notes.student").css("display","none");
    $("#settings").css("visibility","hidden");
    $(".choice").change(function() {
      var choice = $(this).attr("choice");
      var choiceImage = ".demo"+choice;
      if ($(this).is(":checked")) {
        $(choiceImage).css("display","block");
      } else {
        $(choiceImage).css("display","none");
      }
      if (choice === "1") {
        if ($(this).is(":checked")) {
          $(".tabCover").css("display","none");
          $("#container0 .demo1").css("display","block");
          $(".demo3a").css("display","block");
          $(".basicTabs").css("display","none");
          $("#settings").css("visibility","visible");
          $(".allTabs.notes.student").css("display","block");
          $(".galleryTab.notes").css("display","block");
          $(".basicModel.notes.student").css("display","block");
        } else {
          $(".tabCover").css("display","block");
          $(".basicTabs").css("display","block");
          $("#settings").css("visibility","hidden");
          $(".allTabs.notes.student").css("display","none");
          $(".galleryTab.notes").css("display","none");
            $(".basicModel.notes.student").css("display","none");            
          if ($("[choice=2]").is(":checked")) { console.log('uncheck 2'); $("[choice=2]").click(); $(".demo2").css("display","none"); }
          if ($("[choice=3]").is(":checked")) { $("[choice=3]").click(); $(".demo3").css("display","none");}
          if ($("[choice=4]").is(":checked")) { $("[choice=4]").click(); $(".demo4").css("display","none");}
          if ($("[choice=5]").is(":checked")) { $("[choice=5]").click(); $(".demo5").css("display","none");}
          $(".demo3a").css("display","none");
        }
      }
      // if you uncheck 3 and 4 is checked, then hide 3a
      if (choice === "3" && !$("[choice=3]").is(":checked") && $("[choice=4]").is(":checked")) {
        $(".demo3a").css("display","none");
      }
      // if you check 3, show 3a
      if (choice === "3" && $("[choice=3]").is(":checked")) {
        $(".demo3a").css("display","block");
      }
      // if you check 4, and 3 is not checked, hide 3a
      if (choice === "4" && $("[choice=4]").is(":checked") && !$("[choice=3]").is(":checked")) {
        $(".demo3a").css("display","none");
      }
    });
    choiceList = {};
    choiceList["disease"] = {"on":[], "off":[0,1,2,3,4,5] };
    choiceList["introbuttons"] = {"on":[1], "off":[0,2,3,4,5] };
    $("#disease").click();
    $("#custom").change(function() {
      if (!$("[choice=1]").is("checked")) {
        $("[choice=1]").click();            
      }
    });
    $("[name='template']").change(function() {
      var choice = $(this).attr("id");
      if (choiceList[choice] != undefined) {
        var on = choiceList[choice].on;
        for (var i=0; i<on.length; i++) {
          if (!$("[choice="+on[i]+"]").is(":checked")) {
            $("[choice="+on[i]+"]").click();
          }
        }
        var off = choiceList[choice].off;
        for (var i=0; i<off.length; i++) {
          if ($("[choice="+off[i]+"]").is(":checked")) {
            $("[choice="+off[i]+"]").click();
          }
        }
      }
      if (choice != "custom" && choice != "disease" && $(".demo3a").css("display") === "none") {
        $(".demo3a").css("display","block");
      }
    });
  });