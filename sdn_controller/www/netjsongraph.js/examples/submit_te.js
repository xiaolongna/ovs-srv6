//Submit REST http requests to the SDN controller to install the path entered by user in the HTTP form.
function submit_te(){
	var from = document.getElementById("from").value;
	var to = document.getElementById("to").value;
	var controller = document.getElementById("controller").value;
	var seg_types = document.getElementsByName("seg_type");
	var segs = document.getElementById("segs").value.split(",");
	var reversed_segs = document.getElementById("segs").value.split(",").reverse();
	var seg_type = get_segment_type_option(seg_types);	//node or adj
	//Facing corenetwork: port 1
	//Facing host: port 2
	//Segment routing encapsulation port: port 5
	const IN_PORT = 1;
	const OUT_PORT = 2;
	const SR_ENCAP_PORT = 5;
	const PRIORITY = 2;
	const ETH_TYPE= "0x86DD";
	const FLOW_INSERT_API=":8080/flow_mgmt/insert"
	const IS_DEBUG = 0;

	//TODO: check if segments path is valid: eg, it starts with the "from" node and ends with the "to" node, etc.
	check_valid_values(from, to, controller, segs);

	var url = controller+FLOW_INSERT_API;
	var src_dpid = get_dpid(from);
	var dst_dpid = get_dpid(to);
	var graph = fetch_graph(controller+":8080/ospf_monitor/get_topology_netjson");
	var src_match = get_match(to, graph);
	var dst_match = get_match(from, graph);
	if (src_match.length == 0 || dst_match.length == 0){
		window.alert("Can't find match for router " + to + " or " + from);
		return;
	}
	if (IS_DEBUG==1)
		window.alert("Src match: " + src_match + "\nDst match: " + dst_match);
	var src_actions = get_actions(segs, seg_type, graph);
	var dst_actions = get_actions(reversed_segs, seg_type, graph);
	if (src_actions.length == 0 || dst_actions.length == 0){
		window.alert("Can't find actions for path " + segs);
		return;
	}
	if (IS_DEBUG==1)
		window.alert("Src actions: " + src_actions + "\nDst actions: " + dst_actions);
	var src_post_data = construct_post_data(src_dpid, src_match, ETH_TYPE, src_actions, IN_PORT, SR_ENCAP_PORT, PRIORITY);
	var dst_post_data = construct_post_data(dst_dpid, dst_match, ETH_TYPE, dst_actions, IN_PORT, SR_ENCAP_PORT, PRIORITY);
	if (src_post_data.length == 0 || dst_post_data.length == 0){
		window.alert("Can't construct post data for path " + segs);
		return;
	}
	if (IS_DEBUG==1){
		window.alert("Src POST data: " + src_post_data.join("\n"));
		window.alert("Dst POST data: " + dst_post_data.join("\n"));
	}
	//Otherwise, it'll block ALL execution waiting for server response.
	var shouldBeAsync = true;

	var request = new XMLHttpRequest();

	request.onload = function () {
	   var status = request.status; // HTTP response status, e.g., 200 for "200 OK"
	   var data = request.responseText; // Returned data, e.g., an HTML document.
	   console.log(data);
	}


	//Install segment routing encapsulation rules on the OVSes.
	var src_seg_post_data = construct_post_data(src_dpid, "", "", "", SR_ENCAP_PORT, OUT_PORT, PRIORITY);
	var dst_seg_post_data = construct_post_data(dst_dpid, "", "", "", SR_ENCAP_PORT, OUT_PORT, PRIORITY);
	send_POST_request(request, url, src_seg_post_data, shouldBeAsync);
	if (IS_DEBUG==1)
		window.alert("Sent src_seg_post_data " + src_seg_post_data);
	send_POST_request(request, url, dst_seg_post_data, shouldBeAsync);
	if (IS_DEBUG==1)
		window.alert("Sent dst_seg_post_data " + dst_seg_post_data);

	//Install matching rules before sending to the segment routing encapsulation port.
	for (var i = 0; i < src_post_data.length; i++){
		send_POST_request(request, url, src_post_data[i], shouldBeAsync);
		if (IS_DEBUG==1)
			window.alert("Sent src_post_data " + src_post_data[i]);
	}
	for (var i = 0; i < dst_post_data.length; i++){
		send_POST_request(request, url, dst_post_data[i], shouldBeAsync);
		if (IS_DEBUG==1)
			window.alert("Sent dst_post_data " + dst_post_data[i]);
	}
	window.alert("Done installing the path");
}

function send_POST_request(request, url, post_data, is_async){
	request.open("POST", url, is_async);
	//Send POST request with POST data in the format: "dpid=123&match=123&action=..."
	request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	//request.setRequestHeader("Content-Type", "application/json");
	request.send(post_data);
}

function get_segment_type_option(seg_types){
	var seg_type = "node";
	for (var i = 0; i < seg_types.length; i++){
		if (seg_types[i].checked){
			seg_type = seg_types[i].value;
			break;
		}
	}
	return seg_type;

}

//TODO
function check_valid_values(from, to, controller, segs){
	return;
}

