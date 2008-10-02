/*

Copyright 2007-2008 OGG, LLC
see LICENSE.txt

*/

Speeqe.scaleImage = function(elem){
    var selector = '.autoinline';
    var elemQuery = $(elem);
    var img_elm = elemQuery.find(selector);
    
    if(img_elm.length != 0)
    {
	var loading_div = ["<div class='loading_img_div'>Loading... ",
			   img_elm.attr("src"),
			   "</div>"
	];
	elem.append(loading_div.join(""));
    }

    img_elm.load( function() {

	
	var max_width = 700;//Sets the max width, in pixels, for every image
	jQuery(this).hide();
	

	jQuery(this).each(function(){

	    var width = jQuery(this).width();
	    var height = jQuery(this).height();
	    
	    if (width > max_width) {

		var ratio = (height / width );
		var new_width = max_width;
		var new_height = (new_width * ratio);
		

		jQuery(this).height(new_height).width(new_width);
		
	    }
	});

	//link to the original image
	var orig_link_ar = ["<a href='",
			    jQuery(this).attr("src"),
			    "' target='_blank' ></a>"];
	jQuery(this).css("border","none");
	jQuery(this).wrap(orig_link_ar.join(""));

	jQuery(this).fadeIn();
	jQuery(".loading_img_div").empty();
    });
};
