/*jslint nomen: true, white: true, plusplus: true */
/*global window, alert, File, FileReader, FileList, Blob, $  */
(function() {
	'use strict';
	
	var $ta, $resultTa, $xmlTree, $xml, $entries,
		convertToCSV, getXmlNodes, getXmlNodeAttributes, 
		readFile, getText, onFileRead, parseXml, drawXmlTree;
	
	if (! (window.File && window.FileReader && window.FileList && window.Blob)) {
		// Some File APIs are supported.
		alert('The File APIs are not fully supported in this browser, results may vary');
	}
	
	// read xml content using HTML5 File API
	readFile = function (evt, onFileReadCallback) {
		var reader = new FileReader(), file;
		file = evt.target.files[0];
		if(file.type !== 'text/xml') {
			alert("Not an XML file. Only XML files are allowed");
			return;
		}
		reader.readAsText(file, "UTF-8");
		reader.onload = function (evt) {
			if(onFileReadCallback) {
				onFileReadCallback(evt.target.result);
			}
			 
		};
	};
	
	// adds the value of the XML nodes mathing the given xpath
	getText = function (xml, xpath, nodes) {
		$(xpath, xml).each(function () {
			nodes.push($(this).text());
		});
	};
	
	onFileRead = function (fileData) {
		$ta.text(fileData);
		$xml = parseXml(fileData);
		if(! $xml) {
			return;
		}
		var xmlStruct = getXmlNodes($xml.children(), true, {});
		// console.log('xmlStruct:', xmlStruct);
		
		$xmlTree.empty();
		drawXmlTree($xmlTree, xmlStruct);
	};
	
	parseXml = function (fileData) {
		var xml;
		try {
			xml = $.parseXML(fileData);
		} catch(err) {
			alert('Invalid XML: ' + err);
			return;
		}
		
		if (!xml) {
			alert('No file data to read (missed step-1?)');
			return;
		}
		return $(xml);
	};
	
	/** @param xmlStruct {Object} XML structure */
	drawXmlTree = function($xmlNode, xmlStruct) {
		var nodeName, $treeNode, nodeObj, attribs, i;
		
		for(nodeName in xmlStruct) {
			if(xmlStruct.hasOwnProperty(nodeName)) {
				// skip the __attr__ and __haschild__ keys
				if(nodeName !== '__attr__' && nodeName !== '__haschild__') {
					$treeNode = $('<span class="tree-node"><label>' + nodeName + '<input type="checkbox"></label></span>');
					$xmlNode.append($treeNode);
				
					nodeObj = xmlStruct[nodeName];
					if(nodeObj) {
						if(nodeObj.hasOwnProperty('__attr__')) {
							attribs = nodeObj.__attr__;
							for (i = 0; i < attribs.length; i++) {
								$treeNode.append('<label class="attrib-label">' + attribs[i] + '<input type="checkbox"></label>');
							}
						}
						
						if(nodeObj.hasOwnProperty('__haschild__') && nodeObj.__haschild__ === true) {
							drawXmlTree($treeNode, nodeObj);
						}
					}
				}
			}
		}
	};
		
	// retuns the child nodes of the root node, which generally will be repeated
	getXmlNodes = function($node, isRoot, labels) {
		var node, nodeName, nodes, $currNode, i, attribs;
		nodes = $node.children();
		
		if(isRoot && nodes.length === 0) {
			alert('No child nodes found under root node');
			return;
		}
		
		for(i = 0; i < nodes.length; i++) {
			// add node name
			node = nodes[i];
			nodeName = node.localName;
			if(! labels.hasOwnProperty(nodeName)) {
				labels[nodeName] = null;
			}
			
			// add attribute names
			attribs = getXmlNodeAttributes(nodes[i]);
			if(attribs) {
				if(labels[nodeName] === null) {
					labels[nodeName] = {};
				}
				labels[nodeName].__attr__ = attribs;
			}
			
			// look for children nodes further down until none found
			$currNode = $(nodes[i]);
			if($currNode.children().length > 0) {
				if(labels[nodeName] === null) {
					labels[nodeName] = {};
				}
				labels[nodeName].__haschild__ = true;
				getXmlNodes($currNode, false, labels[nodeName]);
			}
		}
		
		return labels;
	};
		
	getXmlNodeAttributes = function(node) {
		if(! node) {
			return;
		}
		
		var attribs = node.attributes, attribNames, i;
		if(attribs.length === 0) {
			return;
		}
		
		attribNames = [];
		for(i = 0; i < attribs.length; i++) {
			attribNames.push(attribs[i].localName);
		}
		return attribNames;
	};
		
	// convert the XML to CSV
	convertToCSV = function ($xml, textDelim, separator, lineSeparator) {
		var result = "", entries, nodes = [], node,
			i, j, k;
		
		entries = $('input', $entries);
		
		for(i = 0; i < entries.length; i++) {
			node = [];
			nodes.push(node);
			getText($xml, entries[i].value, node);
		}
		
		for(j = 0; j < nodes[0].length; j++) {
			for(k = 0; k < nodes.length; k++) {
				result += textDelim + (nodes[k][j] || '') + textDelim;
				if(k < nodes.length - 1) {
					result += separator;
				}
			}
			result += lineSeparator;
		}
		
		return result;
	};
	
	
	// DOM load
	$(function () {
		$entries = $('#entries');
		$ta = $('#ta');
		$resultTa = $('#resultTa');
		$xmlTree = $('#xmlTree');
	
		// on file changed event to read the file content
		$('#xmlFile').on('change', function(evt) {
			$ta.text('');
			$xmlTree.empty();
			
			readFile(evt, onFileRead);
		});
		
		$('#advanceMode').on('change', function() {
			$('#xmlTreeView').toggleClass('hide');
			$('#xpathEntries').toggleClass('hide');
		});
		
		// on clicking 'Add more' button will add new input text
		$('#addEntryBtn').on('click', function () {
			$entries.append('<span><input type="text" size="50" ></span><br/>');
		});
		
		$('#convertBtn').on('click', function () {
			$resultTa.text(convertToCSV($xml, '"', ',', '\n'));
		});
		
	});
}());