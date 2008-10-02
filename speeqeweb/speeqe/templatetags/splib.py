from django.contrib.sites.models import Site
from django.template import Library, Node
import speeqeweb.xmpp.muc as muc
import speeqeweb.settings as settings

register = Library()

@register.simple_tag
def current_domain():
    try:
        return Site.objects.get_current().domain
    except:
        return 'www.speeqe.com'

class ActiveRoomsNode(Node):

    def __init__(self):
        """do I need this?"""
        pass

    def render(self, context):
        try:
            context['rooms'] = muc.listrooms()[:5]
        except:
            pass
        return ''
    
@register.tag(name="show_rooms")
def show_rooms(parser,token):
    return ActiveRoomsNode()

class Room:
    pass
class FeaturedRoomsNode(Node):

    def __init__(self):
        """do I need this?"""
        pass

    def render(self, context):
        try:
            featured_rooms = []
            for key in settings.FEATURED_ROOMS.keys():
                room = Room()
                room.name = key
                room.url = settings.FEATURED_ROOMS[key]
                featured_rooms.append(room)
            context['featuredrooms'] = featured_rooms
        except:
            pass
        return ''
@register.tag(name="show_featured_rooms")
def show_featured_rooms(parser,token):
    return FeaturedRoomsNode()
