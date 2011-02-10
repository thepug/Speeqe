/*
    Copyright 2006-2008, OGG LLC
    See LICENSE.txt
*/


var DEFAULT_AV_HASH = "";

/**
 * @class Avatar service handles turning base64 avatar data into
 *        sha1 hashes for use with the avatar lookup server function.
 * @constructor
 */
Speeqe.AvatarService.prototype = {
	

	/**
	 * Starts a request for an avatar.
	 *
	 * @param {String} elemID The ID of the element to place the avatar in when acquired.
	 * @param {String} base64 The base64 encoded version of the avatar to lookup.
	 * @param {String} mime The mime type of the avatar image.
	 * @param {String} jid The JID to update avatar info for if found.
	 */
	get: function (elemID, base64, mime, jid)
	{

	    if (!base64 || !mime)
	    {
		return;
	    }
	    
	    var data = {'mime':mime, 'base64':base64};
	    var _me = this;
		
	    jQuery.post(this.service,data,function(retdata) {
		_me._avatar_cb(retdata,elemID,jid);
	    });
	    

	},

	/**
	 * Handles the avatar info response.
	 *
	 * @param {XMLHttpRequest} req The XMLHttpRequest with the response data.
	 * @param {String} elemID The element ID to assign the avatar to.
	 * @param {RosterItem} jid The jid to update with the avatar info.
	 * @private
	 */
	_avatar_cb: function (req, elemID, jid)
	{	    
	    var elem = $(elemID);
	    if (!elem)
	    {
		return;
	    }
	    var sha1 = req.split("|")[0];

	    var img_width  = parseInt(req.split("|")[1], 10);
	    var img_height = parseInt(req.split("|")[2], 10);
	    
	    if (isNaN(img_width) || isNaN(img_height)) { return; }
	    
	    if (img_width > this._max_av_height)
	    {
		img_height = (this._max_av_height * img_height) / img_width;
		img_width = 30;
	    }
	    else if (img_height > this._max_av_height)
	    {
		img_width = (this._max_av_width * img_width) / img_height;
		img_height = 30;
	    }

	    jid.sha1 = sha1;
	    var img_url = [this.service,"?sha1=",sha1];
	    app._rosteritemview.drawAvatar(elem,
                                           {
                                               src:img_url,
                                               width: img_width,
                                               height: img_height,
                                               data: false,
                                               sha1: sha1
                                           });
	}
}
