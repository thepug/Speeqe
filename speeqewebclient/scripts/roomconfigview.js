/*

Copyright 2007-2008 OGG, LLC
See LICENSE.txt

*/
Speeqe.RoomConfigurationView.prototype = {

    buildConfigurationForm: function(stanza) {
	var logging = 0;
	var persistent = 0;
	var field_test = false;
	var the_view = this;
	//find the current persistent and logging value
	$(stanza).find("field").each(function(f,item) {
	    field_test = true;
	    var name = item.getAttribute("var");
	    var label = item.getAttribute("label");

	    if("text-single" == item.getAttribute("type") || "text-private" == item.getAttribute("type"))
	    {
		var input_type = "'text'";
		if("text-private" == item.getAttribute("type"))
		{
		    input_type = "'password'";
		}

		var text_input_ar = ["<input type=",
				     input_type,
				     " name='",
				     name,
				     "' id='",
				     name.replace('#','_'),
				     "' value='",
				     $(item).find("value").text(),
				     "' />"];
		var configure_form_item = ["<div><div class='leftinput'>",
					   label,
					   ".</div><div class='rightinput'>",
					   text_input_ar.join(""),
					   "</div></div>"
		];
		$("#configure_room_form_input").append(configure_form_item.join(""));
	    }
	    else if("list-single" == item.getAttribute("type"))
	    {

		var selected = $(item).children("value").text();

		var radio_buttons_ar = ["<div><div class='rem_leftinput'>",
					label,
					".</div><div class='rem_rightinput'>"];
		//loop through each option, creating a radio input
		$(item).find("option").each( function(i) {

		    var selected_text = "";
		    if($(this).text() == selected)
		    {
			selected_text = "checked";
		    }
		    var radio_option_ar = ["<div><input type='radio' name='",
					   name.replace('#','_'),
					   "' id='",
					   i+name.replace('#','_'),
					   "' value='",
					   $(this).text(),
					   "' ",
					   selected_text,
					   " /> ",
					   $(this).text(),
					   "</div>"];
		    radio_buttons_ar.push(radio_option_ar.join(""));
		});
		radio_buttons_ar.push("</div></div>");
		$("#configure_room_form_input").append(radio_buttons_ar.join(""));
	    }
	    else if("boolean" == item.getAttribute("type"))
	    {

		var checked = '';

		if($(item).find("value").text() == "1")
		{
		    checked = 'checked';
		}
		var checkbox_ar = ["<input type='checkbox' name='",
				   name,
				   "' value='1' ",
				   "id='",
				   name.replace('#','_'),
				   "' ",
				   checked,
				   " />"];
		var configure_form_item = ["<div><div class=\"leftinput\">",
					   label,
					   ".</div><div class=\"rightinput\">",
					   checkbox_ar.join(""),
					   "Yes</div></div>"
		];
		$("#configure_room_form_input").append(configure_form_item.join(""));

	    }
	    //save items to send later
	    the_view._items.push(item);
	});
	if(!field_test)
	{
	    this.showError("Unable to configure room.");
	}
	else
	{
	    var submit_button = "<input type='submit' name='save' value='Save' />"
	    $("#configure_room_form_input").append(submit_button);
	}
    },
    
    addMessage: function(message) {
	this.showError(message);
    },

    showError: function(error) {
	$("#configure_room_form_message").empty();
	$("#configure_room_form_message").append("<p>"+error+"</p>");
    },
    save: function() {
	try {
	    var config = [];
	    //loop through form items
	    jQuery.each(this._items,function(i,item) {
		var name = item.getAttribute("var");
		var type = item.getAttribute("type");

		if("boolean" == type)
		{
		    var value_text = '0';
		    if($('#'+name.replace('#','_')).attr("checked") ==  true)
		    {
			value_text = '1';
		    }

		    $(item).children("value").text(value_text);
		    config.push(item);
		}
		else if("text-single" == type || "text-private" == type)
		{
		    var selector = '#'+name.replace('#','_');
		    
		    var data = $(selector).attr("value");
		    $(item).children("value").text(data);
		    config.push(item);
		}
		else if("list-single" == type)
		{

		    var selector = "[name=" + name.replace('#','_') + "][checked]";
		    var value_text = $("#configure_room_form_input").find(selector).attr("value"); 
		    $(item).children("value").text(value_text);
		    config.push(item);
		}
	    });
	    
	    app.send_chat_configuration(config);
	}
	catch(ex) {
	    console.error(ex);
	}
    },
    hide: function() {
	$("#configure_room_form_message").empty();
	$("#configure_room_form_input").empty();
	$("#configure_room_form").hide();
    },
    
    show: function() {
	Speeqe.showDraggable("#configure_room_form");
    }

};
