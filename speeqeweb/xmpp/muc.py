
#
# Copyright (c) 2005 - 2008 Nathan Zorn, OGG, LLC 
# See LICENSE.txt for details
#

import xmpp
import speeqeweb.settings


class XMMPAuthError(Exception):
    """Unable to authenticate to configured xmpp server. """
    def __str__(self):
        return "Unable to authenticate to xmpp server."

class XMMPConnectError(Exception):
    """Unable to connect to xmpp server. """
    def __str__(self):
        return "Unable to connect to xmpp server."
    

class RoomQuery:
    def __init__(self):
        self.rooms = []
        self._ns = 'http://jabber.org/protocol/disco#items'
        
    def xmpp_result(self,func,response):    
        """Used to retrieve the list of rooms from the conference service. """
        if response.getType() == 'result':
            for node in response.getQueryPayload():
                self.rooms.append(node.getAttr('name'))

    def queryRooms(self):
        jid=xmpp.protocol.JID(speeqeweb.settings.XMPP_USER+"/listrooms")
        client = xmpp.Client(jid.getDomain(),debug=[])
        if client.connect(use_srv=True):
            if client.auth(jid.getNode(),speeqeweb.settings.XMPP_PASS,sasl=0):
            
                iq = xmpp.protocol.Iq(typ='get',
                                      to=speeqeweb.settings.XMPP_CHAT,)
                query = iq.setTag("query",namespace=self._ns)            
                
                client.SendAndCallForResponse(iq,self.xmpp_result)
                
                client.disconnect()
            else:
                print "Unable to authenticate via xmpp."

        else:
            print "Unable to connect via xmpp."

def listrooms():
    """Return rooms in chat service for configured chat server."""
    room_query = RoomQuery()
    retval = []
    try:
        room_query.queryRooms()
        retval = room_query.rooms        
    except Exception, ex:
        print str(ex)
    return retval
