var search = null;
var searchcl = null;

var SpeeqeWeb = {

    query: function(id) {
	$("#search_results").empty();
	//retrieve search paramaters
	var q = $("#search_query").attr('value');
	var room = $("#search_room").attr('value');
	var start_key = null;
	var end_key = null;
	if("search_pager" == id)
	{
	    start_key = $("#search_results_pager_value").text();
	}
	if("search_pager_next" == id)
	{
	    end_key = $("#search_results_pager_next_value").text();
	}

	search.filter(q,room,start_key,end_key);
    },
    
    SearchClient: function() {

	
	this.init = function() {
	    
	    $("#search_pager").click(function (elem) {
		SpeeqeWeb.query();
		return false;
	    });

	    $("#search_form").submit(function (elem) {
		SpeeqeWeb.query();
		return false;
	    });

	    //these should be empty, but in case they aren't on a
	    //reload use them.
	    var q = $("#search_query").attr('value');
	    var room = $("#search_room").attr('value');
	    search.filter(q,room); //retrieve default screen
	};
    },
    
    Search: function() {

	this.filter = function(q,room,start_key,end_key) {
	    //query message via couchdb view
	    var vc = $.jqCouch.connection('view',{server_url:'/couchdb/'});
	    //build the view url
	    var query_url = 'muc_log/';//?count=30&descending=true';
	    var start_key_str = "";
	    var end_key_str = "";
	    var query_options = {'count':30};
	    var query_fun = {"map":"function(doc){emit(doc.timestamp,doc);}"};
	    var query_fun_cond_string = "function(doc){var display_message = false; var display_room = false;";

	    if(q)
	    {    
		//query_fun_cond_string += "var message_filter = RegExp("+q+",'g');display_message = doc.message.match(message_filter);";
		query_fun_cond_string += "display_message = doc.message.match(/"+q+"/gi);";
	    }
	    else
	    {
		query_fun_cond_string += "display_message = true;";
	    }
	    if(room)
	    {			
		query_fun_cond_string += "display_room =  (doc.room == \""+room+"\");";
	    }
	    else
	    {
		query_fun_cond_string += "display_room = true;";
	    }
	    query_fun_cond_string += "if( display_message && display_room) {emit(doc.timestamp,doc);}}";

	    if(start_key)
	    {
		query_options['startkey'] = jQuery.toJSON(start_key);
	    }
	    if(end_key)
	    {
		query_options['endkey'] = jQuery.toJSON(end_key);
	    }
	    query_fun['map'] = query_fun_cond_string;
	   
	    jQuery.each(vc.temp(query_url,
				query_fun,
				query_options).rows,function (i,elem) {
		//if returned element has a value process result
		if(elem['value'])
		{
		    if(0 == i)
		    {
			end_key_str = String(elem['key']);
		    }
		    
		    
		    $("#search_results").append("<div>");
		    if(elem['value']['room'])
		    {
			
			var message = "";
			var roomname = "";
			//test for a message and a room name
			if(elem['value']['message'])
			    {
				message = String(elem['value']['message']);
			    }
			if(elem['value']['room'])
			    {
				roomname = String(elem['value']['room']);
			    }
			//test for filter string or room name filter
			if(q || room)
			    {
				var display_message = false;
				var display_room = false;
				if(q)
				{    
				    var message_filter = RegExp(q,'g');
				    display_message = message.match(message_filter);
				}
				else
				{
					display_message = true;
				}
				if(room)
				{
				    display_room =  (roomname == room); 
				}
				else
				{
				    display_room = true;
				}
				
				if(display_message && display_room)
				    {
					if("" != message)
					    {
						
					$("#search_results").append("<div class='room_name'>"+String(elem['value']['room']+"</div>"));
					$("#search_results").append("<div class='message'> : " +message+"</div>");
					$("#search_results").append("<span class='timestamp'> : " +String(elem['value']['timestamp']+"</span>"));
				    }
				}
			    }
			    else
			    {
				if("" != message)
				{
				    
				    $("#search_results").append("<div class='room_name'>"+String(elem['value']['room']+"</div>"));
				    $("#search_results").append("<div class='message'> : " +message+"</div>");
				    $("#search_results").append("<span class='timestamp'> : " +String(elem['value']['timestamp']+"</span>"));
				}

			    }
		    }
			else
			{
			    $("#search_results").append(" missing room name.");
			}
			$("#search_results").append("</div>");
			start_key_str = String(elem['key']);
		    }
	    });
	    if("" != start_key_str)
	    {
		$("#search_results_pager").empty();
		$("#search_results_pager").append("<a id=\"search_pager\" href=\"#\">&lt &lt Previous</a><div id='search_results_pager_value' style='display:none;'>"+start_key_str+"</div>");
		$("#search_pager").click(function () {
		    SpeeqeWeb.query($(this).attr("id"));
		    return false;
		});
	    }
	    if("" != end_key_str)
	    {
		$("#search_results_pager_next").empty();
		$("#search_results_pager_next").append("<a id=\"search_pager_next\" href=\"#\"> Next &gt&gt</a><div id='search_results_pager_next_value' style='display:none;'>"+end_key_str+"</div>");
		$("#search_pager_next").click(function () {
		    SpeeqeWeb.query($(this).attr("id"));
		    return false;
		});
	    }
	    
	};
    }
};

$(document).ready(function() {
    search = new SpeeqeWeb.Search();
    searchcl = new SpeeqeWeb.SearchClient();
    searchcl.init();
});
