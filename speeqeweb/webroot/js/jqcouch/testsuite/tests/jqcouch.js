module("jqCouch");

test("config", function() {
    expect(1);
	ok( $.jqCouch, "$.jqCouch" );
});

test("DB Connection", function() {

    var dbc = $.jqCouch.connection('db',{server_url:'/couchdb/'});

    //ok( dbc.restart(), "Restart CouchDB" );
    
    ok( dbc.create('jqcouch_test_db').ok, "Create test DB" );

    ok( dbc.exists('jqcouch_test_db'), "Test DB Exists" );

    ok( dbc.info('jqcouch_test_db').db_name == 'jqcouch_test_db', "Test DB Info" );

    ok( dbc.all().length > 0, "More than 0 Databases exists" );
    
    ok( dbc.del('jqcouch_test_db').ok, "Delete test DB" );
});

test("Doc Connection", function() {
    var dbc = $.jqCouch.connection('db',{server_url:'/couchdb/'});
    ok( dbc.create('jqcouch_test_db').ok, "Create test DB" );
    
    var dc = $.jqCouch.connection('doc',{server_url:'/couchdb/'});

    var doc = {_id:"0",a:1,b:1};
    ok( dc.save('jqcouch_test_db', doc)._id !== false, "Create doc" );
    ok( typeof doc._rev != 'undefined', "New doc _rev is defined" );

    ok( dc.get('jqcouch_test_db/0')._id !== false, "Get doc with id 0" );

    ok( dc.get('jqcouch_test_db/non_existant_doc')._id === false, "Get non existant doc" );
    ok( dc.last_error.response.error == 'not_found', "Last error response.error: not_found");
    ok( dc.last_error.response.reason == 'missing', "Last error response.reason: missing");
    
    var map_fun = function(data) {
        if (typeof data.b != 'undefined') {
            return {bravo: data.b};
        }
        return {bravo: false};
    };
    ok( dc.get('jqcouch_test_db/0', {}, map_fun).bravo !== false, "Query with mapping" );
    
    ok( dc.del('jqcouch_test_db', doc).ok, "Delete doc 0" );
    ok( doc._deleted, "doc._deleted" );
    
    var num_docs_to_create = 700;
    var docs = genDocs(num_docs_to_create);
    ok( dc.bulk_save('jqcouch_test_db', docs).ok, "Bulk create "+num_docs_to_create+" docs" );
    
    ok( dc.all('jqcouch_test_db').total_rows > 0, "Get all docs" );
    
    ok( dbc.del('jqcouch_test_db').ok, "Delete test DB" );
});

test("View Connection", function() {
    var dbc = $.jqCouch.connection('db',{server_url:'/couchdb/'});
    ok( dbc.create('jqcouch_test_db').ok, "Create test DB" );

    var vc = $.jqCouch.connection('view',{server_url:'/couchdb/'});

    var new_view = {
        _id: 'test',
        views: {
            id_rev: function(doc) {map(doc._id, doc._rev);},
            rev_id: function(doc) {map(doc._rev, doc._id);}            
        }
    };
    ok( vc.save('jqcouch_test_db', new_view).ok, "Save view");
    ok( typeof new_view._rev != 'undefined', "New views revision is defined");
    
    ok( vc.exists('jqcouch_test_db', 'test') !== false, "View test exists" );
    ok( vc.exists('jqcouch_test_db', 'test/id_rev') !== false, "View test/id_rev exists" );
    ok( vc.exists('jqcouch_test_db', 'test/doesnt') === false, "View test/doesnt exists" );
    ok( vc.exists('jqcouch_test_db', 'doesnt/exist') === false, "View doesnt/exist exists" );
    
    var num_docs_to_create = 400;
    var docs = genDocs(num_docs_to_create);
    ok( $.jqCouch.connection('doc',{server_url:'/couchdb/'}).bulk_save('jqcouch_test_db', docs).ok, "Bulk create "+num_docs_to_create+" docs" );

    var tmp_map = function(doc) {
        if (doc.integer > 10) {
            map(doc._id, null);
        }
    };
    ok( vc.temp('jqcouch_test_db', tmp_map).total_rows, "Run simple temp view" );

    ok( vc.get('jqcouch_test_db', 'test/id_rev').total_rows, "Get view test/id_rev");

    var tmp_map = function(doc) {
        if (typeof doc.string != 'undefined') {
            map(doc._id, null);
        }
    };
    var map_fun = function(data) {
        var tmp_data = {
            offset: 0,
            rows: [],
            total_rows: 0
        };
        var tmp_rows = [];
        $.each(data.rows, function(i,d){
            if (i%2==0) {
                tmp_rows.push(d);
            }
        });
        
        if (tmp_rows.length > 0) {
            tmp_data.rows = tmp_rows;
            tmp_data.total_rows = tmp_rows.length;
        }
        
        return tmp_data;
    };
    ok( vc.temp('jqcouch_test_db', tmp_map, {}, map_fun).total_rows, "Run simple temp view with mapping function" );
    
    ok( vc.update_config('cache', true), "Enable cache");
    ok( vc.get('jqcouch_test_db', 'test/rev_id').total_rows, "Get view test/rev_id");
    ok( vc.get('jqcouch_test_db', 'test/rev_id').rows, "Get view test/rev_id from cache");
    ok( vc.purge_cache(), "Purge cache");
    ok( vc.get('jqcouch_test_db', 'test/rev_id').rows, "Get view test/rev_id from empty cache");
            
    ok( dbc.del('jqcouch_test_db').ok, "Delete test DB" );
});

function genDocs(n, templateDoc) {
    var templateDocSrc = templateDoc ? templateDoc.toSource() : "{}"
    var docs = []
    for (var i=0; i<n; i++) {
        var newDoc = eval("(" + templateDocSrc + ")");
        newDoc._id = (i).toString();
        newDoc.integer = i;
        newDoc.string = (i).toString();
        docs.push(newDoc);
    }
    return docs;
}
