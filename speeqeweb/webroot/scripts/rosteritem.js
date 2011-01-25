/*

  Copyright 2007-2008 OGG, LLC
  See LICENSE.txt

*/

Speeqe.RosterItem.prototype =  {
    getAvatar: function ()
    {
        this._connection.vcard.get(this._onVCardResult, this.jid);
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
            nick = roster_item._nick;
            
            elemid = ["#onlineavatar",roster_item.id];
            
            if (Modernizr.canvas)
            {
                app._rosteritemview.show(roster_item, lu_nick);
            }
            else
            {
                try {
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
    }
};

