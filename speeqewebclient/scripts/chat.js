/*

Copyright 2007-2008 OGG, LLC
See LICENSE.txt

*/

Speeqe.CHAT_MESSAGE_HISTORY     = 1000;
Speeqe.NS_MUC_OWNER = Strophe.NS.MUC + "#owner";
Speeqe.NS_MUC_ADMIN = Strophe.NS.MUC + "#admin";

//class used to send xmpp chat specific requests via libstrophe
Speeqe.Chat.prototype = {
    
    //join a multi user chat room by sending presence to the room
    join: function ()
    {
	var password = null;
	if(arguments.length > 0)
	{
	    password = arguments[0];
	}
	this._nick = this._nick.replace("@"+Speeqe.XMPP_DOMAIN,"");
	var msg = Strophe.xmlElement("presence", [
						     ["from", this._connection.jid],
						     ["to", this._from + "/" + this._nick]
					]);
	var x = Strophe.xmlElement("x", [["xmlns", Strophe.NS.MUC]]);
	if(password)
	{
	    var password_elem = Strophe.xmlElement("password", [],password);
	    x.appendChild(password_elem);
	    
	}
	msg.appendChild(x);

	this._connection.send(msg);
    },

    //leave a multi user chat room by sending unavailable presence
    leave: function (call_back)
    {

	var presenceid = this._connection.getUniqueId();
	presence = Strophe.xmlElement("presence", [
						   ["type",
						    "unavailable"],
						   ["id",
						    presenceid],
						   ["from",
						    this._connection.jid],
						   ["to",
						    this._from + "/" + this._nick]
				      ]);
	x = Strophe.xmlElement("x", [
				     ["xmlns", Strophe.NS.MUC]
			       ]);
	presence.appendChild(x);
	this._connection.send(presence);
	this._connection.addHandler(call_back,
				    null,
				    "presence",
				    null,
				    presenceid,
				    null);
    },
    //private function to send xmpp message
    _buildAndSendMessage: function(to,message,type) {
	text = Speeqe.htmlentities(message);
	    
	    
	var msgid = this._connection.getUniqueId();
	var msg = Strophe.xmlElement("message", 
					[
					 ["to", to],
					 ["from", this._connection.jid],
					 ["type", type],
					 ["id", msgid]
					 ]);
	msg.appendChild(Strophe.xmlElement("body", 
					      [["xmlns", 
						"jabber:client"]], 
					      text));
	
	x = Strophe.xmlElement("x", 
				  [["xmlns", "jabber:x:event"]]);
	x.appendChild(Strophe.xmlElement("composing"));
	msg.appendChild(x);
	this._messages.push(msg);
	while (this._messages.length > Speeqe.CHAT_MESSAGE_HISTORY)
	{
	    this._messages.splice(0,1);
	}
	
	this._connection.send(msg);
    },    

    //send a chat message to the multi user chat room
    sendMessage: function(text)
    {
	var command_map = {"/topic":this.setTopic,
			   "/kick":this.kickUser,
			   "/ban":this.banUser,
			   "/unban":this.unBanUser,
			   "/nick":this.changeNick,
			   "/join":this.newRoom,
			   "/help":this.helpDialog
	};

	var cmdArray = text.split(" ");
	var cmd = cmdArray[0];
	var cmdtext = cmdArray.splice(1, cmdArray.length).join(" ");
	//process command ( /topic /ban etc..)
	cmd_activated = false;
	if (cmd.charAt(0) == '/')
	{
	    //looks like a command so lets kick off the
	    //appropriate command action
	    var callme = command_map[cmd];

	    if(callme)
	    {
		callme.apply(this,[cmdtext]);
		cmd_activated = true;
	    }
	    
	}
	else if (cmd.charAt(0) == '@')
	{
	    //send private message to specified user
	    var user = cmd.substr(1,cmd.length-1);
	    this.sendPrivateMessage(user,cmdtext);
	    cmd_activated = true;
	}
	
	if(!cmd_activated)
	{
	    this._buildAndSendMessage(this._from,text,"groupchat");
	}
	
    },
    
    //request to configure the multi user chat room
    configure: function () {
	//send iq to start room configuration
	var iqid = this._connection.getUniqueId("configureroom");
	var iq = Strophe.xmlElement("iq", [
					      ["id", iqid],
					      ["to", this._from],
					      ["type", "get"]
				       ]);
	var query = Strophe.xmlElement("query", [
						    ["xmlns", 
						     Speeqe.NS_MUC_OWNER]
					  ]);

	iq.appendChild(query);
	this._connection.send(iq);
	return iqid;
    },
    
    cancelConfiguration: function() {
    	//send iq to cancel room configuration
	var iqid = this._connection.getUniqueId("cancelconfigureroom");
	var iq = Strophe.xmlElement("iq", [
					      ["id", iqid],
					      ["to", this._from],
					      ["type", "set"]
				       ]);
	var query = Strophe.xmlElement("query", [
						    ["xmlns", 
						     Speeqe.NS_MUC_OWNER]
					  ]);
	var x = Strophe.xmlElement("x", [["xmlns", "jabber:x:data"],
					    ["type","cancel"]]);
	query.appendChild(x);
	iq.appendChild(query);
	this._connection.send(iq);
	return iqid;
    },
    
    //send the configuration form with changed settings 
    saveConfiguration: function(config) {
	var iqid = this._connection.getUniqueId("saveroom");
	var iq = Strophe.xmlElement("iq", [
					      ["id", iqid],
					      ["to", this._from],
					      ["type", "set"]
				       ]);
	var query = Strophe.xmlElement("query", [
						    ["xmlns", 
						     Speeqe.NS_MUC_OWNER]
					  ]);
	//attach configured form
	var x = Strophe.xmlElement("x", [["xmlns", "jabber:x:data"],
					    ["type","submit"]]);
	

	
	
	jQuery.each(config, function(i,item) {
	    //attach room persistent setting
	    x.appendChild(item);
	});


	query.appendChild(x);
	iq.appendChild(query);
	this._connection.send(iq);
	return iqid;
    },
    
    createInstantRoom: function() {
	//send iq to start room 
	var iqid = this._connection.getUniqueId("createinstantroom");
	var iq = Strophe.xmlElement("iq", [
					      ["id", iqid],
					      ["to", this._from],
					      ["type", "set"]
				       ]);
	var query = Strophe.xmlElement("query", [
						    ["xmlns", 
						     Speeqe.NS_MUC_OWNER]
					  ]);
	var x = Strophe.xmlElement("x", [["xmlns", "jabber:x:data"],
					    ["type","submit"]]);
	query.appendChild(x);
	iq.appendChild(query);
	this._connection.send(iq);
	return iqid;
    },

    setTopic: function(topic) {
	//sets the topic of conversation
	topic = Speeqe.htmlentities(topic);
	var msg = Strophe.xmlElement("message", [
						    ["to", this._from],
						    ["from", this._connection.jid],
						    ["type", "groupchat"]
					]);
	var subject = Strophe.xmlElement("subject", 
					    [["xmlns", 
					      "jabber:client"]], 
					    topic);
	msg.appendChild(subject);
	this._connection.send(msg);
	
    },
    
    kickUser: function(user) {
	this._modifyUser(user,"none","member");
    },

    banUser: function(userreason) {
	var userwithreason = userreason.split(" ");
	var user = userwithreason[0];
	var reason = userwithreason[1];
	this._modifyUser(user,null,"outcast",reason);
    },
    
    _modifyUser: function(nick,role,affiliation,reason) {
	var iqid = this._connection.getUniqueId("modechange");
	var iq = Strophe.xmlElement("iq", [
					      ["id", iqid],
					      ["to", this._from],
					      ["type", "set"]
				       ]);
	var query = Strophe.xmlElement("query", [
						    ["xmlns",
						     Speeqe.NS_MUC_ADMIN]
					  ]);
	var item = Strophe.xmlElement("item", [
						  ["nick", nick]
					 ]);
	if (role !== null)
	{
	    item.setAttribute("role", role);
	}
	if (affiliation !== null)
	{
	    item.setAttribute("affiliation", affiliation);
	}
	if (reason !== null)
	{
	    item.appendChild(Strophe.xmlElement("reason", reason));
	}
	query.appendChild(item);
	iq.appendChild(query);
	this._connection.send(iq);
	
    },
    //open up a new window for the new chat room.
    newRoom: function(room) {
	var url = ["http://",
		   Speeqe.HTTP_DOMAIN,
		   "/room/",
		   room,
		   "/"];

	window.open(url.join(""));
    },
    helpDialog: function() {
	Speeqe.loadHelpDialog();
    },
    changeNick: function(user) {

	if(Speeqe.ENABLE_NICK_CHANGE)
	{
	    this._nick = user;
		   
	    var msg = Strophe.xmlElement("presence", [
						      ["from", this._connection.jid],
						      ["to", this._from + "/" + this._nick]
					 ]);
	    var x = Strophe.xmlElement("x", [["xmlns", Strophe.NS.MUC]]);
	    
	    msg.appendChild(x);
	    
	    this._connection.send(msg);
	}
    },

    unBanUser: function(user) {
	
	var iqid = this._connection.getUniqueId("unban");
	var iq = Strophe.xmlElement("iq", [
					      ["id", iqid],
					      ["to", this._from],
					      ["type", "set"]
				       ]);
	query = Strophe.xmlElement("query", [
                                                ["xmlns", 
						 Speeqe.NS_MUC_ADMIN]
				      ]);
	item = Strophe.xmlElement("item", [
					      ["affiliation", "none"],
					      ["jid", jid]
				     ]);
	query.appendChild(item);
	iq.appendChild(query);
	this._connection.send(iq);
    },

    sendPrivateMessage: function(user,message) {
	if(!user.match(this._from))
	{
	    user_ar = [this._from,
		       "/",
		       user];
	    user = user_ar.join("");
	    
	}
	this._buildAndSendMessage(user,message,"chat");

	//Display a dummy message to notify user that it was sent.
	var srcurl = '/avatar-service/lookup/?sha1=f2f8ab835b10d66f9233518d1047f3014b3857cf';
	var stanza_ar = ["<message to='",
			 user,
			 "' from='",
			 user,
			 "' type='chat'><body>",
			 message,
			 "</body></message>"];
	var stanza_message = stanza_ar.join("");
	var stanza = stanza_ar.join("");

	app.messageView().displayMessage(this._nick, srcurl, stanza, true);
    }
};
