/*

Copyright 2007-2008 OGG, LLC
See LICENSE.txt

*/

Speeqe.RosterItem.prototype =  {

    getAvatar: function ()
    {
	    
	var iqid = this._connection.getUniqueId("getavatar");
	var iq = Strophe.xmlElement("iq", [
					      ["id", iqid],
					      ["from", this._connection.jid],
					      ["to", this.jid],
					      ["type", "get"]
				       ]);
	var vcard = Strophe.xmlElement("vCard", [
						    ["xmlns", "vcard-temp"]
					  ]);
	iq.appendChild(vcard);
	this._connection.addHandler(this._onVCardResult, 
				    null, 
				    "iq", 
				    null, 
				    iqid,
				    null);
	this._connection.send(iq);
    },

    _onVCardResult: function(stanza) {
	var binval = $(stanza).find("BINVAL").text();
	var vcard = $(stanza).find("vCard");
	var lu_nick = $(stanza).attr("from").split("/")[1];
	
	var roster_item = app._roster[lu_nick];
	if (vcard.length > 0)
	{
	    roster_item.vcard = vcard;
	    app._rosteritemview.updateVcard(roster_item);
	}
	if (binval)
	{
	    var type = $(stanza).find("TYPE").text();
	    try
		{

		    nick = roster_item._nick;

		    elemid = ["#onlineavatar",roster_item.id];
		    
		    app.avatars.get(elemid.join(""),
				    binval,
				    type,
				    roster_item);

		    if(nick && nick != "")
			{
			    var cleannick = nick.replace("@","at");
			    cleannick = cleannick.replace(/\./g,"dot");
			    
			    
			    var nickid = [".avatar",
					  cleannick];

			    app.avatars.get(nickid.join(""),
					    binval,
					    type,
					    roster_item);
			    
			}
		}
	    catch (ex)
		{
		    console.error(ex);
		}
	}

	return true;
    }

};
