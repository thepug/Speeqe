/*

Copyright 2007-2008 OGG, LLC
See LICENSE.txt

General utility javascript to help with the speeqe client.

*/

//Implement indexof for IE 6
if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
	for(var i=0; i<this.length; i++){
	    if(this[i]==obj){
		return i;
	    }
	}
	return -1;
    }
}

/*
  Add word breaks to long strings and escape html.
 */
Speeqe.wbr = function(str, num) {
    //Add word breaks to words (spaces , followed by word characters)
    if(str.length <= num)
    {	
	return Speeqe.htmlentities(str);
    }
    else
    {
	//need to split to cover all lines
	var strs = str.split("\n");
	var newline = "\n";
	if(strs.length == 1)
	{
	    newline = "";
	}
	var retval = "";
	jQuery.each(strs, function(i,val) {

	    var rmatch = strs[i].match(RegExp("(\\s*\\S{" + num + "})(\\S)"));
	    
	    if(!rmatch)
	    {

		retval = retval + Speeqe.htmlentities(strs[i]) + newline;
	    }
	    else
	    {
		retval = retval + strs[i].replace(RegExp("(\\s*\\S{" + num + "})(\\S)",
							 "g"), 
			       function(all,text,char){
				   text = Speeqe.htmlentities(text);
				   
				   return text + "<wbr />" + char;
				   
			       }) + newline;
	    }
	});
	return retval;
    }
}

/*
  Add word breaks to long urls.
 */
Speeqe.urlwbr = function(str, num) {
    //Add word breaks to words (spaces , followed by word characters)
    return str.replace(RegExp("(\\S{" + num + "})(\\S)", "g"), 
		       function(all,text,char){
	return text + "<wbr />" + char;
    });
}

//Pad a given integer with zeros with the given width
Speeqe.zeroPad = function(num,width) {
    num = num.toString();
    while (num.length < width)
	num = "0"+num;
    return num;
};

//displays a draggable jquery item in the visible area
Speeqe.showDraggable = function(selector,offset) {
    if(! offset)
    {
	offset = 100;
    }

    var scrollTop = document.body.scrollTop;
    var scrollLeft = document.body.scrollLeft;
    
    var viewPortHeight = document.body.clientHeight;
    var viewPortWidth = document.body.clientWidth;
    
    if (document.compatMode == "CSS1Compat")
    {
	viewPortHeight = document.documentElement.clientHeight;
	viewPortWidth = document.documentElement.clientWidth;
	
	scrollTop = document.documentElement.scrollTop;
	scrollLeft = document.documentElement.scrollLeft;
    }
    var element = $(selector).get(0);
    var topOffset = Math.ceil(viewPortHeight/2 - element.offsetHeight/2);
    var leftOffset = Math.ceil(viewPortWidth/2 - element.offsetWidth/2);

    $(selector).css("top",
		    (topOffset+scrollTop)+"px");
    $(selector).css("left",
		    (leftOffset-offset)+"px");
    $(selector).show();
}

//replace html greater than , less than with html equivelant 
Speeqe.htmlentities = function(text)
{
    
    text = text.replace(/\&/g, "&amp;");
    text = text.replace(/</g,  "&lt;");
    text = text.replace(/>/g,  "&gt;");
    text = text.replace(/'/g,  "&#39;");
    
    return text;
}

//Function used to test if you need to escape html entities. returns null if
//you don't. 
Speeqe.testSupportedTags = function(text)
{
    var retval = false;

    var imgtagregexp = /\s*<\s*img.+src.+>\s*/g;
    var matched = text.match(imgtagregexp);
    if (matched)
	{
	    retval = true;
	}
    if (!matched)
	{
	    var objecttagregexp = /\s*<\s*object.+>\s*<param.*name=.+movie.+<\/\s*object\s*>\s*/g;
	    matched = text.match(objecttagregexp);
	    if (matched)
		{
		    retval = true;
		}
	}
    return retval;
};

