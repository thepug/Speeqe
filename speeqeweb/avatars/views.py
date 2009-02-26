#
# Copyright (c) 2005 - 2008 Nathan Zorn, OGG, LLC 
# See LICENSE.txt for details
#
from speeqeweb.avatars.models import Avatar

from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse, HttpRequest
from django.shortcuts import render_to_response
from PIL import Image
import base64
import re
import sha
import StringIO


DEFAULT_AVATAR = settings.DOCUMENT_ROOT + '/images/defaultavatar.png'

def handler404(*args, **kwargs):
    from django.views.defaults import page_not_found
    return page_not_found(*args, **kwargs)


def handler500(*args, **kwargs):
    from django.views.defaults import server_error
    return server_error(*args, **kwargs)


def clean_mime(mime):
    if not mime:
        return ''
    return mime.replace('image/', '').replace('x-', '').replace('p-', '').replace('pjpeg', 'jpeg').lower()


def resize_image(im, new_height, new_width):
    (im_width, im_height) = im.size
    resized = False
    if im_width > new_width or im_height > new_height:
        if im_width > im_height:
            new_height = new_height * im_height / im_width
        else:
            new_width  = new_width  * im_width  / im_height
        try:
            im = im.resize((new_width, new_height), Image.ANTIALIAS)
            resized = True
        except IOError:
            pass
    else:
        resized = True
    return im, resized


def read_avatar(request):

    image_data = request.FILES['avatar'].read()

    # load() to spot truncated JPEGs
    im = Image.open(StringIO.StringIO(image_data))
    im.load()
    # verify() to spot corrupt PNGs
    im = Image.open(StringIO.StringIO(image_data))
    im.verify()

    im = Image.open(StringIO.StringIO(image_data))
    (im_width, im_height) = im.size

    new_height = 300
    new_width = 300
    # im_dimensions = "30|30"
    if im_width > new_width or im_height > new_width:
        if im_width > im_height:
            new_height = new_height * im_height / im_width
        else:
            new_width  = new_width  * im_width  / im_height
        im = im.resize((new_width, new_height), Image.ANTIALIAS)

    im_dimensions = "%d|%d" % im.size
    im_out = StringIO.StringIO()
    if im.mode == 'CMYK':
        im.convert('RGB')

    im.save(im_out, "PNG")
    image_data = im_out.getvalue()
    return im_dimensions, image_data


def create_or_get_avatar(image_data, im_dimensions):
    """
    create or get an avatar
    """
    mime = 'image/png'
    b64 = base64.encodestring(image_data).replace('\n', '')
    sha1 = sha.sha(image_data).hexdigest()
    cached = cache.get('%s_mime' % sha1)

    if not cached:
        cache.set('%s_b64_large' % sha1, b64, settings.AVATAR_CACHE_TIMEOUT)
        cache.set('%s_mime' % sha1, mime, settings.AVATAR_CACHE_TIMEOUT)
        cache.set('%s_size' % sha1, im_dimensions, settings.AVATAR_CACHE_TIMEOUT)
        av, created = Avatar.objects.get_or_create(sha1=sha1, defaults={
                'base64': b64,
                'sha1': sha1,
                'mime': mime,
                'size': im_dimensions
                })

    return mime, b64, sha1


def upload(request):
    try:
        uploading = request.method == 'POST' and 'avatar' in request.FILES and request.FILES['avatar'].file_size
    except IOError:
        return render_to_response('avatars/upload_form.html',
                                  {'error': 'There was an error processing your upload.'})
    if uploading:
        mime = clean_mime(request.FILES['avatar'].content_type)
        if mime.find('/') > -1 or mime.lower() not in ['jpg', 'jpeg', 'gif', 'png', 'bmp', 'tif', 'tiff']:
            return render_to_response('avatars/upload_form.html',
                                      {'error': 'File must be a valid image.'})
        else:
            try:
                im_dimensions, image_data = read_avatar(request)
            except IOError:
                return render_to_response('avatars/upload_form.html',
                                          {'error': 'Error loading image.'})
            except Exception, ex:
                request.logger.error("IMAGE:"+str(ex))
                return render_to_response('avatars/upload_form.html',
                                          {'error': 'Error loading image - it may be corrupt.'})

            mime, b64, sha1 = create_or_get_avatar(image_data, im_dimensions)

            return render_to_response('avatars/upload_finished.html',
                                      {'mimetype': mime,
                                       'base64': b64,
                                       'sha1': sha1})
    else:
        return render_to_response('avatars/upload_form.html')


