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
    join: function (onMessage, onPresence)
    {
	var password = null;
	if(arguments.length > 0)
	{
	    password = arguments[0];
	}
	this._nick = this._nick.replace("@"+Speeqe.XMPP_DOMAIN,"");
        this._connection.muc.join(this._from, 
                                  this._nick,
                                  onMessage,
                                  onPresence);
    },

    //leave a multi user chat room by sending unavailable presence
    leave: function (call_back)
    {
        this._connection.muc.leave(this._from, this._nick, call_back);
    },
    //private function to send xmpp message
    _buildAndSendMessage: function(to, message, type) {
        // don't send blank messages
        if ($.trim(message) === "")
        {
            return;
        }
        if (type !== "groupchat")
        {
            var msgid = this._connection.getUniqueId();
	    var msg = $msg({to: to,
                            from: this._connection.jid,
                            type: type,
                            id: msgid})
                .c("body",
                   {xmlns: Strophe.NS.CLIENT}).t(message);
            msg.up().c("x", {xmlns: "jabber:x:event"}).c("composing");
            this._connection.send(msg);
        }
        else
        {
            this._connection.muc.message(to, null, message);
        }
	this._messages.push(message);
	while (this._messages.length > Speeqe.CHAT_MESSAGE_HISTORY)
	{
	    this._messages.splice(0,1);
	}
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
	return this._connection.muc.configure(this._from);
    },
    
    cancelConfiguration: function() {
	return this._connection.muc.cancelConfigure(this._from);
    },
    
    //send the configuration form with changed settings 
    saveConfiguration: function(config) {
	return this._connection.muc.saveConfiguration(this._from, config);
    },    
    createInstantRoom: function() {
	return this._connection.muc.createInstantRoom(this._from);
    },
    setTopic: function(topic) {
	this._connection.muc.setTopic(this._from,topic);
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
    _modifyUser: function(nick, role, affiliation, reason) {
        this._connection.muc.modifyUser(this._from,
                                        nick,
                                        role,
                                        affiliation,
                                        reason);
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
            this._connection.muc.changeNick(this._from, user);
	}
    },

    unBanUser: function(user) {
	this._connection.muc.modifyUser(this._from,
                                        user,
                                        null,
	                                "none",
                                        null);
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
