var overpass_elements = {};
var overpass_elements_member_of = {};
var overpass_tiles = {};
var overpass_requests = [];
var overpass_request_active = false;
var overpass_bbox_query_cache = {};


var OVERPASS_ID_ONLY = 0
var OVERPASS_TAGS = 1
var OVERPASS_META = 2
var OVERPASS_MEMBERS = 4
var OVERPASS_BBOX = 8
var OVERPASS_GEOM = 16
var OVERPASS_CENTER = 32
var OVERPASS_ALL = 63
var OVERPASS_DEFAULT = 13

/**
 * @param {(string|string[])} ids - One or more IDs, e.g. [ 'n123', 'w2345', 'n123' ]
 * @param {object} options
 * @param {number} [options.priority=0] - Priority for loading these objects. The lower the sooner they will be requested.
 * @param {boolean} [options.call_ordered=false] - When set to true, the function feature_callback will be called in the order of the array ids.
 * @param {L.latLngBounds} options.bbox - Only include objects which intersect the given bbox. The feature_callback will be called anyway, but boolean false will be passed.
 * @param {boolean} [options.properties=OVERPASS_BBOX | OVERPASS_TAGS | OVERPASS_MEMBERS] - Which features should be downloaded: OVERPASS_ID_ONLY, OVERPASS_BBOX, OVERPASS_TAGS, OVERPASS_GEOM, OVERPASS_META. Combine by binary OR: OVERPASS_ID | OVERPASS_BBOX.
 * @param {function} feature_callback - Will be called for each object in the order of the IDs in parameter 'ids'. Will be passed: 1. err (if an error occured, otherwise null), 2. the object or null, 3. the index in the array ids.
 * @param {function} final_callback - Will be called after the last feature. Will be passed: 1. err (if an error occured, otherwise null).
 */
function overpass_get(ids, options, feature_callback, final_callback) {
  if(typeof ids == 'string')
    ids = [ ids ];
  if(options === null)
    options = {};
  if(typeof options.properties == 'undefined')
    options.properties = OVERPASS_DEFAULT;

  for(var i = 0; i < ids.length; i++)
    if(ids[i] in overpass_elements && overpass_elements[ids[i]] === false)
      delete(overpass_elements[ids[i]]);

  if(options.bbox) {
    var bbox = convert_to_turf(options.bbox);
  }

  overpass_requests.push({
    type: 'get',
    ids: ids,
    options: options,
    priority: 'priority' in options ? options.priority : 0,
    feature_callback: feature_callback,
    final_callback: final_callback
  });

  overpass_requests = weight_sort(overpass_requests, 'priority');

  _overpass_process();
}

