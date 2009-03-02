/*

  Copyright 2007-2008 OGG, LLC
  See LICENSE.txt

  Display the roster item.

*/

Speeqe.RosterItemView.prototype =  {
    /*
      Clones the roster item template and displays it in the roster
      item list.
     */
    show: function(roster_item,nick) {
	//if nick has our domain, erase
	var displaynick = nick.replace("@"+Speeqe.XMPP_DOMAIN,
				       "");
	var usernamedomain = displaynick.split('@');
	var username = displaynick;
	var domainname = "";
	if(usernamedomain.length > 0)
	{
	    username = usernamedomain[0];
	    domainname = usernamedomain[1];
	}
	
	var li_clone = $('#rosteritemtemplate').clone();
	li_clone.attr("id","rosteritem"+roster_item.id);
	li_clone.attr("style","display:block");
	li_clone.find("#onlineavatar").attr("src",'/avatar-service/lookup/?sha1=f2f8ab835b10d66f9233518d1047f3014b3857cf');
	li_clone.find("#onlineavatar").attr("id",'onlineavatar'+roster_item.id);
	li_clone.find("#onlineavatar").attr("alt",displaynick);
	
	li_clone.find("#roster_name").text(displaynick);
	li_clone.find("#roster_name").removeAttr("id");
	var username_elem = li_clone.find("#roster_user_name");
	if(username_elem.length > 0)
	{
	    username_elem.removeAttr("id");
	    username_elem.text(username);
	}

	var userdomain_elem = li_clone.find("#roster_user_domain");
	if(userdomain_elem.length > 0)
	{
	    userdomain_elem.removeAttr("id");
	    userdomain_elem.text(domainname);
	}	

	$("#online > ul").append(li_clone.get(0));
	this.createVcard(roster_item,nick);
	this.showJoinLeave(displaynick,"joined");
    },
    //create the vcard div that is displayed on roster item mouseover.
    createVcard: function(roster_item,nick) {
	var div_clone = $('#rosteritemvcardtemplate').clone();
	if(div_clone)
	{

	    div_clone.attr("id","rosteritemvcard"+roster_item.id);
	    div_clone.attr("style","display:none");

	    div_clone.css("position","absolute");
	    var username_elem = div_clone.find("#vcard_name");
	    if(username_elem.length > 0)
	    {
		username_elem.removeAttr("id");
		username_elem.text(nick);
		div_clone.find("#vcard_name").removeAttr("id");
	    }

	    var userdomain_elem = div_clone.find("#vcard_domain");
	    if(userdomain_elem.length > 0)
	    {
		userdomain_elem.removeAttr("id");
		userdomain_elem.text(domainname);
	    }

	    
	    var roster_elem = $("#rosteritem"+roster_item.id);
	    roster_elem.append(div_clone);
	}
    },
    updateVcard: function(roster_item) {
	var vcard = roster_item.vcard;
	var desc = $(vcard).find("DESC");
	var email = $(vcard).find("EMAIL");
	var url = $(vcard).find("URL");
	var roster_id = "#rosteritemvcard"+roster_item.id;

	var roster_elem = $(roster_id);

	if(email.length > 0)
	{
	    var email_display = jQuery.trim(email.text());
	    var email_html_ar = ["email:<a href=mailto:",
				 email_display,
				 ">",
				 Speeqe.urlwbr(email_display,14),
				 "</a>"];
	    roster_elem.find("#vcard_email").html(email_html_ar.join(""));
	}
	if(desc.length > 0)
	{
	    var description_display = "description: " + desc.text();
	    description_display = app.messageView().translateMessage(description_display,
								   false);
	    roster_elem.find("#vcard_desc").html(description_display);
	}
	if(url.length > 0)
	{
	    var url_html_ar = ["homepage:<a href=",
			       url.text(),
			       " target='_blank'>",
			       Speeqe.urlwbr(url.text(),14),
			       "</a>"];
	    roster_elem.find("#vcard_url").html(url_html_ar.join(""));
	}	
    },
    //display join room message 
    showJoinLeave: function(nick,status) {
	//test if we are to display message along with chat messages.
	var chatwindow = $("#chatWindow_chatpane");
	
	if (chatwindow.hasClass('joinleave'))
	{
	    var room_avatar = '/avatar-service/lookup/?sha1=f2f8ab835b10d66f9233518d1047f3014b3857cf';
	    var join_message_ar = ["<message from='"+nick+"' to='4@dev.speeqe.com/3' id='1' type='groupchat'><x xmlns='jabber:x:event'><composing/></x></message>"];
	    var join_message_jq = $(join_message_ar.join(""));
	    var body_elem = document.createElement("body");
	    var body_text = document.createTextNode("/me has "+status+" the room.");
	    body_elem.appendChild(body_text);
	    
	    join_message_jq.append(body_elem);

	    app.messageView().displayMessage(nick,
					     room_avatar,
					     join_message_jq.get(0),
					     false);
	}

	var msg_template = $('#room_message_template').clone();
	msg_template.find("#nick").text(nick);
	$('#room_messages').append(msg_template.get(0));
    }

};
