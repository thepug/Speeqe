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
	var displaynick = nick.replace("@"+Speeqe.DOMAIN,
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
    }
};
