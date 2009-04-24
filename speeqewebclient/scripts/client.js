/*

Copyright 2007-2008 OGG, LLC
See LICENSE.txt

*/

var Speeqe = {
    //used by internet explorer to keep track of focused windows
    IE_ACTIVE_ELEMENT: false,

    IE6: ($.browser.msie && ( (parseInt($.browser.version)> 5.5) && (parseInt($.browser.version) < 7) )),


    sendmessage: function() {
	try {
	    app.sendMessage($("#send_chat_message").attr("value"));
	}
	catch(exc)
	{
	    console.error(exc);
	}
	$("#send_chat_message").empty();
	$("#send_chat_message").attr("value","");
    
    
	return false;
    },


    AVATAR_INSTANCE_STASH: 0,
    helpDialogHtml: " ",    
    _clear_text:true,

    Client: function() {

	this._last_key = null;

	this.handle_blur = function () {
	    //if browser is internet explorer and this isn't
	    //the active element, then return.

	    if(Speeqe.IE_ACTIVE_ELEMENT != document.activeElement)
	    {
		Speeqe.IE_ACTIVE_ELEMENT = document.activeElement;
		return true;
	    }
	    app.winFocus = false;
	    return true;
	};

	this.handle_focus = function () {
	    app.winFocus = true;
	    //erase stars
	    title = document.title.replace("** ","");
	    document.title = title;
	    return true;
	};

	this.init = function () {
	    
	    var my_client = this;
	    $(document).ready(function(){
          
		/*
		  Send a chat message.
		*/
		$("#send_chat").click(function() {
		    if(Speeqe._clear_text)
		    {
			$("#send_chat_message").empty();
			$("#send_chat_message").attr("value","");
			Speeqe._clear_text = false;
		    }
		    else
		    {
			Speeqe.sendmessage();
		    }
		    
		});

		/*
		  When hitting return in the chat message send message
		  to chat room Correctly handle backspace.
		*/
		$("#send_chat_message").keypress( function(key) {
		    var retval = false;
		    var f1_keycode = 112;
		    if(jQuery.browser.safari)
			{
			    f1_keycode = 63236;
			}
		    if(Speeqe._clear_text)
			{
			    $("#send_chat_message").empty();
			    $("#send_chat_message").attr("value","");
			    Speeqe._clear_text = false;
			}
		    if(key.keyCode == f1_keycode) //F1
			{
			    Speeqe.loadHelpDialog();
			    return false;	 
			}
		    if (key.which == 13) //enter key
			{
			    Speeqe.sendmessage();
			    this._last_key = null;
			}
		    else if(key.keyCode == 9)
			{
			    //tab key, detect username and try to auto complete
			    var alpha_numeric = this._last_key;
			    if(alpha_numeric)
			    {
				var match = alpha_numeric.match(/\w/g);
				if(match)
				{
				    var username = app.findRosterItem(alpha_numeric);
				    if(username)
				    {
					var msg_text=$("#send_chat_message").attr("value");
					var new_msg = msg_text.replace(alpha_numeric,username);
					$("#send_chat_message").attr("value",new_msg);
					this._last_key = null;
				    }
				}
			    }
			}
		    else
			{
			    var keyval = String.fromCharCode(key.which);
			    if(keyval && keyval.match(/\w/g))
			    {
				if(this._last_key)
				{
				    this._last_key += keyval;
				}
				else
				{
				    this._last_key = keyval;
				}
			    }
			    else
			    {
				this._last_key = null;
			    }
			    retval = true;
			}
		    return retval;
		});

		//set focus on chat text area
		$("#send_chat_message").get(0).focus();

		$("#send_chat_message").mousedown( function() {
		    
		    
		    if(Speeqe._clear_text)
			{
			    $("#send_chat_message").empty();
			    $("#send_chat_message").attr("value","");
			    Speeqe._clear_text = false;
			}

		});

		Speeqe.IE_ACTIVE_ELEMENT = document.activeElement;

		$("#login_form_username").focus( function() {
		    if( $("#login_form_username").attr("value") == "username")
			{
			    $("#login_form_username").empty();
			    $("#login_form_username").attr("value","");
			}
		});

		$("#login_form_password").focus( function() {
		    if( $("#login_form_password").attr("value") == "password")
			{
			    $("#login_form_password").empty();
			    $("#login_form_password").attr("value","");
			}
		});	  
	  	  	   
		Speeqe.dashBoardInit();
	       
		var menus = $("#dashboard ul li.button");
		
		menus.each(function(i)
		{
		    $(this).toggle(function()
		    {
			$("#dashboard ul li ul").hide();
			$("*").removeClass("clicked");
			$(this).addClass("clicked");
			$(this).children("ul").show();
		    },function()
		    {
			$(this).removeClass("clicked");
			$(this).children("ul").hide();
		    });
		});

	        $("#dashboard_signoff").click(function() {
		    app.disconnect();
		});
	
		$("#dashboard_signon").click(function() {
		    $(this).parent("ul").hide();
		    window.location.reload();
		});
		Speeqe.helpDialogInit();
		
		$("#search_room").click(function() {
		    window.open('http://'+Speeqe.HTTP_DOMAIN+'/messagesearch/'+app.getChatroom()+'/');
		});
		/*
		  Start the XMPP Client with the given username and password.
		*/
		$("#login_form_connect,").click(function() {
		    if (app == null)
		    {
			app = new Speeqe.Application();	
		    }
		    
		    if(app.connected() == false)
		    {
			if($("#login_form_username").attr("value") != 'username' && $("#login_form_password").attr("value") != "password" )
			{
			    app.run($("#login_form_username").attr("value"),
				    $("#login_form_password").attr("value"));
			}
			else
			{
			    app.run();
			}
		    }
		    else
		    {
			console.info("Connected:"+app.connected());
		    }


		    return false;
		});

		$("#show_help_dialog").click(function() {
		    Speeqe.loadHelpDialog();
		});

		$("#show_joinleave").click(function() {
		    var chatwindow = $("#chatWindow_chatpane");
		    
		    if (chatwindow.hasClass('joinleave'))
		    {
			chatwindow.removeClass('joinleave');
		    }
		    else
		    {
			chatwindow.addClass('joinleave');
		    }
		});
		
		$("#configure_chat").click(function() {
		    $(this).parent("ul").parent("li").click();
		    if(app)
			{
			    app.configure_chat();
			}
		    return false;
		});
		$('#configure_room_form').draggable({
			       zIndex: 	20,
			       opacity: 	0.7,
			       handle:	        '#configure_room_form_handle'
					    });

		$('#configure_room_form_close').click(function() {
		    $("#configure_room_form_message").empty();
		    $("#configure_room_form_input").empty();
		    $("#configure_room_form").hide("fast",function(){
			app.messageView().scrollTop();
		    });
		});

		$("#configure_room_form_input").submit(function()
		{
		    app._roomconfigview.save();

		    return false;
		});

		$("#changeuser").click(function() {
		    var new_url = "https://"+Speeqe.HTTP_DOMAIN+"/accounts/login/";
		    if (app._chatroom)
			{
			    new_url_array = ["?next=http://",
					     app._chatroom.split("@")[0],
					     ".",
					     Speeqe.HTTP_DOMAIN
			    ];
			    new_url += new_url_array.join("");
			}
		    window.location = new_url;
		    return false;
		});
		//Add a login floating dialog (use for preferences in
		//the future)
		$('#layer1').draggable({
			 	        zIndex: 	20,
					opacity: 	0.7,
				        handle:	        '#layer1_handle'
							    });
		$('#layer1_form').ajaxForm({
	                        target: '#form_message',
				dataType: 'xml',
				success: function(responseXML) 
				{
				        var error = $('login',responseXML).attr("msg");
					$("#layer1_form_submit").get(0).disabled = false;

					if (error.length != 0)
					{
					    $("#form_message").empty();
					    $("#form_message").append("Error: ");
					    $("#form_message").append(error);					
					}
					else
					{
					    $("#form_message").empty();
					    $("#form_message").append("Logged in.");
					    $("#layer1").hide();
					    window.location.reload();
					}

					
				},
				error: function(req,error)
				{
				    $("#form_message").empty();
				    $("#form_message").append("Error logging in. ");
				    $("#layer1_form_submit").get(0).disabled = false;
				},
				beforeSubmit: function() {
				    $("#layer1_form_submit").get(0).disabled = true;
				    $("#form_message").empty();
				    $("#form_message").append("Logging in...");
				}		  
		});
	
		$("#layer1").hide();
						
		$('.preferences, #changeuser_prefs').click(function() {
		    //set css top and left before displaying
		    Speeqe.showDraggable("#layer1");

	            return true;
		});
			
		$('#close').click(function() {
		    $("#form_message").empty();
		    $("#layer1").hide("fast",function(){
			app.messageView().scrollTop();
		    });
		    return true
		});
		
		//Add a debug log submit form, floating dialog 
		$('#debug_log_layer1').draggable({
			 	zIndex: 	20,
				opacity: 	0.7,
				handle:	        '#debug_log_layer1_handle'
						    });
		
		$('#debug_log_layer1_form').ajaxForm({
	                        target: '#debug_log_form_message',
				dataType: 'xml',
				resetForm: true,
				success: function(responseXML) 
				{
				        var error = $('submitlog',responseXML).attr("msg");
					$("#debug_log_layer1_form_submit").get(0).disabled = false;

					if (error.length != 0)
					{
					    $("#debug_log_form_message").empty();
					    $("#debug_log_form_message").append("Error: ");
					    $("#debug_log_form_message").append(error);					
					}
					else
					{
					    $("#debug_log_form_message").empty();
					    $("#debug_log_form_message").append("Problem Submitted.");
					    
					    
					}
					return true;
					
				},
				error: function(req,error)
				{
				    $("#debug_log_form_message").empty();
				    $("#debug_log_form_message").append("Error submitting log. ");
				    $("#debug_log_layer1_form_submit").get(0).disabled = false;
				},
				beforeSubmit: function(formArray,jqForm) {

				    $("#debug_log_layer1_form_submit").get(0).disabled = true;

				    if (console.dump)
				    {
					var data = $(console.dump());
					
					$("#debug_log_form_submit_data").attr("value",data.html());

					jQuery.each(formArray, function(i,val) {
					    if("debuglog" == val['name'])
					    {
						formArray[i]['value'] = data.html();
					    }
					});

				    }
				    $("#debug_log_form_message").empty();
				    $("#debug_log_form_message").append("Submitting...");

				    
				}		  
		});
		
		$("#debug_log_layer1").hide()
		
		$('#debug_log_show').click(function() {
		    Speeqe.showDraggable("#debug_log_layer1");
		    $("#debug_log_form_submit_desc").focus();				    
		    return true;
		});
			
		$('#debug_log_close').click(function() {
		    $("#debug_log_form_description").attr("value","")
		    $("#debug_log_form_message").empty();
		    $("#debug_log_layer1").hide("fast",function(){
			app.messageView().scrollTop();
		    });
		    $("#debug_log_form_submit_desc").attr("value","");
		});
		//Add a login floating dialog (use for preferences in
		//the future)
		$('#room_password_dialog').draggable({
		       zIndex: 	20,
		       opacity: 	0.7,
		       handle:	        '#room_password_dialog_handle'
				    });
		
		$('#room_password_dialog_close').click(function() {
		    $("#room_password_dialog_form_message").empty();
		    $("#room_password_dialog").hide("fast",function() {
			app.messageView().scrollTop();		    
		    });
		    $("#room_password_dialog_password").attr("value","");
		    
		    app.disconnect();
		});
		$("#room_password_dialog_form").submit(function() {
		    var password = $("#room_password_dialog_password").attr("value");
		    app.joinChatWithPassword(password);
		    $("#room_password_dialog_form_message").empty();
		    $("#room_password_dialog").hide();
		    $("#room_password_dialog_password").attr("value","");
		    return false;
		});
		
		$(window).blur(my_client.handle_blur);
		
		$(window).focus(my_client.handle_focus);

		$(document).blur(my_client.handle_blur);
		
		$(document).focus(my_client.handle_focus);

		if($.browser.msie)
		{
		    if(document.onfocusout)
		    {
			document.onfocusout = my_client.handle_blur;
		    }
		    if(document.onfocusin)
		    {
			document.onfocusin = my_client.handle_focus;
		    }
		}
		
	    });
	    
	    
	    $(document).unload(function(){
		if(app)
		    {
			if(app._connection.do_anonymous)
			    {
				app.disconnect();
				app._connection.disconnect();
			    }
			
		    }
	    });

	    window.onbeforeunload = function(){
		if(app)
		{
		    app.disconnect();
		    app._connection.disconnect();
		    
		}
	    };
	    
	    $(window).unload(function(){
		if(app)
		    {
			app.disconnect();
			app._connection.disconnect();
		    }
	    });
	    
	};
    },

    /* Used to display users avatars. See avatar.js for
     * implementation.
     */
    AvatarService: function() {
	/** @type String */
	this.service = "/avatar-service/lookup/";

	/** @type Array @private */
	this._imageCache = [];

	this._max_av_height = 30;
	this._max_av_width = 30;

    },

    /*Displays chat room information. see chatroomview.js for
     * implementation.*/
    ChatRoomView: function() {
    },

    /*Displays a RosterItem in the html. See rosteritemview.js for
     * implementation.
     */
    RosterItemView: function() {
    },

    /*Displays the users status.  See statusview.js for implementation.*/
    StatusView: function() {
    },

    /*Displays a users message, along with a time stamp and user information.
     see messageview.js for implementation.*/
    MessageView: function() {
    },
    
    /*Displays the room configuration form.*/
    RoomConfigurationView: function() {
	this._items = [];
    },

    ROSTER_ID:0,
    /*
      Used to manage roster lists. See rosteritem.js for
      implementation.
     */
    RosterItem: function(connection,jid,nick) {
	this._connection = connection;
	this.jid = jid;
	this.id = Speeqe.ROSTER_ID++;
	this._nick = "";
	this.sha1 = "f2f8ab835b10d66f9233518d1047f3014b3857cf";
	this.vcard = $("<vCard xmlns='vcard-temp' />");
	if(nick)
	{
	    this._nick = nick;
	}
    },
    /*Handles xmpp chat. See chat.js for implementation.*/
    Chat: function(from,conn,nick) {

	this._from = from;
	//add the default speeqe chat sever
	if(from.indexOf("@") == -1)
	{
	    this._from = this._from + "@" + Speeqe.CHAT_SERVER;
	}
	this._from = Strophe.escapeJid(this._from);
	this._connection = conn;
	this._nick = nick;
	this._queue = [];
	this._messages = [];
    },
    
    /*Application controller.  See app.js for implemenation.*/
    Application: function() {
	
	this._connection = new Strophe.Connection(Speeqe.BOSH_URL);
	
	this._connected= false;
	this._authFailed= false;
	this._chat= null;
	this._roster= {};
	this.avatars= new Speeqe.AvatarService();
	//use a default chat room
	this._chatroom = Speeqe.DEFAULT_CHAT_ROOM;    
	
	this._message_view = new Speeqe.MessageView();
	this._chatroom_view = new Speeqe.ChatRoomView();
	this._rosteritemview = new Speeqe.RosterItemView();
	this._statusview = new Speeqe.StatusView();
	this._roomconfigview = new Speeqe.RoomConfigurationView();
	this.winFocus = true;
	this.anonymous = false;
    },
    /*Default dashboard. Init does nothing. Its redefined if
     * dashboard.js is loaded.*/
    dashBoardInit: function() {
	
    },
    helpDialogInit: function() {

    }
};
