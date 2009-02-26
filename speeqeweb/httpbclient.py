#
# Copyright (c) 2005 - 2008 Nathan Zorn, OGG, LLC 
# See LICENSE.txt for details
#
import sys, os
import httplib, urllib
import random, binascii, sha
from punjab.httpb import HttpbParse
from twisted.words.xish import domish
from twisted.words.protocols.jabber import jid

TLS_XMLNS = 'urn:ietf:params:xml:ns:xmpp-tls'
SASL_XMLNS = 'urn:ietf:params:xml:ns:xmpp-sasl'
BIND_XMLNS = 'urn:ietf:params:xml:ns:xmpp-bind'
SESSION_XMLNS = 'urn:ietf:params:xml:ns:xmpp-session'


class PunjabClient:

    def __init__(self, jabberid, secret, host=None, port=None, url=None):
        self.jid = None
        self.resource = None
        self.rid = random.randint(0,10000000)
        self.myJid  = jid.JID(jabberid)
        if host:
            self.host = host
        else:
            self.host = self.myJid.host
        self.jabberid = jabberid
        if port:
            self.port = str(port)
        else:
            self.port = "5280"
        if url:
            self.url = str(url)
        else:
            self.url = "/xmpp-httpbind"
            
        self.secret = secret
        self.authid = None
        self.sid = None
        self.logged_in = False
        self.headers = {"Content-type": "text/xml",
                        "Accept": "text/xml"}
        
    def buildBody(self, ext=None):
        """
        Build a BOSH body!
        """
        
        b = domish.Element(("http://jabber.org/protocol/httpbind","body"))
        b['content']  = 'text/xml; charset=utf-8'
        self.rid = self.rid + 1
        b['rid']      = str(self.rid)
        b['sid']      = str(self.sid)
        b['xml:lang'] = 'en'

        if ext is not None:
            b.addChild(ext)

        return b
        
    def sendBody(self, b):
        """
        Send the body
        """
        parser = HttpbParse(use_t=True)
        data = ''
        # start new session
        bxml = b.toXml()

        conn = httplib.HTTPConnection(self.host+":"+self.port)
        conn.request("POST", self.url, bxml, self.headers)
        response = conn.getresponse()
        if response.status == 200:
            data = response.read()
        conn.close()

        return parser.parse(data)

    def startSessionAndAuth(self, hold = '1', wait = '70', headers = None):
        if headers:
            self.headers = headers
        # Create a session
        # create body
        b = domish.Element(("http://jabber.org/protocol/httpbind","body"))

        b['content']  = 'text/xml; charset=utf-8'
        b['hold']     = hold
        b['rid']      = str(self.rid)
        b['to']       = self.myJid.host
        b['wait']     = wait
        b['window']   = '5'
        b['xml:lang'] = 'en'

        b['xmlns:xmpp'] = 'jabber:client'
        b['xmpp:version'] = '1.0'
        
        retb, elems = self.sendBody(b)
        if type(retb) != str and retb.hasAttribute('authid') and retb.hasAttribute('sid'):
            mechanism = 'PLAIN'            
            if len(elems[0].children) == 1:
                if elems[0].children[0].name == 'auth':
                    mechanism = 'AUTH' #old school
                
            self.authid = retb['authid']
            self.sid = retb['sid']
            # go ahead an auth
            # send auth
            a = domish.Element((SASL_XMLNS,'auth'))
            a['mechanism'] = mechanism
            
            #    # TODO add authzid
            if a['mechanism'] == 'PLAIN':
                auth_str = ""
                auth_str = auth_str + "\000"
                auth_str = auth_str + self.myJid.user.encode('utf-8')
                auth_str = auth_str + "\000"
                try:
                    auth_str = auth_str + self.secret.encode('utf-8').strip()
                except UnicodeDecodeError:
                    auth_str = auth_str + self.secret.decode('latin1').encode('utf-8').strip()
                        
                a.addContent(binascii.b2a_base64(auth_str))
                
                retb, elems = self.sendBody(self.buildBody(a))
                
                if len(elems)==0:
                    retb, elems = self.sendBody(self.buildBody()) # poll for data
                if len(elems)>0:
                    
                    if elems[0].name == 'success':
                        body = self.buildBody()
                        body['xmpp:restart'] = 'true'

                        retb, elems = self.sendBody(body)
                        if len(elems) == 0:
                            retb, elems = self.sendBody(self.buildBody())

                        if len(elems) > 0 and elems[0].firstChildElement().name == 'bind':
                            
                            iq = domish.Element(('jabber:client','iq'))
                            
                            iq['type']  = 'set'
                            iq.addUniqueId()
                            iq.addElement('bind')
                            iq.bind['xmlns'] = BIND_XMLNS
                            
                            iq.bind.addElement('resource')
                            iq.bind.resource.addContent(self.myJid.resource)
                            retb, elems = self.sendBody(self.buildBody(iq))
                            if type(retb) != str and retb.name == 'body':
                                #gather the returned jid and resource

                                try:
                                    fulljid = elems[0].firstChildElement().firstChildElement()
                                    self.jid,self.resource = str(fulljid).split("/")
                                except:
                                    pass

                                # send session
                                iq = domish.Element(('jabber:client','iq'))
                            
                                iq['type']  = 'set'
                                iq.addUniqueId()
                                iq.addElement('session')
                                iq.session['xmlns'] = SESSION_XMLNS
                            
                                iq.session.addElement('resource')
                                iq.session.resource.addContent(self.myJid.resource)
                                retb, elems = self.sendBody(self.buildBody(iq))
                                if type(retb) != str and retb.name == 'body': # did not bind, TODO - add a retry?
                                    self.logged_in = True
                                    self.rid += 1 # bump up the rid, punjab already received self.rid

            elif a['mechanism'] == 'AUTH':
                #send get ip for auth
                iq = domish.Element((None,'iq'))
                
                iq['type']  = 'get'
                iq.addUniqueId()
                iq.addElement('query')
                iq.query['xmlns'] = 'jabber:iq:auth'
                
                iq.query.addElement('username')
                iq.query.username.addContent(self.myJid.user)
                retb, elems = self.sendBody(self.buildBody(iq))
                if type(retb) != str and retb.name == 'body':

                    iq = domish.Element((None,'iq'))
                    iq['type'] = 'set'
                    iq.addUniqueId()

                    iq.addElement('query')
                    iq.query['xmlns'] = 'jabber:iq:auth'

                    iq.query.addElement('username')
                    iq.query.username.addContent(self.myJid.user)

                    iq.query.addElement('digest')
                    
                    digest = sha.new(str(self.authid)+self.secret).hexdigest()
                    iq.query.digest.addContent(digest)

                    iq.query.addElement('resource')
                    iq.query.resource.addContent(self.myJid.resource)
                    retb, elems = self.sendBody(self.buildBody(iq))
                    if type(retb) != str and retb.name == 'body':
                        
                        if elems[0].name == 'iq':
                            #all good
                            if len(elems[0].children) == 0: 
                                self.logged_in = True
                                self.rid += 1 # bump up the rid, punjab already received self.rid
                                self.jid = self.myJid.user + "@" + self.myJid.host
                                self.resource = self.myJid.resource
if __name__ == '__main__':
    USERNAME = sys.argv[1]
    PASSWORD = sys.argv[2]
    HOST = None
    try:
        HOST     = sys.argv[3]
    except IndexError:
        pass
    PORT = None
    try:
        PORT     = sys.argv[4]
    except IndexError:
        pass
    URL = None
    try:
        URL      = sys.argv[5]
    except IndexError:
        pass
    
    c = PunjabClient(USERNAME, PASSWORD, HOST, PORT, URL)

    c.startSessionAndAuth()
    print c.logged_in
    print c.jid
    print c.resource
