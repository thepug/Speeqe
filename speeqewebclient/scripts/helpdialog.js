/*

Copyright 2007-2008 OGG, LLC
See LICENSE.txt

  Inserts the speeqe dashboard into the interface.  Also includes the
  UI and code to make the dashboard work.

*/


Speeqe.helpDialogInit = function() {
    var help_dialog_html = "     <div id=\"popupContact\">  \
         <a id=\"popupContactClose\">x</a>  \
         <h1>Speeqe Help.</h1>  \
         <p id=\"contactArea\">  \
             <h2>Keyboard shortcuts.</h2> \
             <ul><li>F1 will bring up this screen. </li>\
             <li>TAB followed by character(s) will attempt to complete a nick name in the roster list.</li></ul>\
             <br/>  \
             <h2>List of chat commands.</h2>  <ul><li>/help : brings up this screen.<li> \
             <li>/topic [topic] :changes the room topic if you have permission.</li>\
             <li>/join [room name]: opens a new window with the specified room.</li> \
             <li>/kick,/ban [user]: Removes user from the room. /ban does so permanently. </li> \
             <li>/unban [user]: Allows user to join the room again.</li>\
             <li>/nick [nickname]: Changes your nick name to the one specified. </li>\
             <li>@nick [message]: Using the @ sign will send a private message to the specified user. </li>\
             </ul>" + Speeqe.helpDialogHtml
    +"<br/><br/>  \
             Press ESCAPE, Click on X (right-top) or Click Out from the popup to close the popup!  \
             <br/><br/>  \
         </p>  \
     </div><div id=\"backgroundPopup\"></div>";

    var helpdialog_elem = $(help_dialog_html);
    var style_elem = "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/helpdialog.css\" />";
    $("head").append(style_elem);
    $("body").prepend(helpdialog_elem);

    
    //Press Escape event!  
    $(document).keypress(function(e){
	var f1_keycode = 112;
	if(jQuery.browser.safari)
	{
	    f1_keycode = 63236;
	}
	
	if(e.keyCode==27 && Speeqe.helpDialogStatus==1)
	{  
	    Speeqe.closeHelpDialog();  
	}
	if(e.keyCode == f1_keycode)
	{
	    Speeqe.loadHelpDialog();
	    return false;	 
	}

    });
    //Click the x event!  
    $("#popupContactClose").click(function(){  
	Speeqe.closeHelpDialog();  
    });  
    //Click out event!  
    $("#backgroundPopup").click(function(){  
	Speeqe.closeHelpDialog();  
    });  
};
//used to enable and disable the help popup
Speeqe.helpDialogStatus = 0;

Speeqe.loadHelpDialog = function() {
    //centers the dialog box  
    Speeqe.centerHelpDialog("#popupContact");
    /*
      Display help dialog if it is not enabled.
     */
    if(Speeqe.helpDialogStatus == 0)
    {
	$("#backgroundPopup").css({"opacity": "0.7"});
	
	$("#backgroundPopup").fadeIn("slow");  
	$("#popupContact").fadeIn("slow");  
	Speeqe.helpDialogStatus = 1;
    }
};  
  
Speeqe.closeHelpDialog = function() {
    /*
      If the speeqe help dialog is showing, close it.
     */
    if(Speeqe.helpDialogStatus == 1)
    {
	$("#backgroundPopup").fadeOut("slow");  
	$("#popupContact").fadeOut("slow");  
	Speeqe.helpDialogStatus = 0;
    }
};

//centering popup  
Speeqe.centerHelpDialog = function() {  
  //request data for centering  
    var scrollTop = document.documentElement.scrollTop;
    var windowWidth = document.documentElement.clientWidth;  
    var windowHeight = document.documentElement.clientHeight;  
    var popupHeight = $("#popupContact").height();  
    var popupWidth = $("#popupContact").width();  

    //centering  
    $("#popupContact").css({  
	"position": "absolute",  
	    "top": (windowHeight/2-popupHeight/2)+scrollTop,  
	    "left": windowWidth/2-popupWidth/2  
	    });  

};  
