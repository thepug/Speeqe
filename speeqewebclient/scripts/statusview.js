/*

Copyright 2007-2008 OGG, LLC
See LICENSE.txt 

 Display the user's status.

*/

Speeqe.StatusView.prototype = {
    /*
      Shows the users status (disconnected,connectec,etc)
      html ids used:
      #status_disconnected
      #status_connected
      #status_authentication_failed
      #status_authenticating
      #status_connect_failed
    
    */
    displayStatus: function (status,cond,connected) {

	if (status == Strophe.Status.CONNECTING)
	{
	    $("#login").empty();
	    $("#login").append("Connecting...");
	    this.toggleStatusElement("#status_connecting");
	}
	else if (status == Strophe.Status.CONNFAIL)
	{
	    $("#login").empty();
	    $("#login").append("Failed to login. ");
	    if (cond == "remote-connection-failed" && connected)
	    {
		XMPP_ERROR_MESSAGE = "Error: Remote connection failed. Please check the domain portion of your username and try again.";
	    }
	    else if (cond == "remote-connection-failed" && connected)
	    {
		XMPP_ERROR_MESSAGE = "Error: Remote connection failed.";
	    }
	    else if (cond == "conflict")
	    {
		XMPP_ERROR_MESSAGE = "Error: You have been logged out due to a second login attempt from the same JID and resource.";
	    }
	    else
	    {
		XMPP_ERROR_MESSAGE = "Error: An unknown error occurred. Please try again, and if this problem persists, contact Speeqe support.";
	    }
	    
	    $("#login").append(XMPP_ERROR_MESSAGE);
	    this.toggleStatusElement("#status_connect_failed");
	}
	else if (status == Strophe.Status.AUTHENTICATING)
	{
	    $("#login").empty();
	    $("#login").append("Authenticating...");
	    this.toggleStatusElement("#status_authenticating");
	}
	else if (status == Strophe.Status.AUTHFAIL)
	{
	    $("#login").empty();
	    $("#login").append("Authentication Failed.");
	    this.toggleStatusElement("#status_authentication_failed");
	}
	else if (status == Strophe.Status.CONNECTED)
	{
	    //do something
	    $("#login").empty();
	    $("#login").append("Connected.");
	    $("#dashboard_available").show();
	    $("#dashboard_signon").hide();	    	    
	    $("#dashboard_signoff").show();	    
	}
	else if (status == Strophe.Status.DISCONNECTED)
	{
	    $("#login").empty();
	    $("#login").append("<div>Disconnected.</div>");
	    $("#login").append("<a href='javascript:location.reload(true);'>Reconnect.</a>");
	    this.toggleStatusElement("#status_disconnected");
	    $("#dashboard_available").hide();
	    $("#dashboard_signoff").hide();	    	    
	    $("#dashboard_signon").show();	    	    
	}
       
    },

    all_ids: ['#status_disconnected',
	      '#status_connected',
	      '#status_authentication_failed',
	      '#status_authenticating',
	      '#status_connect_failed'
    ],
    
    toggleStatusElement: function(elem_id) {

	//hide all child elements
	jQuery.each(this.all_ids, function(i,status_div) {
	    $(status_div).hide();
	});
	
	//show passed in element id
	$(elem_id).show();
    }
};