def lookup(request):
    default_sha1 = settings.AVATAR_DEFAULT_SHA1
    default_ie6  = settings.AVATAR_DEFAULT_IE6

    default = default_sha1 + '|'+settings.AVATAR_DEFAULT_DIMENSIONS
    ie6 = request.GET.get('ie6', 'no')
    mime = 'image/png'
    if request.method == 'POST':
        b64 = ''
        try:
            b64 = request.POST.get('base64', '')
        except IOError:
            pass
        mime = request.POST.get('mime', '')
        output = default
        if b64 != '' and clean_mime(mime) in ['bmp', 'gif', 'jpg', 'jpeg', 'png']:
            try:
                sha1 = sha.sha(base64.decodestring(b64)).hexdigest()
                output = sha1
                im_dimensions = cache.get('%s_size' % sha1)

                if not im_dimensions:
                    cache.set('%s_b64_large'  % sha1, b64, settings.AVATAR_CACHE_TIMEOUT)
                    cache.set('%s_mime' % sha1, mime, settings.AVATAR_CACHE_TIMEOUT)
                    try:
                        av = Avatar.objects.get(sha1=sha1)
                        cache.set('%s_size' % sha1, av.size, settings.AVATAR_CACHE_TIMEOUT)
                        output = '%s|%s' % (output, av.size)
                    except:
                        image_data = base64.decodestring(b64)
                        im = Image.open(StringIO.StringIO(image_data))
                        im, resized = resize_image(im, 300, 300)
                        im_dimensions = '%d|%d' % im.size
                        cache.set('%s_size' % sha1, im_dimensions, settings.AVATAR_CACHE_TIMEOUT)
                        av = Avatar(base64=b64, sha1=sha1, mime=mime, size=im_dimensions)
                        output = '%s|%s' % (output, im_dimensions)
                    av.save()
                else:
                    output = '%s|%s' % (output, im_dimensions)
            except:
                pass

        resp = HttpResponse(output)
        resp['Content-Type'] = 'text/plain'
        return resp
    else:

        dimensions = request.GET.get('dimensions', settings.AVATAR_DEFAULT_DIMENSIONS)
        b64 = None
        sha1 = None
        expires = (datetime.utcnow() + timedelta(hours=1)).strftime('%a, %d %b %Y %T GMT')

        sha1 = request.GET.get('sha1', default.split('|')[0])
        
        if sha1 == default and ie6 == 'yes':
            sha1 = default_ie6
        if not re.match('^[0-9a-fA-F]+$', sha1):
            sha1 = default.split('|')[0];

        mime, b64 = get_avatar(sha1, ie6)
        try:
            image_data = base64.decodestring(b64)
        except Exception, ex:
            request.logger.error("Error finding avatar: %s - %s" % (sha1, ex))
            mime, b64 = get_avatar(None, ie6)
            if b64:
                image_data = base64.decodestring(b64)
            else:
                #if there still is an error, return a blank avatar
                image_data = ""

        im = None
        try:
            im = Image.open(StringIO.StringIO(image_data))
        except IOError:
            mime, b64 = get_avatar(None,default)
            image_data = base64.decodestring(b64)
            im = Image.open(StringIO.StringIO(image_data))

        (new_width, new_height) = [int(x) for x in dimensions.split('|')]
        im, resized = resize_image(im, new_height, new_width)

        im_out = StringIO.StringIO(image_data)
        if resized:
            im.save(im_out, 'PNG')
        else:
            mime, b64 = get_avatar(None,default)
            image_data = base64.decodestring(b64)
            im = Image.open(StringIO.StringIO(image_data))
            im, resized = resize_image(im, new_height, new_width)

            im_out = StringIO.StringIO(image_data)
            im.save(im_out, 'PNG')

        ret_image_data = im_out.getvalue()

        resp = HttpResponse(ret_image_data)
        resp['Content-Type'] = mime
        resp['Expires'] = expires
        return resp


def get_avatar(sha1, ie6):
    if ie6 == 'yes':
        default = settings.AVATAR_DEFAULT_SHA1+'|'+settings.AVATAR_DEFAULT_DIMENSIONS
    else:
        default = settings.AVATAR_DEFAULT_IE6+'|'+settings.AVATAR_DEFAULT_DIMENSIONS

    if not sha1:
        sha1 = default.split('|')[0]
    mime = cache.get('%s_mime' % sha1)
    b64 = cache.get('%s_b64_large' % sha1)
    if mime and clean_mime(mime) not in ['bmp', 'gif', 'jpg', 'jpeg', 'png']:
        sha1 = default.split('|')[0];
        mime = cache.get('%s_mime' % sha1)
        b64 = cache.get('%s_b64_large' % sha1)

    if not b64 or not mime:
        av = None
        try:
            av = Avatar.objects.get(sha1=sha1)
        except Avatar.DoesNotExist:
            try:
                av = Avatar.objects.get(sha1=default.split('|')[0])
            except Avatar.DoesNotExist:
                #create the default avatar
                request = HttpRequest()
                request.FILES['avatar'] = open(DEFAULT_AVATAR)

                im_dimensions, image_data = read_avatar(request)
                x,y,created_sha = create_or_get_avatar(image_data, im_dimensions)

                request.FILES['avatar'].close()
                #return the default avatar
                av = Avatar.objects.get(sha1=created_sha)

        if av:
            cache.set('%s_b64_large'  % sha1, av.base64, settings.AVATAR_CACHE_TIMEOUT)
            cache.set('%s_mime' % sha1, av.mime, settings.AVATAR_CACHE_TIMEOUT)
            mime = av.mime
            b64 = av.base64
    return mime, b64
