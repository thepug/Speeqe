/**
 * jqCouchDB - jQuery plugin for couchdb connections
 * @requires jQuery > v1.0.3
 * @requires couchDB >= v0.7.0a5575
 *
 * http://protoblogr.net
 *
 * Copyright (c) 2007 Jerry Jalava (protoblogr.net)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * Version: 2.0.2
 *
 * Example usages:
 *

# Database

var dbc = $.jqCouch.connection('db');
dbc.exists('database_name');
---
if ($.jqCouch.connection('db').create('database_name').ok) {
    alert("database created");
}

# Doc

var dc = $.jqCouch.connection('doc');
var rev = dc.get('database/document1')._rev;
---
var doc = {_id:"0",a:1,b:1};
if ($.jqCouch.connection('doc').save('database_name', doc)._id !== false) {
    alert("Created document with rev: "+doc._rev+", a="+doc.a);
}
---
//Get all documents from database. (With cache)
var dc = $.jqCouch.connection('doc');
dc.update_config('cache', true);
if (var total_documents = dc.all('database_name').total_rows) {
    var all_documents = dc.all('database_name').rows;    
}
//Get all documents from database. (Without cache)
var dc = $.jqCouch.connection('doc');
var all = dc.all('database_name');
if (all.total_rows > 0) {
    var all_documents = all.rows;    
}

# View

var vc = $.jqCouch.connection('view');
if (vc.exists('database_name', 'event') !== false) {
    alert("View "event" exists");
}
---
if ($.jqCouch.connection('view').exists('database_name', 'event/all') !== false) {
    alert("View "event/all" exists");
}

More examples can be found from the testsuite
 
 */

 /**
  * @private
  * Generates new connection instance
  * @param {String} type Connection type to initiate
  * @param {Mixed}(String/Function) map_fun Global result mapping function (Optional)
  * @param {Object} config Global configuration for connection (Optional)
  * @returns Connection handler
  * @type Function
  */
function jqCouch_connection(type, map_fun, config) {
    var default_config = {
	cache: false
    };
    
    this.id = jQuery.jqCouch._generate_id();
    this.type = type;
    this.map_fun = map_fun || null;
    this.inited = false;
    this.config = jQuery.extend({}, default_config, config);
    
    var handler = false;
    
    this.destroy = function() {
        this.id = null;
    };

    if (typeof eval('jqCouch_'+this.type) == 'function') {
        eval('var fn = eval(jqCouch_'+this.type+'); handler = fn.apply(fn, [this.map_fun, config, this]);');
    }
    
    handler.last_error = typeof handler.last_error == 'undefined' ? {} : handler.last_error;
    handler.update_config = function(key, value) {
        this.config[key] = value;
        return true;
    };
    handler.last_results = typeof handler.last_results == 'undefined' ? {} : handler.last_results;
    handler.purge_cache = function() {
        handler.last_results = {};
        return true;
    };
    
    return handler;
}

/**
 * @private
 * Handles DB actions
 * @param {Mixed}(String/Function) map_fun Global result mapping function (Optional)
 * @param {Object} config Global configuration for connection (Optional)
 * @param {Function} conn Connection constructor instance
 * @see jqCouch_connection
 * @returns Connection handler
 * @type Function
 */
