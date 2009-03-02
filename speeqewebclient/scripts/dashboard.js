/*

Copyright 2007-2008 OGG, LLC
See LICENSE.txt

  Inserts the speeqe dashboard into the interface.  Also includes the
  UI and code to make the dashboard work.

*/


Speeqe.dashBoardInit = function() {

    
    //dashboard html
    var dashboard_html = "<div id=\"dashboard\"> \
                        <div id=\"left-control\" class=\"control item\"> \
                                <ul> \
                                        <li><a href=\"http://"+Speeqe.HTTP_DOMAIN+"\" target=\"_blank\" ><img src=\"/images/dashboard/logo.png\" alt=\"Speeqe Logo\" width=\"30\" height=\"27\" /></a></li> \
                                        <li class=\"button\"> \
                                                <p><span id=\"dashboard_user\">Offline</span> <span id=\"dashboard_available\">is available</span></p> \
                                                <ul> \
                                                        <li id=\"dashboard_signoff\" style=\"display:none;\" ></span>Sign Off</span></li> \
                                                        <li id=\"dashboard_signon\"><span>Sign On</span></li> \
                                                        <li id='changeuser_prefs'><span>Change User</span></li> \
                                                </ul> \
                                        </li> \
                                </ul> \
                        </div> \
                        <div id=\"free-space\" class=\"item\"> \
                                <p></p> \
                        </div> \
                        <div id=\"right-control\" class=\"control item\"> \
                                <ul> \
                                        <li class=\"button\"> \
                                                <p id=\"help\" class=\"menu-item\"><span>Help</span></p> \
                                                <ul> \
                         <li id='debug_log_show'><span>Problem Report</span></li> \
                                                        <li id='show_help_dialog'><span>Help?</span></li> \
                                                </ul> \
                                        </li> \
                                        <li class=\"button\"> \
                                                <p id=\"settings\" class=\"menu-item\"><span>Settings</span></p> \
                                                <ul> \
                                                        <li id='search_room'>Search Room</span></li> \
                                                        <li id='configure_chat'><span>Configure Room</span></li> \
                                                        <li id='show_joinleave'><span>Toggle join/leave messages.</span></li> \
                                                </ul> \
                                        </li> \
                                </ul> \
                        </div> \
                </div> \
";
    var dashboard_elem = $(dashboard_html);
    var style_elem = "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/dashboard.css\" />";
    $("head").append(style_elem);
    //test if ie and add ie specific style
    if($.browser.msie)
    {
	var style_elem_ie = "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/dashboardie.css\" />";
	$("head").append(style_elem_ie);
    }
    $("body").prepend(dashboard_elem);
    
    $("#dashboard ul li ul").css("top",30);
    $("#right-control ul li ul").css("left",-($("#settings span").width() + 9));
    $(document).bind('mousedown', Speeqe.dashboardMouseCheck);
};


Speeqe.dashboardMouseCheck = function(e) {

    $("#dashboard ul li ul").each( function (i,elem) {

	if($(elem).css("display") != "none")
	{
	    //only hide menu if clicked outside of control
	    if($(e.target).parents(".control").length == 0)
	    {
		$(elem).parent("li").click();
	    }

	}
    });

};