function _overpass_process() {
  if(overpass_request_active)
    return;

  if(!overpass_requests.length)
    return;

  overpass_request_active = true;
  var effort = 0;
  var context = {
    todo: {},
    bbox_todo: {},
    todo_requests: {},
  };
  var  todo_callbacks = [];
  var todo_requests = {};
  var query = '';

  if(overpass_requests[0].type == 'bbox_query') {
    var request = overpass_requests.splice(0, 1);
    return _overpass_process_query(request[0]);
  }

  for(var j = 0; j < overpass_requests.length; j++) {
    var request = overpass_requests[j];

    if(request.type != 'get')
      continue;

    var ids = request.ids;
    var all_found_until_now = true;
    var node_query = '';
    var way_query = '';
    var rel_query = '';
    var bbox_query = '';

    if(request.options.bbox) {
      bbox_query = request.options.bbox.toBBoxString();
      bbox_query = bbox_query.split(/,/);
      bbox_query = '(' + bbox_query[1] + ',' + bbox_query[0] + ',' +
                    bbox_query[3] + ',' + bbox_query[2] + ')';
    }

    if(ids) for(var i = 0; i < ids.length; i++) {
      if(ids[i] === null)
        continue;
      if(ids[i] in overpass_elements) {
        var ob = overpass_elements[ids[i]];
        var ready = true;

        // not fully loaded
        if((ob !== false && ob !== null) && (request.options.properties & ob.properties) != request.options.properties) {
          ready = false;
        }

        // if call_ordered is set in options maybe defer calling feature_callback
        if((!('call_ordered' in request.options) ||
           (request.options.call_ordered && all_found_until_now)) && ready) {
          todo_callbacks.push([ request.feature_callback, ob, i ]);
          request.ids[i] = null;
        }

        if(ready)
          continue;
      }

      all_found_until_now = false;
      if(ids[i] in context.todo)
        continue;

      // too much data - delay for next iteration
      if(effort >= conf.overpass.effort_per_query)
        continue;

      if(request.options.bbox) {
        // check if we already know the bbox of the element; if yes, don't try
        // to load object if it does not intersect bounds
        if(ids[i] in overpass_elements && (overpass_elements[ids[i]].properties & OVERPASS_BBOX))
          if(!request.options.bbox.intersects(overpass_elements[ids[i]].bounds))
            continue;

        context.todo[ids[i]] = true;
        context.todo_requests[ids[i]] = request;
        context.bbox_todo[ids[i]] = true;
      }
      else {
        context.todo[ids[i]] = true;
        context.todo_requests[ids[i]] = request;
      }

      switch(ids[i].substr(0, 1)) {
        case 'n':
          node_query += 'node(' + ids[i].substr(1) + ');\n';
          effort += conf.overpass.effort_node;
          break;
        case 'w':
          way_query += 'way(' + ids[i].substr(1) + ');\n';
          effort += conf.overpass.effort_way;
          break;
        case 'r':
          rel_query += 'relation(' + ids[i].substr(1) + ');\n';
          effort += conf.overpass.effort_relation;
          break;
      }
    }

    if(all_found_until_now) {
      todo_callbacks.push([ request.final_callback, null, null ]);
      overpass_requests[j] = null;
    }

    var out_options = overpass_out_options(request.options);

    if(node_query != '') {
      query += '((' + node_query + ');)->.n;\n';
      if(bbox_query)
        query += 'node.n' + bbox_query + ';\n';
      query += 'out ' + out_options + ';\n';
    }

    if(way_query != '') {
      query += '((' + way_query + ');)->.w;\n';
      if(bbox_query)
        query += '(way.w; - way.w' + bbox_query + '->.w);\nout ids bb qt;\n';
      query += '.w out ' + out_options + ';\n';
    }

    if(rel_query != '') {
      query += '((' + rel_query + ');)->.r;\n';
      if(bbox_query)
        query += '(relation.r; - relation.r' + bbox_query + '->.r);\nout ids bb qt;\n';
      query += '.r out ' + out_options + ';\n';
    }
  }

  async.setImmediate(function() {
    for(var i = 0; i < todo_callbacks.length; i++) {
      var c = todo_callbacks[i];

      c[0](null, c[1], c[2]);
    }
  });

  var p;
  while((p = overpass_requests.indexOf(null)) != -1)
    overpass_requests.splice(p, 1);

  if(query == '') {
    overpass_request_active = false;
    return;
  }

  window.setTimeout(function() {
    http_load(
      conf.overpass.url,
      null,
      "[out:json];\n" + query,
      _overpass_handle_result.bind(this, context)
    );
  }, conf.overpass.time_gap);
}

function _overpass_handle_result(context, err, results) {
  for(var i = 0; i < results.elements.length; i++) {
    var el = results.elements[i];
    var id = el.type.substr(0, 1) + el.id;

    // bounding box only result -> save to overpass_elements with bounds only
    if((el.type == 'relation' && !('members' in el)) ||
       (el.type == 'way' && !('geometry' in el))) {
      var bbox_request = {
        options: {
          properties: OVERPASS_BBOX
        }
      };

      if(id in overpass_elements)
        overpass_elements[id].set_data(el, bbox_request);
      else
        overpass_elements[id] = create_osm_object(el, bbox_request);

      continue;
    }

    if(id in overpass_elements)
      overpass_elements[id].set_data(el, context.todo_requests[id]);
    else
      overpass_elements[id] = create_osm_object(el, context.todo_requests[id]);

    var members = overpass_elements[id].member_ids();
    for(var j = 0; j < members.length; j++) {
      if(!(members[j] in overpass_elements_member_of))
        overpass_elements_member_of[members[j]] = [ overpass_elements[id] ];
      else
        overpass_elements_member_of[members[j]].push(overpass_elements[id]);
    }
  }

  for(var id in context.todo) {
    if(!(id in overpass_elements)) {
      if(id in context.bbox_todo)
        overpass_elements[id] = false;
      else
        overpass_elements[id] = null;
    }
  }

  overpass_request_active = false;

  _overpass_process();
}

/**
 * @param {string} query - Query for requesting objects from Overpass API, e.g. "node[amenity=restaurant]"
 * @param {L.latLngBounds} bounds - A Leaflet Bounds object, e.g. from map.getBounds()
 * @param {object} options
 * @param {number} [options.priority=0] - Priority for loading these objects. The lower the sooner they will be requested.
 * @param {boolean} [options.order_approx_route_length=false] - Order objects by approximate route length (calculated from the bbox diagonal)
 * @param {boolean} [options.call_ordered=false] - When set to true, the function feature_callback will be called in some particular order (e.g. from order_approx_route_length).
 * @param {function} feature_callback Will be called for each object in the order of the IDs in parameter 'ids'. Will be passed: 1. err (if an error occured, otherwise null), 2. the object or null.
 * @param {function} final_callback Will be called after the last feature. Will be passed: 1. err (if an error occured, otherwise null).
 */
