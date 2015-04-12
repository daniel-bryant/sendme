// From Tim Down via:
// http://stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
function nextNode(node) {
    if (node.hasChildNodes()) {
        return node.firstChild;
    } else {
        while (node && !node.nextSibling) {
            node = node.parentNode;
        }
        if (!node) {
            return null;
        }
        return node.nextSibling;
    }
}

function getRangeSelectedNodes(range) {
    var node = range.startContainer;
    var endNode = range.endContainer;

    // Special case for a range that is contained within a single node
    if (node == endNode) {
        return [node];
    }

    // Iterate nodes until we hit the end container
    var rangeNodes = [];
    while (node && node != endNode) {
        rangeNodes.push( node = nextNode(node) );
    }

    // Add partially selected nodes at the start of the range
    node = range.startContainer;
    while (node && node != range.commonAncestorContainer) {
        rangeNodes.unshift(node);
        node = node.parentNode;
    }

    return rangeNodes;
}

function getSelectedNodes() {
    if (window.getSelection) {
        var sel = window.getSelection();
        if (!sel.isCollapsed) {
            return getRangeSelectedNodes(sel.getRangeAt(0));
        }
    }
    return [];
}
// end of Tim Down's stuff

/* ---------- Get selected characters in the document ---------- */
function getSelectedChars() {
  return getSelectedNodes().filter(function(element) {
    return (element.nodeType == 1 && element.tagName.toLowerCase() == 'span');
  });
}

/* ---------- Update selection ---------- */
// needs to be done every time an event occurs that could change the selected characters
function update_selection() {
  setTimeout(function() {
    var selected_chars = getSelectedChars();

    $('.selection').removeClass('selection');
    $(selected_chars).addClass('selection');

    if (selected_chars.length) {
      window.$cursor.removeClass('cursor blink-1s');
    } else {
      window.$cursor.addClass('cursor blink-1s');
    }
  }, 0);
}

var mousedown = false;

$(document).mousedown(function() {
  mousedown = true;
  update_selection();
});

$(document).mouseup(function() {
  mousedown = false;
  update_selection();
});

$(document).mousemove(function() {
  if (mousedown) {
    update_selection();
  }
});

/* ---------- Collapse selection ---------- */
function collapse_selected() {
  if (window.getSelection) {
    var sel = window.getSelection();
    if (!sel.isCollapsed) {
      sel.collapseToStart();
      update_selection();
    }
  }
}
