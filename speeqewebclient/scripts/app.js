/*
  Copyright 2007-2008 Nathan Zorn OGG, LLC
  See LICENSE.txt 
*/

var APP_DEFAULT_WAIT = 60
var APP_DEFAULT_HOLD = 1

Speeqe.Application.prototype = {
   

    setChatroom: function(room)
    {

	if (room.split("@").length == 1)
	{

	    tmp_room = [room,
			"@",
			Speeqe.CHAT_SERVER];
	    this._chatroom = tmp_room.join("");

	}
	else
	{
	    this._chatroom = room;
	}

    },
    getChatroom: function() {
	return this._chatroom;
    },
    run: function(username,password)
    {
	//parse query string to find given room name
	var query = window.location.search.substring(1);

	var parms = query.split('&');
	for (i=0;i<parms.length;i++)
	{
	    keyvals = parms[i].split('=');
	    if ((keyvals.length > 0) && (keyvals[0] == 'room'))
		{
		    this.setChatroom(keyvals[1]);
		}
	}

	//if username and password are not specified log in anonymously
	if(!username && !password)
	{
	    username = Speeqe.XMPP_DOMAIN;
	    password = "password";
	    this.anonymous = true;
	}

	this._connection.connect(username,
				 password,
				 app._connectCallback,
				 APP_DEFAULT_WAIT,
				 APP_DEFAULT_HOLD);

    },
    
    _connectCallback: function (status, cond)
    {

	app._statusview.displayStatus(status,cond,app._connected);
	

	if (status == Strophe.Status.AUTHFAIL)
	{
	    app._connection.disconnect();
	    app._authFailed = true;
	}
	else if (status == Strophe.Status.CONNECTED)
	{
	    app._connection.pause();
	    app._connected = true;

	    title = document.title.replace("!! ","");
	    document.title = title;

	    app._connection.resume();
	    //Send presence to the server
	    var presence = $pres({from:app._connection.jid}).c("priority",{}).cnode(Strophe.xmlTextNode("-1")).tree();

	    app._connection.send(presence);

	    //Add handlers for messages and user presence
	    app._connection.addHandler(app._onMessage,
				       null,
				       "message",
				       null,
				       null,
				       null);
	    
	    app._connection.addHandler(app._onPresence,
				       null,
				       "presence",
				       null,
				       null,
				       null);
	    //join the chat room
	    app.joinchat(app._chatroom);

	}
	else if (status == Strophe.Status.DISCONNECTED || status == Strophe.Status.CONNFAIL)
	{
	    app._connected = false;
	    app._connection.jid = "";
	    app._chat = null;
	    app._chatroom = null;
	    title = "!! " + document.title;
	    document.title = title;
	    app._statusview.toggleStatusElement("#status_disconnected");	    
	}
	else if (status == Strophe.Status.DISCONNECTING)
	{
	    app.disconnect();
	}
	return true;

    },
    
    //Clean up and discconnect from xmpp server
    disconnect: function ()
    {
	//remove all roster items
	for (i in this._roster)
	{
	    $("#rosteritem"+this._roster[i].id).remove();
	    delete this._roster[i];    
	}
	this.leave(function() {
	    app._connection.disconnect();
	});
    },
    
    leave: function (call_back)
    {
	if(this._chat)
	{
	    this._chat.leave(call_back);
	}
	
    },
    
    joinchat: function(chatname) 
    {
	var nickname = this._connection.jid;
	var jid = this._connection.jid;

	if(this.anonymous)
	{
	    nickname = Speeqe.generate_anonymous_nick()+"@"+Speeqe.XMPP_DOMAIN;
	    jid = Speeqe.XMPP_DOMAIN;
	}
	if (!this._chat)
	{

	    if(nickname.split("/").length > 0)
	    {
		nickname = nickname.split("/")[0];
	    }
	    this._chat = new Speeqe.Chat(chatname,
					 this._connection,
					 nickname);
	    
	}

	this._chat.join();
	this._chatroom_view.displayJoiningStatus();

    },
    joinChatWithPassword: function(password) {
	if(this._chat)
	{
	    this._chat.join(password);
	    this._chatroom_view.displayJoiningStatus();
	}
    },
    messageView: function() {
	return this._message_view;
    },
    _onMessage: function(stanza) {

	if (app._chat)
	{

	    var type = $(stanza).attr('type');
	  
	    if ('error' != type)
	    {
		var from = $(stanza).attr('from');
		userroom = from.split("/");
		user = userroom[1];
		room = userroom[0];

		//determine if message is subject change
		if ($(stanza).find('subject').length > 0)
		    {
			app._message_view.displayTopic(stanza);
		    }
		else if ($(stanza).text())
		    {
			if(!user)
			    {
				user = from;
			    }
			//Find the avatar for the user posting the message.
			srcurl = '/avatar-service/lookup/?sha1=';
			var the_sha1 = "f2f8ab835b10d66f9233518d1047f3014b3857cf";
			if(app._roster[user])
			    {
				
				if(app._roster[user].sha1)
				    {
					the_sha1 = app._roster[user].sha1;
				    }
				
			    }
			srcurlsha = [srcurl,
				     the_sha1];
			srcurl = srcurlsha.join("");
			//message belongs to the current user?
			var current_user = false;
			
			if (app._chat._nick === user)
			    {
				current_user = true;
			    }
			app._message_view.displayMessage(user,
							  srcurl,
							  stanza,
							  current_user);
				
		    }
	    
	    }
	    else
	    {
		app._message_view.displayErrorMessage(stanza);

	    }
	}
	return true;
    },
    messageView: function() {
	return this._message_view;
    },
    sendMessage: function(text) {
	if (this._chat)
	{
	    //test for valid /me message
	    textm = text.replace(/\s/g,"");
	    
	    if(textm != "/me")
	    {
		this._chat.sendMessage(text);
	    }
	    else
	    {
		//create stanza for error message
		var error_message = "Error: Must send more than just /me.";
		var kick_message_ar = ["<message from='",
				       this._chatroom,			       
				       "' to='4@dev.speeqe.com/3' id='1'><x xmlns='jabber:x:event'><composing/></x></message>"];
		
		var estanza = $(kick_message_ar.join(""));
		var body_elem = document.createElement("body");
		var body_text = document.createTextNode(error_message);
		body_elem.appendChild(body_text);

		estanza.append(body_elem);
		this._message_view.displayErrorMessage(estanza);
	    }
	}
	this._message_view.scrollTop();

    },

    _onPresence: function(stanza) {

	if (app._chat)
	{
	    var my_app = app;

	    $(stanza).find("x").each( function(i,xquery) {
		
		//Handle only MUC user protocol
		var xmlns = $(xquery).attr("xmlns");

		if (xmlns && xmlns.match(Strophe.NS.MUC))
		{

		    var error = $(stanza).find("error");

		    if (error.length > 0)
		    {
			if(error.attr("code") == '409') //409 is nick conflict
			{
			    if(my_app._chat)
				console.log("error 409");		    
			    //nick conflict so tack on another character
			    my_app._chat._nick = my_app._chat._nick + "_";
			    my_app._chat.join(my_app._chatroom);
			}
			else if(error.attr("code") == '401') //401 auth required
			{
			    //display password dialog
			    my_app._chatroom_view.password();
			}
			else
			{
			    //display error message
			    my_app._chatroom_view.error(my_app._chatroom,
						      my_app._chat._nick,
						      stanza);
			    my_app.disconnect();
			}

		    }
		    else
		    {

			//Search for status code
			var status = $(stanza).find("status").attr("code");
			if('201' == status)
			{
			    my_app._chat.createInstantRoom();
			}
			if('307' == status || '301' == status)
			{
			    //test if user is kicked, otherwise show the message
			    var message_to = $(stanza).attr("from").split("/")[1];
			    my_app._message_view.displayKickBan(stanza);
			    if(message_to == my_app._chat._nick)
			    {
				my_app._chatroom_view.statusDisconnect(stanza);
				my_app.disconnect();
			    }
			    else
			    {
				
				var roster_item = my_app._roster[nick]; 
				if(roster_item)
				{
				    $("#rosteritem"+roster_item.id).remove();
				    delete my_app._roster[nick];
				    my_app._rosteritemview.showJoinLeave(nick,"left");
				}
			    }
			}
			var room = $(stanza).attr("from").split("/")[0];
			//room presence contains an 'item'
			var fulljid = $(stanza).find("item").attr("jid");

			if(room == my_app._chatroom)
			{
			    var nick = $(stanza).attr("from").split("/")[1];
			    if(my_app._chat._nick == nick)
			    {
				my_app._chatroom_view.show(my_app._chatroom,
							   my_app._chat._nick);
			    }
			    my_app._chatroom_view.hideJoiningStatus();
			    my_app._statusview.toggleStatusElement("#status_connected");	    
			}

			if (fulljid)
			{
			    var jid = fulljid.split("/")[0];
			    var nick = $(stanza).attr("from").split("/")[1];
			    var fullnick = $(stanza).attr("from");
			    if((!$(stanza).attr("type")) || ("available" == $(stanza).attr("type")))
			    {
					
				var roster_item = my_app._roster[nick];
				if(!roster_item)
				{
				    roster_item = new Speeqe.RosterItem(my_app._connection,
									fullnick,
									nick);
				    my_app._roster[nick] = roster_item;
				    
				    my_app._rosteritemview.show(roster_item,
								nick);
				    
				    var roster_item_id = "#rosteritem" + roster_item.id;
				    $(roster_item_id + " .roster_user_name").click(function() {
					my_app.completeNick("@"+$(this).text());
				    });
				    my_app.createRosterPopup($(roster_item_id));
				    
				}
				else
				    {//update existing user with presence changes
				    }
				roster_item.getAvatar();
				
				
			    }
			    else if (("error"==$(stanza).attr("type")) || ("unavailable" == $(stanza).attr("type")))
			    {
				
				var roster_item = my_app._roster[nick]; 
				if(roster_item)
				{
				    $("#rosteritem"+roster_item.id).remove();
				    delete my_app._roster[nick];
				    my_app._rosteritemview.showJoinLeave(nick,"left");
				}
			    }

			}
			else 
			{
			    /*Handle anonymous rooms. Default avatar and only nick shows.*/

			    if (room == my_app._chatroom)
			    {
				var nick = $(stanza).attr("from").split("/")[1];
				var fullnick = $(stanza).attr("from");

				if("unavailable" != $(stanza).attr("type"))
				{
				    var roster_item = my_app._roster[nick];
				    if(!roster_item)
				    {
					roster_item = new Speeqe.RosterItem(my_app._connection,
										fullnick,
										nick);
					
					my_app._roster[nick] = roster_item;

					my_app._rosteritemview.show(roster_item,nick);
					
					var roster_item_id = "#rosteritem" + roster_item.id;
					var roster_item_selector = roster_item_id + " .roster_user_name";

					$(roster_item_selector).click(function() {
					    my_app.completeNick("@"+$(this).text());
					});
					my_app.createRosterPopup($(roster_item_id));

				    }
				    roster_item.getAvatar();
				    
				}
				else if (("error"==$(stanza).attr("type")) || ("unavailable" == $(stanza).attr("type")))
				{
				    
				    var roster_item = my_app._roster[nick]; 
				    if(roster_item)
					{
					    $("#rosteritem"+roster_item.id).remove();
					    delete my_app._roster[nick];
					    my_app._rosteritemview.showJoinLeave(nick,"left");
					}
				}
			    }
			}
		    }
		}//not a muc 
	    });
	}
	return true;
    },
    completeNick: function(nick_elem) {
	var msg_text = $("#send_chat_message").attr("value");
	msg_text += nick_elem;
	$("#send_chat_message").attr("value",msg_text+" ");
	$("#send_chat_message").focus();
    },
    createRosterPopup: function(roster_elem) {

	if(! roster_elem) return;
	if(roster_elem.length == 0) return;
	// options
	var distance = 1;
	var time = 250;
	var hideDelay = 500;

	var hideDelayTimer = null;

	// tracker
	var beingShown = false;
	var shown = false;

	var trigger = roster_elem;
	var popup = $('.rostervcard', roster_elem).css('opacity', 0);

	// set the mouseover and mouseout on both element
	$([trigger.get(0), popup.get(0)]).mouseover(function () {
	  
	    // stops the hide event if we move from the trigger to the
	    // popup element
	    if (hideDelayTimer)
	    {
		clearTimeout(hideDelayTimer);
	    }
	    // don't trigger the animation again if we're being shown,
	    // or already visible
	    if (beingShown || shown)
	    {
		return;
	    }
	    else
	    {
		beingShown = true;
		var top = $(this).css("top");
		var left = $(this).css("left");
		// reset position of popup box
		popup.css({
                   top: top,
		   left: left,
		   display: 'block' // brings the popup back in to view
		   })

		// (we're using chaining on the popup) now animate
		// it's opacity and position
		.animate({
                   top: '-=' + distance + 'px',
		   opacity: 1
			    }, time, 'swing', function() {
				// once the animation is complete, set
				// the tracker variables
				beingShown = false;
				shown = true;
			    });
	    }
	}).mouseout(function () {
	  
	    // reset the timer if we get fired again - avoids double animations
	    if (hideDelayTimer)
	    {
		clearTimeout(hideDelayTimer);
	    }
	    // store the timer so that it can be cleared in the
	    // mouseover if required
	    hideDelayTimer = setTimeout(function () {
		hideDelayTimer = null;
		popup.animate({
          top: '-=' + distance + 'px',
		   opacity: 0
		   }, time, 'swing', function () {
		       // once the animate is complete, set the
		       // tracker variables
		       shown = false;
		       // hide the popup entirely after the effect
		       // (opacity alone doesn't do the job)
		       popup.css('display', 'none');
		   });
	    }, hideDelay);
	});

    },
    connected: function () {
	return this._connected;
    },
    
    configure_chat: function() {
	if(this._chat)
	{
	    var iqid = this._chat.configure();
	    this._connection.addHandler(app._onRoomConfigureResult,
					null,
					"iq",
					null,
					iqid,
					null);
	}
	else
	{
	    this._roomconfigview.showError("Unable to configure room.");
	    this._roomconfigview.show();	    
	}

    },

    send_chat_configuration: function(config) {
	if(this._chat)
	{

	    var iqid = this._chat.saveConfiguration(config);
	    this._connection.addHandler(app._onRoomSaveConfigureResult,
					null,
					"iq",
					null,
					iqid,
					null);
	}
    },
    
    _onRoomConfigureResult: function(stanza) {
	//display form

	var query = $(stanza).find("query")

	if (query.length > 0)
	{
	    app._roomconfigview.buildConfigurationForm(stanza);
	}
	else
	{
	    //display error
	    app._roomconfigview.showError("Unable to configure room.");
	}
	
	$("#configure_room_form").find("a").click(function()
	    {
		app._roomconfigview.hide();
		if(app._chat)
		{
		    app._chat.cancelConfiguration();
		}
		return false;
	    });
	app._roomconfigview.show();
    },
    _onRoomSaveConfigureResult: function (stanza) {

	var query = $(stanza).find("query");
	if(query.length > 0)
	{
	    if (query.find("error").length > 0)
		{
		    //display error
		    app._roomconfigview.showError("Unable to configure room.");
		    
		}
	    else
		{
		    app._roomconfigview.addMessage("<p>Saved.</p>");
		}
	}
	else
	{
	    //display error
	    app._roomconfigview.showError("Unable to configure room.");	    

	}

    },
    //find a username based on partial name, returns actual username
    findRosterItem: function(partial_name) {
	var retval = null;
	if(app._roster)
	{
	    for(var x in app._roster)
	    {
		if(x.match(partial_name))
		{
		    return x;
		}
	    }
	    
	}
	return retval;
    }
};