function overpass_bbox_query(query, bbox, options, feature_callback, final_callback) {
  var ret = [];

  var bbox_options = {
    properties: OVERPASS_ID_ONLY | OVERPASS_BBOX,
    order_approx_route_length: options.order_approx_route_length
  };

  var tile_bounds = bounds_to_tile(bbox);
  var cache_id = tile_bounds.toBBoxString();

  // check if we have a result for this tile
  if(query in overpass_bbox_query_cache) {
    if(cache_id in overpass_bbox_query_cache[query]) {
      var todo = _overpass_process_query_bbox_grep(overpass_bbox_query_cache[query][cache_id], bbox);

      if(options.order_approx_route_length)
        todo = weight_sort(todo);

      return overpass_get(array_keys(todo), options, feature_callback, final_callback);
    }
  }
  else {
    overpass_bbox_query_cache[query] = {};
  }

  overpass_requests.push({
    type: 'bbox_query',
    query: query,
    bbox: bbox,
    tile_bbox: tile_bounds,
    cache_id: cache_id,
    options: bbox_options,
    get_options: options,
    priority: 'priority' in options ? options.priority : 0,
    feature_callback: feature_callback,
    final_callback: final_callback
  });

  overpass_requests = weight_sort(overpass_requests, 'priority');

  _overpass_process();
}

function _overpass_process_query(request) {
  var bbox_string = request.tile_bbox.toBBoxString();
  bbox_string = bbox_string.split(/,/);
  bbox_string = bbox_string[1] + ',' + bbox_string[0] + ',' +
                bbox_string[3] + ',' + bbox_string[2];

  query_options = '[bbox:' + bbox_string + ']';
  query = request.query;

  var context = {
    request: request
  };

  http_load(
    conf.overpass.url,
    null,
    '[out:json]' + query_options + ';\n' + query + '\nout ' + overpass_out_options(request.options) + ';',
    _overpass_handle_process_query.bind(this, context)
  );
}

function _overpass_handle_process_query(context, err, results) {
  var request = context.request;

  overpass_bbox_query_cache[request.query][request.cache_id] = {};

  for(var i = 0; i < results.elements.length; i++) {
    var el = results.elements[i];
    var id = el.type.substr(0, 1) + el.id;

    var ob_bbox = L.latLngBounds(
      L.latLng(el.bounds.minlat, el.bounds.minlon),
      L.latLng(el.bounds.maxlat, el.bounds.maxlon)
    );
    var approx_route_length = bounds_diagonal_px_length(ob_bbox);

    overpass_bbox_query_cache[request.query][request.cache_id][id] = {
      bbox: ob_bbox,
      approx_route_length: approx_route_length
    };
  }

  var todo = _overpass_process_query_bbox_grep(overpass_bbox_query_cache[request.query][request.cache_id], request.bbox);

  if(request.options.order_approx_route_length)
    todo = weight_sort(todo, 'approx_route_length');

  overpass_get(array_keys(todo), request.get_options, request.feature_callback, request.final_callback);

  overpass_request_active = false;

  _overpass_process();
}

function overpass_abort_all_requests() {
  for(var j = 0; j < overpass_requests.length; j++) {
    if(overpass_requests[j] === null)
      continue;

    overpass_requests[j].final_callback('abort');
  }

  overpass_requests = [];
}

function overpass_regexp_escape(s) {
  return s.replace('\\', '\\\\')
       .replace('.', '\\.')
       .replace('|', '\\|')
       .replace('[', '\\[')
       .replace(']', '\\]')
       .replace('(', '\\(')
       .replace(')', '\\)')
       .replace('{', '\\{')
       .replace('}', '\\}')
       .replace('?', '\\?')
       .replace('+', '\\+')
       .replace('*', '\\*')
       .replace('^', '\\^')
       .replace('$', '\\$');
}

function overpass_out_options(options) {
  var out_options = '';

  if(options.properties & OVERPASS_META)
    out_options += 'meta ';
  else if(options.properties & OVERPASS_TAGS) {
    if(options.properties & OVERPASS_MEMBERS)
      out_options += 'body ';
    else
      out_options += 'tags ';
  }
  else if(options.properties & OVERPASS_MEMBERS)
    out_options += 'skel ';
  else
    out_options += 'ids ';

  if(options.properties & OVERPASS_GEOM)
    out_options += 'geom ';
  else if(options.properties & OVERPASS_BBOX)
    out_options += 'bb ';
  else if(options.properties & OVERPASS_CENTER)
    out_options += 'center ';

  out_options += 'qt';

  return out_options;
}

function _overpass_process_query_bbox_grep(elements, bbox) {
  var ret = {};

  for(var id in elements) {
    if(bbox.intersects(elements[id].bbox))
      ret[id] = elements[id];
  }

  return ret;
}
