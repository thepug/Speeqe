/*

Copyright 2007-2008 OGG, LLC
See LICENSE.txt

Display MUC messages to message DIV with id chatWindow_chatpane and
display room topic in element with id room_topic.

*/
var MAX_SCROLL_SIZE = 1000;

Speeqe.MessageView.prototype = {

    /*Translate new lines into <br /> Handle the /me display. Turn
     * links into live links and inline images. */
    translateMessage: function(message,auto_inline) {
	//match and replace a link with html

	message = this.htmlLink(message,auto_inline);
	message = message.replace(/^\/me/,"");
	message = message.replace(/\n/g,"<br />");
	return message;
    },

    displayMessage: function(user,srcurl,stanza,current_user) {

	var stamp = null;
	//search for an existing time stamp in the message
	$(stanza).find("x").each(function () {
	    if($(this).attr('stamp'))
	    {
		stamp = $(this).attr('stamp');
	    }
	});
	var time = "";
	var year = "";
	var month = "";
	var day = "";
	var hour = "";
	var minute = "";
	var second = "";
	
	if (stamp)
	{
	    
	    ymdhms = stamp.split("T");
	    year = ymdhms[0].substr(0,4);

	    month = ymdhms[0].substr(4,2);

	    day = ymdhms[0].substr(6,2);

	    timearray = [year,
			 "/",
			 month,
			 "/",
			 day,
			 " - ",
			 ymdhms[1],
			 " UTC"];
	    hms = ymdhms[1].split(':');
	    hour = hms[0];
	    minute = hms[1];
	    second = hms[2];
	    time = timearray.join("");
	}
	else
	{
	    /*Create current time if time stamp is not sent in the stanza.*/
	    date = new Date();
	    year = date.getUTCFullYear();
	    month = Speeqe.zeroPad(date.getUTCMonth() + 1,2);
	    day = Speeqe.zeroPad(date.getUTCDate(),2);
	    hour = Speeqe.zeroPad(date.getUTCHours(),2);
	    minute = Speeqe.zeroPad(date.getUTCMinutes(),2);
	    second = Speeqe.zeroPad(date.getUTCSeconds(),2);	    
	    var Y = ""+year;
	    var M = "/"+ month;
	    var D = "/"+day;
	    var h = ""+hour;
	    var m = ""+minute;
	    var s = ""+second;
	    time = Y + M + D + " - " + h + ":" + m + ":" + s + " UTC";
	}
	var cleannick = user.replace("@","at");	
	cleannick = cleannick.replace(new RegExp(".","g"),"dot");
	
	//remove domain
	if (Speeqe.XMPP_DOMAIN !== null)
	{
	    user = user.replace("@"+Speeqe.XMPP_DOMAIN,"");
	}
	//First search for an html based message and use it.
	var message = $(stanza).find("html").find("body").text();
	var me_style = message.match(/^\/me.+\S+/);
	var private_message = $(stanza).attr("type") != "groupchat";

	if (message.length == 0) 
	{
	    
	    //if html based message isn't found use the regular body text
	    message = $(stanza).find("body").text();
	    me_style = message.match(/^\/me.+\S+/);


	    /*Used to display when the user sends a private message.*/
	    if(private_message && message.length == 0)
	    {
		message = jQuery.trim($(stanza).text());
	    }
	    
	    if (!Speeqe.testSupportedTags(message))
	    {
		message = this.translateMessage(message,true);
	    }
	    else
	    {
		//strip unsafe attributes from tags
		var elem = $(message);
		elem = this._handleSupportedTags(elem);
		message = elem;		    
		
	    }
	}
	else
	{
	    message = this.translateMessage(message,true);
	}
	message = jQuery.trim(message);
	if(message.length > 0)
	{

	    var post_clone = $("#chatpane_post").clone();
	    post_clone.removeAttr("id");
	    post_clone.find("img").attr("class","avatar"+cleannick);
	    post_clone.find("img").attr("src",srcurl);
	    post_clone.find("img").attr("alt",user);
	    post_clone.find("#message_time_stamp").text(time);
	    post_clone.find("#message_time_stamp").removeAttr("id");
	    //break up username into user and domain
	    var userdomainname = user.split('@');
	    var username = userdomainname[0];
	    var userdomain = userdomainname[1];

	    //break down date if wanted and user , domain
	    var message_ids = {'#message_time_year':year,
			       '#message_time_month':month,
			       '#message_time_day':day,
			       '#message_time_hour':hour,
			       '#message_time_minute':minute,
			       '#message_time_second':second,
			       '#message_user_name':username,
			       '#message_user_domain':userdomain
	    };

	    jQuery.each(message_ids, function(i,val) {
		var ms = post_clone.find(i);
		if(ms.length > 0)
		    {
			ms.text(val);
			ms.removeAttr("id");
		    }
	    });


	    post_clone.find("#message_username").text(user);

	    if(private_message == true)
	    {
		post_clone.addClass("private_message");
	    }
	    else
	    {
		post_clone.removeClass("private_message");
	    }

	    post_clone.find("#messagepost").html(message);
	    post_clone.find("#messagepost").removeAttr("id");
	    if(current_user == true)
	    {
		post_clone.addClass("current_user");
	    }
	    else
	    {
		post_clone.removeClass("current_user");
	    }
	    if(me_style)
	    {
		post_clone.addClass("me_command");
	    }
	    else
	    {
		post_clone.removeClass("me_command");
	    }

	    var chatwindow = $("#chatWindow_chatpane");
	    Speeqe.scaleImage(post_clone);

	    if (chatwindow.hasClass('direction-up'))
	    {
		var scrollit = true;
		//use chat window to scroll unless it has the default overflow 
                var scroll_elements = chatwindow;
		if(chatwindow.css('overflow') == 'visible')
		    {
			scroll_elements = $('html,body');
		    }

		scroll_elements.each(function(i,elem) {

		    if((elem.scrollTop+elem.clientHeight) < elem.scrollHeight)
			{
			    if(elem.scrollTop !== 0)
				{

				    scrollit = false;
				}
			}
		});


		var inline_obj = post_clone.find('.autoinline');
		var msg_view = this;
		inline_obj.load( function() {
		    //scroll after inline object loads
		    if(scrollit)
			{
			    msg_view.scrollTop();
			}
		});

		chatwindow.append(post_clone.get(0));
		

		if(scrollit)
		    {
			this.scrollTop();
		    }
	    }
	    else
	    {
		chatwindow.prepend(post_clone.get(0));
	    }

	}
	if(! app.winFocus)
	{
	    //if this window is out of focus attach a notification of
	    //new messages
	    document.title = "** " + $(stanza).attr('from').split("/")[0];
	}
	else
	{
	    document.title = $(stanza).attr('from').split("/")[0];
	}
	/*if window has grown too large chop off the
	  last message.*/
	var chatWindow_divs = $("#chatWindow_chatpane > div");
	var chatwindow = $("#chatWindow_chatpane");
	if( chatWindow_divs.length > MAX_SCROLL_SIZE )
	{
	    var msg_index = chatWindow_divs.length - 2;
	    
	    if (chatwindow.hasClass('direction-up'))
	    {
		msg_index = 1;
	    }
	    var lastelem = chatWindow_divs.get(msg_index);

	    $(lastelem).remove();
	}
    },
    

    displayTopic: function(stanza) {
	//set the topic
	var topic = $(stanza).find('subject').text();
	topic = this.translateMessage(topic,false);
	topic = $.trim(topic);
	$("#room_topic").empty();
	$("#room_topic").append(topic);
	$("#outer_room_topic").show();
    },

    displayErrorMessage: function(stanza) {
	var room_avatar = '/avatar-service/lookup/?sha1=f2f8ab835b10d66f9233518d1047f3014b3857cf';
	var room = $(stanza).attr("from").split("/")[0];
	this.displayMessage(room,room_avatar,stanza,false);
    },

    displayKickBan: function(stanza) {
	var room = $(stanza).attr("from").split("/")[0];
	var user = $(stanza).attr("from").split("/")[1];
	var status = $(stanza).find("status").attr("code");
	var kick_or_ban = "kicked";
	if ('301' == status)
	{
	    kick_or_ban = "banned";
	}
	var room_avatar = '/avatar-service/lookup/?sha1=f2f8ab835b10d66f9233518d1047f3014b3857cf';
	var kick_message_ar = ["<message from='",
			       $(stanza).attr("from"),			       
			       "' to='4@dev.speeqe.com/3' id='1' type='groupchat'><x xmlns='jabber:x:event'><composing/></x></message>"
	];
	var kick_message_jq = $(kick_message_ar.join(""));
	var body_elem = document.createElement("body");
	var body_text = document.createTextNode("/me was "+kick_or_ban+" from the room.");
	body_elem.appendChild(body_text);

	kick_message_jq.append(body_elem);

	this.displayMessage(user,room_avatar,kick_message_jq.get(0),false);
    },

    scrollTop: function() {
	var chatwindow = $("#chatWindow_chatpane");
	
	if (chatwindow.hasClass('direction-up'))
	{	 
	    //use chat window to scroll unless it has the default overflow 
	    var scroll_elements = chatwindow;
	    if(chatwindow.css('overflow') == 'visible')
		{
		    scroll_elements = $('html,body');
		}

	    scroll_elements.each(function(i,elem) {
		elem.scrollTop = elem.scrollHeight;
	    });

	}
    },

    _handleSupportedTags: function(elem) {

	if(elem.is("img"))
	{

	    var imgelem = elem;

	    //save valid attributes
	    var src = imgelem.attr("src");
	    if(src)
	    {
		src = Speeqe.htmlentities(src);
	    }
	    var width = imgelem.attr("width");
	    if(width)
	    {
		width = Speeqe.htmlentities(""+width);
	    }
	    var height = imgelem.attr("height");
	    if(height)
	    {
		height = Speeqe.htmlentities(""+height);
	    }
	    var alt = imgelem.attr("alt");
	    if(alt)
	    {
		alt = Speeqe.htmlentities(alt);
	    }

	    message_ar = ["<img src='",
			  src,
			  "'"];
	    if(alt)
	    {
		message_ar.push(" alt='");
		message_ar.push(alt);
		message_ar.push("'");
	    }
	    if(width)
	    {
		message_ar.push(" width='");
		message_ar.push(width);
		message_ar.push("'");
	    }
	    if(height)
	    {
		message_ar.push(" height='");
		message_ar.push(height);
		message_ar.push("'");
	    }
	    message_ar.push(" class=\"autoinline\" style=\"display:none;\"/>");
	    
	    elem = message_ar.join("");
	    
	}
	else if(elem.is("object")) 
	{	    
	    
	    var embed = elem.find("embed");
	    var embed_src = embed.attr("src");
	    if(embed_src)
	    {
		embed_src = Speeqe.htmlentities(embed_src);
	    }
	    var message_ar  = ["<object width='425' height='344'><param name='movie' value='",
			       embed_src,
			       "'></param><embed src='",
			       embed_src,
			       "' type='application/x-shockwave-flash' width='425' height='344' ></embed>",
			       " </object>"];
	    elem = message_ar.join("");

	}
	else 
	{
	    elem = "";
	}
	return elem;
	
    },
    
    htmlLink: function(text,auto_inline) {
	var imgurl = /((?:ht|f)tps?:\/\/.+\.(png|jpeg|jpg|gif|bmp)$)/ig;
	var mp3url = /((?:ht|f)tps?:\/\/.+\.(mp3)$)/ig;
	var linksReg = /((?:ht|f)tps?:\/\/[\S|\?]+)/g;
	var ahtmlReg = /<a.+href.+>.+<\/a>.*/g;
        var retval = "";
	var text_words = text.split(' ');

	jQuery.each(text_words, function(i,text_val) {
	    var amatch = text_val.match(ahtmlReg);
	    var match = text_val.match(linksReg);

	    var imgmatch = false;
	    var mp3match = false;
		
	    if(auto_inline)
	    {
		imgmatch = text_val.match(imgurl);
		mp3match = text_val.match(mp3url);
	    }
	    if (match && !amatch && !imgmatch &&!mp3match)
	    {
		var urltext = text_val;
		jQuery.each(match,function(i,val) {

		    var atext = Speeqe.urlwbr(match[i],10);

		    var newEl = ["<a href=\"",
				 match[i],
				 "\" target=\"_blank\">",
				 atext,
				 "</a> "];
		    //escape special regular expression characters
		    var url_regex = match[i].replace(/(\?|\+|\-|\||\^|\$|\(|\)|\*)/g,'\\$1');

		    
		    urltext = urltext.replace(new RegExp(url_regex,"g"), 
					      newEl.join(""));

		});
		retval += urltext;
	    }
            else if (mp3match)
            {
		var newEl = ["<embed type='application/x-shockwave-flash\" src=\"http://www.google.com/reader/ui/3247397568-audio-player.swf?audioUrl=",
			     mp3match[0],
			     "\" width=\"400\" height=\"27\" allowscriptaccess=\"never\" quality=\"best\" bgcolor=\"#ffffff\" wmode=\"window\" flashvars=\"playerMode=embedded\" /><br /><a href=\"",
			     mp3match[0],
			     "\" >",
			     mp3match[0],
			     "</a>"];

                retval += text_val.replace(new RegExp(mp3match[0],"g"),
                                           newEl.join(""));
	    }
            else if (imgmatch)
            {

                var newEl = ["<img src=\"",
		             imgmatch[0],
                             "\" class=\"autoinline\" style=\"display:none;\"/>"
		    ];
                retval += text_val.replace(new RegExp(imgmatch[0],"g"),
                                           newEl.join(""));
            }
            else
            {
		//get default word break from theme otherwise use 10
		var word_break = $("#message_word_break").attr("value");
		if(! word_break)
		{
		    word_break = 10;
		}
		
		message = Speeqe.wbr(text_val,word_break);
		retval += message + " ";
            } 	
	});

	return retval;
    }
};
