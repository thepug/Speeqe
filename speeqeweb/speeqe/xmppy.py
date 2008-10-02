#
# Copyright (c) 2005 - 2008 Nathan Zorn, OGG, LLC 
# See LICENSE.txt for details
#

import xmpp
from django.conf import settings

class XmppAuthenticationError(Exception):
    """Unable to authenticate via xmpp."""
    pass

class XmppConnectionError(Exception):
    """Unable to connect via xmpp."""
    pass

    
def check_room_owner(username,password,room):
    """Check if given member is the room owner."""
    retval = False
    
    jid=xmpp.protocol.JID(username+"/speeqetest")

    client = xmpp.Client(jid.getDomain(),debug=[])

    con = client.connect(use_srv=True)

    if con:

        if client.auth(jid.getNode(),password,sasl=0):
            client.sendInitPresence()
            iq = xmpp.protocol.Iq(typ='get',
                                  to=room+'@'+settings.XMPP_CHAT,
                                  )
            query = iq.setTag("query",
                              namespace='http://jabber.org/protocol/muc#owner')
            res = client.SendAndWaitForResponse(iq)
            if not res.getError():
                retval = True

            #test the result
            client.disconnect()
        else:
            raise XmppAuthenticationError
    else:
        raise XmppConnectionError
    
    return retval