function jqCouch_db(map_fun, config, conn) {
    var default_config = {
        path: ''
    };    
    this.config = jQuery.extend({}, default_config, config);
    conn.inited = true;
    this.instance = conn;
    var _self = this;
    
    this.exists = function(path, mf) {
        if (typeof path == 'undefined') {
            var path = this.config.path;
        }

        if (this.info(path, mf).db_name) {
            return true;
        }
        
        return false;
    };
    
    this.info = function(path, mf) {
        if (typeof path == 'undefined') {
            var path = this.config.path;
        }
        if (path.substr(path.length-1,1) != '/') {
            path += '/';
        }
                
        var map_fn = mf || map_fun;
        
        var results = false;

        var lr_key = encodeURIComponent(path).toString();
        if (   typeof this.last_results[lr_key] != 'undefined'
            && this.config.cache)
        {
            return this.last_results[lr_key];
        }

        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "GET",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            error: function(req) {
                results = jQuery.extend({
                    db_name: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });

        if (this.config.cache) {
            this.last_results[lr_key] = results;
        }

        return results;
    };
    
    this.create = function(path, mf) {
        if (typeof path == 'undefined') {
            var path = this.config.path;
        }
        if (path.substr(path.length-1,1) != '/') {
            path += '/';
        }
        
        var map_fn = mf || map_fun;
        
        var results = {
            ok: false
        };

        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "PUT",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
	    data:"xx",		     
            contentType: 'application/json',
            error: function(req) {
                results = jQuery.extend({
                    ok: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });
        
        return results;
    };
    
    this.del = function(path, mf) {
        if (typeof path == 'undefined') {
            var path = this.config.path;
        }
        if (path.substr(path.length-1,1) != '/') {
            path += '/';
        }
                
        var map_fn = mf || map_fun;
        
        var results = {
            ok: false
        };

        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "DELETE",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
	    data:"xxx",
            error: function(req) {
                results = jQuery.extend({
                    ok: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });
        
        return results;
    };
    
    this.all = function(mf) {  
        var results = {
            length: 0
        };
        
        var map_fn = mf || map_fun;

        var lr_key = encodeURIComponent(_self.config.server_url + '_all_dbs').toString();
        if (   typeof this.last_results[lr_key] != 'undefined'
            && this.config.cache)
        {
            return this.last_results[lr_key];
        }

        jQuery.ajax({
            url: _self.config.server_url + '_all_dbs',
            type: "GET",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            error: function(req) {
                results = jqCouch_map_error(req);
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });

        if (this.config.cache) {
            this.last_results[lr_key] = results;
        }

        return results;
    };
    
    this.restart = function(mf) {
        var result = {
            ok: false
        };
        
        var map_fn = mf || map_fun;
        
        jQuery.ajax({
            url: _self.config.server_url + '_restart',
            type: "POST",
            global: _self.config.ajax_setup.global,
            async: false,
            error: function(req) {
                results = jQuery.extend({
                    ok: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });

        return results;
    };
    
    return this;
}

/**
 * @private
 * Handles Doc actions
 * @param {Mixed}(String/Function) map_fun Global result mapping function (Optional)
 * @param {Object} config Global configuration for connection (Optional)
 * @param {Function} conn Connection constructor instance
 * @see jqCouch_connection
 * @returns Connection handler
 * @type Function
 */
function jqCouch_doc(map_fun, config, conn) {
    var default_config = {
        path: ''
    };    
    this.config = jQuery.extend({}, default_config, config);
    conn.inited = true;
    this.instance = conn;
    var _self = this;
    
    this.get = function(path, args, mf) {
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }
        
        var map_fn = mf || map_fun;
        
        var results = {
            _id: false
        };
        
        path += jQuery.jqCouch._generate_query_str(args);

        var lr_key = encodeURIComponent(path).toString();
        if (   typeof this.last_results[lr_key] != 'undefined'
            && this.config.cache)
        {
            return this.last_results[lr_key];
        }

        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "GET",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            error: function(req) {
                results = jQuery.extend({
                    _id: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });

        if (this.config.cache) {
            this.last_results[lr_key] = results;
        }

        return results;
    };
    
    this.all = function(path, args, mf) {
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }
        if (path.substr(path.length-1,1) != '/') {
            path += '/';
        }
        path += '_all_docs';
        path += jQuery.jqCouch._generate_query_str(args);
                
        var map_fn = mf || map_fun;
        
        var results = {
            total_rows: 0
        };

        var lr_key = encodeURIComponent(path).toString();
        if (   typeof this.last_results[lr_key] != 'undefined'
            && this.config.cache)
        {
            return this.last_results[lr_key];
        }
        
        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "GET",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            error: function(req) {
                results = jQuery.extend({
                    total_rows: 0
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });
        
        if (this.config.cache) {
            this.last_results[lr_key] = results;
        }
        
        return results;
    };
    
    this.bulk_save = function(path, data, args, mf) {
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }        
        if (path.substr(path.length-1,1) != '/') {
            path += '/';
        }
        path += '_bulk_docs';
        path += jQuery.jqCouch._generate_query_str(args);

        var map_fn = mf || map_fun;
        
        var results = {
            ok: false,
            results: null
        };
        
        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "POST",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            data: jQuery.jqCouch.toJSON(data),
            processData: false,
            error: function(req) {
                results = jQuery.extend({
                    ok: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });
        
        return results;
    };
    
    this.save = function(path, data, mf) {
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }
        if (path.substr(path.length-1,1) != '/') {
            path += '/';
        }
        
        var map_fn = mf || map_fun;
        var results = false;
        
        if (   typeof data._id == 'undefined'
            || data._id == '')
        {
            results = this.post(path, data, mf);
        } else {
            results = this.put(path + data._id, data, map_fn);
        }

        if (   results
            && results.rev)
        {
            data._id = results.id;
            data._rev = results.rev;
        }
        
        return results;
    };
    
    this.post = function(path, data, mf) {
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }
        
        var map_fn = mf || map_fun;
        
        var results = {
            _id: false
        };
        
        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "POST",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            data: jQuery.jqCouch.toJSON(data),
            processData: false,
            error: function(req) {
                results = jQuery.extend({
                    _id: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });
        
        return results;
    };
    
    this.put = function(path, data, mf) {
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }
        
        var map_fn = mf || map_fun;
        
        var results = {
            _id: false
        };

        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "PUT",
            data: jQuery.jqCouch.toJSON(data),
            processData: false,
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            error: function(req) {
                results = jQuery.extend({
                    _id: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });
        
        return results;
    };
    
    this.del = function(path, doc_or_rev, mf) {
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }
        if (   typeof doc_or_rev == 'object'
            && typeof doc_or_rev._id != 'undefined'
            && typeof doc_or_rev._rev != 'undefined')
        {
            if (path.substr(path.length-1,1) != '/') {
                path += '/';
            }
            path += doc_or_rev._id;
            path += '?rev=' + doc_or_rev._rev;
        }
        if (typeof doc_or_rev == 'string') {
            path += '?rev=' + doc_or_rev;
        }
        
        var map_fn = mf || map_fun;
        
        var results = {
            ok: false
        };
        
        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "DELETE",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            error: function(req) {
                results = jQuery.extend({
                    ok: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });
        
        if (   typeof doc_or_rev == 'object'
            && results.ok)
        {
            doc_or_rev._rev = results.rev;
            doc_or_rev._deleted = true;
        }
        
        return results;
    };
    
    return this;
}

/**
 * @private
 * Handles View actions
 * @param {Mixed}(String/Function) map_fun Global result mapping function (Optional)
 * @param {Object} config Global configuration for connection (Optional)
 * @param {Function} conn Connection constructor instance
 * @see jqCouch_connection
 * @returns Connection handler
 * @type Function
 */
function jqCouch_view(map_fun, config, conn) {
    var default_config = {
        path: '',
        language: "text/javascript"
    };
    this.config = jQuery.extend({}, default_config, config);
    conn.inited = true;
    this.instance = conn;
    var _self = this;
    
    //TODO: add chance to create if doesnt exist
    this.exists = function(path, view, mf) {
        if (typeof path == 'undefined') {
            var path = this.config.path;
        }
        
        if (typeof view == 'undefined') {
            return false;
        }
        
        if (this.info(path, view, mf).views) {
            return true;
        }
        
        return false;
    };
    
    this.info = function(path, view, mf) {
        var results = {
            _id: false,
            views: false
        };
        if (typeof view == 'undefined') {
            return results;
        }
        
        if (typeof path == 'undefined') {
            var path = this.config.path;
        }
        if (path.substr(path.length-1,1) != '/') {
            path += '/';
        }
        path += '_design/';
        
        var view_parts = false;
        if (view.toString().match(/\//)) {
            view_parts = view.split("/");
            path += view_parts[0];
        } else {
            path += view;
        }
        
        path += '?revs_info=true';
        
        var map_fn = mf || map_fun;

        var lr_key = encodeURIComponent(path).toString();
        if (   typeof this.last_results[lr_key] != 'undefined'
            && this.config.cache)
        {
            return this.last_results[lr_key];
        }

        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "GET",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            error: function(req) {
                results = jQuery.extend({
                    _id: false,
                    views: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                if (   view_parts
                    && typeof data.views[view_parts[1]] == 'undefined')
                {                    
                    return false;
                }
                results = jqCouch_map_results(data, map_fn);
                if (typeof results['views'] == 'undefined') {
                    results['views'] = false;
                }
                return true;
            }
        });

        if (this.config.cache) {
            this.last_results[lr_key] = results;
        }

        return results;
    };
    
    this.get = function(path, name, args, mf) {
        var results = {
            total_rows: false
        };
        
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }
        if (path.substr(path.length-1,1) != '/') {
            path += '/';
        }
        if (! path.toString().match(/_view\//)) {
            path += '_view/';
        }

        if (typeof name == 'undefined') {
            return results;
        }

        if (! name.toString().match(/\//)) {
            return results;
        }
        path += name;
        
        var map_fn = mf || map_fun;
        
        path += jQuery.jqCouch._generate_query_str(args);
        
        var lr_key = encodeURIComponent(path).toString();
        if (   typeof this.last_results[lr_key] != 'undefined'
            && this.config.cache)
        {
            return this.last_results[lr_key];
        }
        
        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "GET",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            error: function(req) {
                results = jQuery.extend({
                    total_rows: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });
        
        if (this.config.cache) {
            this.last_results[lr_key] = results;
        }
        
        return results;
    };
    
    this.save = function(path, data, mf) {
        var results = {
            ok: false
        };
        if (typeof data != 'object') {
            return results;
        }
        
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }
        if (path.substr(path.length-1,1) != '/') {
            path += '/';
        }
        
        if (typeof data._id == 'undefined') {
            return results;
        }
        
        if (! data._id.toString().match(/_design/)) {
            data._id = '_design/' + data._id;
        }
        
        if (typeof data['language'] == 'undefined') {
            data.language = this.config.language;
        }
        
        for (var name in data.views) {
            if (typeof(data.views[name]['toSource']) == 'function') {
                data.views[name] = data.views[name].toSource();
            } else {
                data.views[name] = data.views[name].toString();
            }
        }
        
        results = this.put(path + data._id, data, mf);

        if (   results
            && results.rev)
        {
            data._id = results.id;
            data._rev = results.rev;
        }
        
        return results;
    };
    
    this.put = function(path, data, mf) {
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }
        
        var map_fn = mf || map_fun;
        
        var results = {
            _id: false
        };

        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "PUT",
            data: jQuery.jqCouch.toJSON(data),
            processData: false,
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            error: function(req) {
                results = jQuery.extend({
                    _id: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });
        
        return results;
    };

    this.del = function(path, doc_or_rev, mf) {
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }
        if (   typeof doc_or_rev == 'object'
            && typeof doc_or_rev._id != 'undefined'
            && typeof doc_or_rev._rev != 'undefined')
        {
            if (path.substr(path.length-1,1) != '/') {
                path += '/';
            }
            path += doc_or_rev._id;
            path += '?rev=' + doc_or_rev._rev;
        }
        if (typeof doc_or_rev == 'string') {
            path += '?rev=' + doc_or_rev;
        }
        
        var map_fn = mf || map_fun;
        
        var results = {
            ok: false
        };
        
        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "DELETE",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            contentType: 'application/json',
            error: function(req) {
                results = jQuery.extend({
                    ok: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });
        
        if (   typeof doc_or_rev == 'object'
            && results.ok)
        {
            doc_or_rev._rev = results.rev;
            doc_or_rev._deleted = true;
        }
        
        return results;
    };
    
    this.temp = function(path, map, args, mf) {
        if (   typeof path == 'undefined'
            || path == '')
        {
            var path = this.config.path;
        }
        if (path.substr(path.length-1,1) != '/') {
            path += '/';
        }
        path += '_temp_view';            
        path += jQuery.jqCouch._generate_query_str(args);

        var lr_key = encodeURIComponent(path).toString();
        if (   typeof this.last_results[lr_key] != 'undefined'
            && this.config.cache)
        {
            return this.last_results[lr_key];
        }
        
        var map_fn = mf || map_fun;
        
        if (typeof map == 'string') {
            //map = eval(map);
        }
        
        if (typeof map['toSource'] == 'function') {
            //map = map.toSource();	    
        } else {
            //map = map.toString();
        }

        var results = {
            total_rows: false
        };

        jQuery.ajax({
            url: _self.config.server_url + path,
            type: "POST",
            global: _self.config.ajax_setup.global,
            cache: _self.config.ajax_setup.cache,
            async: false,
            dataType: "json",
            data: jQuery.toJSON(map),
            contentType: 'application/json',
            processData: false,
            error: function(req) {
                results = jQuery.extend({
                    total_rows: false
                }, jqCouch_map_error(req));
                _self.last_error = results;
                return false;
            },
            success: function(data) {
                results = jqCouch_map_results(data, map_fn);
                return true;
            }
        });

        if (this.config.cache) {
            this.last_results[lr_key] = results;
        }

        return results;
    };

    return this;
}

/**
 * @private
 * Default result wrapper
 * @param {Object} data Results from query
 * @param {Mixed}(String/Function) map result mapping function (Optional)
 * @see jqCouch_db, jqCouch_doc, jqCouch_view
 * @returns Finished results
 * @type Object
 */
function jqCouch_map_results(data, map) {
    if (typeof map == 'undefined') {
        return data;
    }
    
    if (typeof map == 'function') {
        var res = map.apply(map, [data]);
        return jQuery.extend({}, res || {});
    }
    
    if (typeof map == 'string') {        
        var fn = eval('('+map+')');
        var res = fn.apply(fn, [data]);
        return jQuery.extend({}, res || {});
    }
    
    return (data || {}); 
}

/**
 * @private
 * Default error wrapper
 * @param {Object} req XHR Request object
 * @see jqCouch_db, jqCouch_doc, jqCouch_view
 * @returns Rendered error
 * @type Object
 */
function jqCouch_map_error(req) {
    var results = {
        status: req.status,
        response: eval("(" + req.responseText + ")")
    };
    return results;
}

(function($){
    
    $.jqCouch = {
        _connection_types: [
            'db', 'doc', 'view'
        ],
        _default_config: {
            server_url: '/',
            database: null,
            cache: false,
            ajax_setup: {
                global: false,
                cache: true
            }
        },
        _connections: {},
        
        _generate_id: function() {
            var rk = Math.floor(Math.random()*4013);
            return (10016486 + (rk * 22423));
        },
        
        _generate_query_str: function(qa) {
            var qs = '';
            if (typeof qa != 'undefined') {
                qs += '?';
                $.each(qa, function(k,v){
                    if (typeof v != 'string') {
                        qs += k + '=' + $.jqCouch.toJSON(v) + '&';                        
                    } else {
                        qs += k + '=' + v + '&';                        
                    }
                });
                qs = qs.substr(0, qs.length-1);
            }

            return qs;
        },
        
        parseJSON: function(json_str) {
        	try {
                return !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
                        json_str.replace(/"(\\.|[^"\\])*"/g, ''))) &&
                    eval('(' + json_str + ')');
            } catch(e) {
                return false;
            }
        },
        toJSON: function (item, item_type) {
            var m = {
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"' : '\\"',
                '\\': '\\\\'
            },
            s = {
                arr: function (x) {
                    var a = ['['], b, f, i, l = x.length, v;
                    for (i = 0; i < l; i += 1) {
                        v = x[i];
                        v = conv(v);
                        if (typeof v == 'string') {
                            if (b) {
                                a[a.length] = ',';
                            }
                            a[a.length] = v;
                            b = true;
                        }
                    }
                    a[a.length] = ']';
                    return a.join('');
                },
                bool: function (x) {
                    return String(x);
                },
                nul: function (x) {
                    return "null";
                },
                num: function (x) {
                    return isFinite(x) ? String(x) : 'null';
                },
                obj: function (x) {
                    if (x) {
                        if (x instanceof Array) {
                            return s.arr(x);
                        }
                        var a = ['{'], b, f, i, v;
                        for (i in x) {
                            v = x[i];
                            v = conv(v);
                            if (typeof v == 'string') {
                                if (b) {
                                    a[a.length] = ',';
                                }
                                a.push(s.str(i), ':', v);
                                b = true;
                            }
                        }
                        a[a.length] = '}';
                        return a.join('');
                    }
                    return 'null';
                },
                str: function (x) {
                    if (/["\\\x00-\x1f]/.test(x)) {
                        x = x.replace(/([\x00-\x1f\\"])/g, function(a, b) {
                            var c = m[b];
                            if (c) {
                                return c;
                            }
                            c = b.charCodeAt();
                            return '\\u00' +
                            Math.floor(c / 16).toString(16) +
                            (c % 16).toString(16);
                        });
                    }
                    return '"' + x + '"';
                }
            };
            var conv = function (x) {
                var itemtype = typeof x;
                switch(itemtype) {
                    case "array":
                        return s.arr(x);
                    break;
                    case "object":
                        return s.obj(x);
                    break;
                    case "string":
                        return s.str(x);
                    break;
                    case "number":
                        return s.num(x);
                    break;
                    case "null":
                        return s.nul(x);
                    break;
                    case "boolean":
                        return s.bool(x);
                    break;
                };
            };

            var itemtype = item_type || typeof item;
            switch(itemtype) {
                case "array":
                    return s.arr(item);
                break;
                case "object":
                    return s.obj(item);
                break;
                case "string":
                    return s.str(item);
                break;
                case "number":
                    return s.num(item);
                break;
                case "null":
                    return s.nul(item);
                break;
                case "boolean":
                    return s.bool(item);
                break;				
                default:
                    throw("Unknown type for $.jqcouch.toJSON");
                break;
            };
        },

        /**
         * Defines globally used default settings for jqCouch
         * @param {Object} defaults Config dictionary
         * @see $.jqCouch._default_config
         */        
        set_defaults: function(defaults) {
            $.jqCouch._default_config = $.extend({}, $.jqCouch._default_config, defaults || {});
        },
        
        /**
         * @public
         * Initiates new connection and returns it.
         * Possible parameter combinations:
         * type OR type, map_fun OR type, config OR type, map_fun, config
         * @param {String} type Type of connection to initiate
         * @param {Mixed}(String/Function) map_fun Global result mapping function
         * @param {Object} config Global configuration for connection
         * @see jqCouch_connection
         * @returns Connection handler
         * @type Function
         */
        connection: function() {
            if (arguments.length <= 0) {
                return false;
            }
            
            if (typeof $.jqCouch._connections != 'object') {
                $.jqCouch._connections = {};
            }

            var type = 'doc';
            var map_fun = null;
            var user_config = {};

            if ($.inArray(arguments[0], $.jqCouch._connection_types) != -1) {
                type = arguments[0];
            } else {
                return false;
            }

            if (arguments.length > 1) {
                if (typeof arguments[1] == 'object') {
                    user_config = arguments[1];
                } else {
                    map_fun = arguments[1];
                }
            }
            
            if (   arguments.length == 3
                && typeof arguments[2] == 'object')
            {
                user_config = arguments[2];
            }
            
            var config = $.extend({}, $.jqCouch._default_config, user_config);
            
            var connection = new jqCouch_connection(type, map_fun, config);
            if (! connection.instance.inited) {
                return false;
            }
            
            $.jqCouch._connections[connection.id] = connection;
            
            return connection;
        },
        
        destroy_connection: function(id) {
            if (   typeof $.jqCouch._connections[id] != 'undefined'
                || $.jqCouch._connections[id] != 'null')
            {
                $.jqCouch._connections[id].destroy();
                $.jqCouch._connections[id] = null;
            }
            $.jqCouch._connections = $.grep($.jqCouch._connections, function(n,i){
                if (n != null) {
                    return true;
                }
            });
        }
    };
    
})(jQuery);
