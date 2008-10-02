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
					      ["from", this._connection.jid + "/" + this._connection.resource],
					      ["to", this.jid],
					      ["type", "get"]
				       ]);
	var vcard = Strophe.xmlElement("vCard", [
						    ["xmlns", "vcard-temp"]
					  ]);
	iq.appendChild(vcard);
	this._connection.addHandler("_onVCardResult", this, null, "iq", null, iqid);
	this._connection.send(iq);
    },

    _onVCardResult: function(stanza) {
	var binval = $(stanza).find("BINVAL").text();
	if (binval)
	{
	    var type = $(stanza).find("TYPE").text();
	    try
		{
		    elemid = ["#onlineavatar",this.id];
		    
		    app.avatars.get(elemid.join(""),
				    binval,
				    type,
				    this);
		    if(this._nick != "")
			{
			    var cleannick = this._nick.replace("@","at");
			    cleannick = cleannick.replace(new RegExp(".","g"),
							  "dot");

			    
			    var nickid = [".avatar",
					  cleannick];
			    app.avatars.get(nickid.join(""),
					    binval,
					    type,
					    this);
			    
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