function construct_actions(segments){
	tokens = segments.split(",");
	var ret = "";
	for (var i = 0; i < tokens.length; i++){
		if (is_valid_ipv6(tokens[i]) == true){
			ret += "ipv6_dst=" + tokens[i] + ","		
		} else {
			window.alert("Segment " + tokens[i] +"is an INVALID IPv6 address!");
			return "";
		}
	}
	return ret.substring(0,ret.length-1);
}

function construct_ofp_rule(dpid, match, eth_type, actions, in_port, out_port, priority){
	var fields = [];
	fields.push("dpid="+dpid);
	fields.push("priority="+priority);
	fields.push("match="+construct_ofp_match_str(match, eth_type, in_port));
	fields.push("actions="+construct_ofp_actions_str(actions, out_port));
	return fields.join("&");
}

function construct_ofp_match_str(match, eth_type, in_port){
	var match_fields = [];
	if (match != "")
		match_fields.push(match);
	if (eth_type != "")
		match_fields.push("eth_type="+eth_type);
	if (in_port != "")
		match_fields.push("in_port="+in_port);
	return match_fields.join(",");
}

function construct_ofp_actions_str(actions, out_port){
	var actions_fields = [];
	if (actions != "")
		actions_fields.push(actions);
	if (out_port != "")
		actions_fields.push("output="+out_port);
	return actions_fields.join(",");
}


function construct_post_data(dpid, match, eth_type, actions, in_port, out_port, priority){
	var ret = [];
	if (dpid == "" || out_port == "" || priority == "") {
		return ret;
	}
	var matches = match.split(",");
	if (matches.length == 0){
		ret.push(construct_ofp_rule(dpid, "", eth_type, actions, in_port, out_port, priority));
	}
	for (var i = 0; i < matches.length; i++){
		ret.push(construct_ofp_rule(dpid, matches[i], eth_type, actions, in_port, out_port, priority));
	}
	return ret;
}


function is_valid_ipv6(ipv6){
 	return /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(ipv6);
}

function get_dpid(node){
	return node;
}

//Generate the SDN 'match' field from the destination node.
//By default the 'match' field matches all prefixes that the dst node has.
//eg, if dst node has 2 prefixes: 200::/16, 2001::1234:/64 then the match
//will be: ["ipv6_dst=200::/16", "ipv6_dst=2001::1234:/64"]
//Return: list of ipv6 addresses
function get_match(node, graph){
	nodes = graph.nodes;
	var ret = "";
	var n = null;
	var matches = [];
	for (var i = 0; i < nodes.length; i++){
		if (nodes[i].id == node){
			n = nodes[i];
			break;
		}
	}
	if (n==null){
		return ret;
	}
	
	for (var i = 0; i < n.properties.Prefixes.length; i++){
		if (is_valid_ipv6(n.properties.Prefixes[i]) == true){
			var prefix_length = get_ipv6_prefix_length(n.properties.Prefixes[i]);
			if (prefix_length > 0)
				matches.push("ipv6_dst="+n.properties.Prefixes[i]+"/"+prefix_length);
		}
	}
	ret = matches.join(",");
	return ret;
	
}

//Generate the SDN 'actions' field from a list of nodes describing the path.
//Return: list of ipv6 addresses
function get_actions(segs, seg_type, graph){
	ret = "";
	ipv6s = [];
	if (segs.length == 0)
		return ret;

	if (seg_type == "node"){
		for (var i = 0; i < segs.length; i++) {
			var node = get_node_by_id(graph, segs[i]);
			if (node != null)
				ipv6s.push("ipv6_dst=" + node.properties['Node segment']);
		}
	}
	if (seg_type == "adj"){
		var node = get_node_by_id(graph, segs[0]);
		if (node != null)
			ipv6s.push("ipv6_dst="+node.properties['Node segment']); //First segment is *always* first node's node segment.
		for (var i = 0; i < segs.length-1; i++) {
			var edge_src = segs[i];
			var edge_dst = segs[i+1];
			var edge = get_edge_from_src_dst(edge_src, edge_dst, graph);
			if (edge != null)
				ipv6s.push("ipv6_dst=" + edge.properties['Dst Interface Address']);
		}
	}
	ret = ipv6s.join(",");
	return ret;
} 

function get_node_by_id(graph, id){
	nodes = graph.nodes;
	for (var i = 0; i < nodes.length; i++) {
		if (nodes[i].id == id)
			return nodes[i];
	}
	return null;
}
function get_edge_from_src_dst(edge_src, edge_dst, graph){
	edges = graph.links;
	for (var i = 0; i < edges.length; i++) {
		if (edge_src==edges[i].source && edge_dst==edges[i].target){
			return edges[i];
		}
	}
	return null;
}

function get_ipv6_prefix_length(ipv6_prefix){
	ipv6_blocks = ipv6_prefix.split(":");
	var count = 0;
	for (var i = 0; i < ipv6_blocks.length; i++){
		if (ipv6_blocks[i] != ""){
			count += 1
		}
	}
	if (ipv6_blocks[ipv6_blocks.length-1] == "1")
		count -= 1;
	return count*16;
}


function fetch_graph(url){
        var graph = (function() {
                        var json = null;
                        $.ajax({
                                'async': false,
                                'global': false,
                                'url': url,
                                'dataType': "json",
                                'success': function (data) {
                                        json = data;
                                }
                        });
                        return json;
        })();
        return graph;
}
