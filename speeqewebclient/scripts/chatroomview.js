/*
Copyright 2007-2008 OGG, LLC
See LICENSE.txt

Display chat room to element of id roomname and roomdomainname. 
*/

Speeqe.ChatRoomView.prototype = {

    /*
      Updates chat room information to html elements.
    
      This view displays the chatroom name and server to #roomname and
      #roomnamedomain. It displays the user's status in #login, creates
      the room search url, and displays the user name and user's
      domain to #login_username and #login_userdomain.
     */
    show: function(roomname,nick) {

	roomdomain = roomname.split("@");	


	if (roomdomain.length > 1 && roomdomain[1].split(".").length > 0)
	{
	    server_name = roomdomain[1].split(".")[0];
	    domain_name = roomdomain[1].split(".")[1];
	    top_level = roomdomain[1].split(".")[2];
	}
	else
	{
	    server_name = "chat";
	    domain_name = "speeqe";
	    top_level = "com";
	}
	room_domain_name = [server_name,
			    ".",
			    domain_name,
			    ".",
			    top_level];
	
	$("#roomname").html(roomdomain[0]);
	$("#roomdomainname").html(room_domain_name.join(""));
	$("#login_username").empty();
	$("#login_username").append(nick.replace("@"+Speeqe.XMPP_DOMAIN,""));
	$("#dashboard_user").empty();	
	$("#dashboard_user").append(nick);	
	$("#login").append("<br />Welcome "+nick.replace("@"+Speeqe.XMPP_DOMAIN,"")+".");
	room_search_url = ["http://",
			   Speeqe.XMPP_DOMAIN,
			   "/messagesearch/?room=",
			   roomdomain[0]];
	

	room_search_html = ["<a href=\"",
			    room_search_url.join(""),
			    "\">Search Room</a>"			    
	];
	$("#roomsearch").empty();
	$("#roomsearch").append(room_search_html.join(""));

	document.title = roomname;
	
    },
    displayJoiningStatus: function() {
	$("#chat_joining_room").show();
    },
    hideJoiningStatus: function() {
	$("#chat_joining_room").hide();
    },

    _clear_room: function(msg) {
	
	$("#roomname").html(msg);
	$("#roomdomainname").empty();
	$("#login_username").empty();
	$("#login_username").append(msg);
	$("#login").empty();
	$("#chat_joining_room").hide();
    },
    statusDisconnect: function(stanza) {

	var status = $(stanza).find("status").attr("code");
	var msg = "Disconnected from room.";
	//find a reason
	var reason = $(stanza).find("reason");
	console.log("reason:" + $(stanza).find("reason").text());
	if('301' == status)
	{
	    msg = "You have been banned from the room.";
	}
	else if('307' == status)
	{
	    msg = "You have been kicked from the room.";
	}
	if(reason.length > 0)
	{
	    msg += " "+String(reason.text()) + " ";
	}
	this._clear_room(msg);
    },
    password: function() {
	//display the dialog to ask for password

	Speeqe.showDraggable("#room_password_dialog");
    },
    error_map: {'503':"The room is full.",
                '403':"You are banned from the room.",
                '401':"Password required",
                '407':"Registration required."
    },

    error: function(chatroom,nick,error) {
	var error_code = $(error).find("error");
	var msg = "Error joining chat room. ";
	var code_string = error_code.attr("code");
	msg += this.error_map[code_string];

	this._clear_room(msg);
    }
};
