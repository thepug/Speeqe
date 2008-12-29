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
	    var email_html_ar = ["<div>email:<a href=mailto:",
				 email.text(),
				 ">",
				 email.text(),
				 "</a></div>"];
	    roster_elem.find("#vcard_email").empty().append($(email_html_ar.join("")));
	}
	if(desc.length > 0)
	{
	    roster_elem.find("#vcard_desc").text("description: "+desc.text());
	}
	if(url.length > 0)
	{
	    var url_html_ar = ["<div>homepage:<a href=",
			       url.text(),
			       " target='_blank'>",
			       url.text(),
			       "</a></div>"];
	    roster_elem.find("#vcard_url").empty().append($(url_html_ar.join("")));
	}	
    }
};
