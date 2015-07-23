var STYLE_ATTRIBUTES = ['font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration'];

/* Setting the cursor */

function set$Cursor(textNode) {
  var $line = $(textNode).closest('.smore-line');
  var format;

  var prev_node = prevTextNode(textNode);
  if (prev_node && $(prev_node).closest('.smore-line').is($line)) {
    format = $(prev_node).closest('.smore-wordnode').css(STYLE_ATTRIBUTES);
  } else {
    format = $(textNode).closest('.smore-wordnode').css(STYLE_ATTRIBUTES);
  }

  window.$cursor.css(format);
  window.$cursor[0].style.lineHeight = $(textNode).closest('.smore-paragraph')[0].style.lineHeight

  var pos_top = $line.position().top;

  var range = document.createRange();
  range.selectNodeContents(textNode);
  var rects = range.getClientRects();
  var pos_left = rects[0].left;

  window.$cursor.css({'top': pos_top, 'left': pos_left});

  set_format_vals();
}

function setCursorTextNode() {
  if (window.cursorOffset > 0) {
    var rightside = window.cursorTextNode.splitText(window.cursorOffset);
    set$Cursor(rightside);
    rightside.parentNode.normalize();
  } else {
    set$Cursor(window.cursorTextNode);
  }
}

/* Document click handlers */

function handleWordnodeClick($word, coordinates) {
  var $textnode = $word.contents().filter(function() { return this.nodeType == 3; });
  //var $nbspnode = $word.contents().filter(function () { return $(this).hasClass('smore-nbsp'); }).contents().filter(function() { return this.nodeType == 3; });
  if ($textnode.length) {
    window.cursorTextNode = $textnode[0];
    var range = document.createRange();

    var offset = 0;
    var textnode = window.cursorTextNode;
    range.selectNodeContents(textnode);
    var rects = range.getClientRects();
    var pos_left = rects[0].left;

    var curr_node = textnode;
    var curr_left = pos_left;
    while (textnode.length > 1 && coordinates.pageX > pos_left) {
      curr_node = textnode;
      curr_left = pos_left;

      offset++;
      textnode = textnode.splitText(1);
      range.selectNodeContents(textnode);
      rects = range.getClientRects();
      pos_left = rects[0].left;
    }

    if ( (coordinates.pageX - curr_left) > (pos_left - coordinates.pageX) ) {
      curr_node = textnode;
      offset++;
    }
    window.cursorOffset = offset - 1;
    set$Cursor(curr_node);
    curr_node.parentNode.normalize();
  } else {
    console.log("wordnode has no textNodes, not handled");
  }
}

function matchClickToWord($line, coordinates) {
  var $words = $line.find('.smore-wordnode');
  var $word = $words.first();
  $words.each(function() {
    if ($(this).offset().left > coordinates.pageX) return false;
    $word = $(this);
  });
  handleWordnodeClick($word, coordinates);
}

function matchClickToLine($tag, coordinates) {
  var $lines = $tag.find('.smore-line');
  var $line = $lines.first();
  $lines.each(function() {
    if ($(this).offset().top > coordinates.pageY) return false;
    $line = $(this);
  });
  matchClickToWord($line, coordinates);
}

$(document).on('mousedown', '#document-editor', function(event) {
  if (this === event.target) {
    matchClickToLine($(this), {pageY: event.pageY, pageX: event.pageX});
  }
});

$(document).on('mousedown', '.page', function(event) {
  if (this === event.target) {
    matchClickToLine($(this), {pageY: event.pageY, pageX: event.pageX});
  }
});

$(document).on('mousedown', '.page .smore-paragraph', function(event) {
  if (this === event.target) {
    matchClickToLine($(this), {pageY: event.pageY, pageX: event.pageX});
  }
});

$(document).on('mousedown', '.page .smore-line', function(event) {
  if (this === event.target) {
    matchClickToWord($(this), {pageY: event.pageY, pageX: event.pageX});
  }
});

$(document).on('mousedown', '.page .smore-wordnode', function(event) {
  if (this === event.target) {
    handleWordnodeClick($(this), {pageY: event.pageY, pageX: event.pageX});
  }
});

$(document).on('mousedown', '.smore-nbsp', function(event) {
  var textnode = $(this).contents()[0];
  window.cursorTextNode = textnode;
  window.cursorOffset = 0;
  set$Cursor(textnode);
});

/* compare_styles (haveSameStyles?) - compare the editor related styles of 2 words. returns true if they match, returns false otherwise */

function compare_styles(css1, css2) {
  if (css1['font-family'] != css2['font-family']) return false;
  if (css1['font-size'] != css2['font-size']) return false;
  if (css1['font-weight'] != css2['font-weight']) return false;
  if (css1['font-style'] != css2['font-style']) return false;
  if (css1['text-decoration'] != css2['text-decoration']) return false;

  return true;
}

/* Pagination */

function splitTextByChar(textnode, character) {
  var str = textnode.nodeValue;
  var indices = [];
  var adjust_cursor = (window.cursorTextNode == textnode);

  for(var i=0; i < str.length; i++) {
    if (str[i] === character) indices.push(i);
  }

  for (var i = indices.length - 1; i >= 0; i--) {
    var index = indices[i];
    if (index + 1 < textnode.length) textnode.splitText(index + 1);
    if (index > 0) textnode.splitText(index);
  }

  if (adjust_cursor) {
    var sum = 0;
    while (textnode && (sum + textnode.length) <= window.cursorOffset) {
      sum += textnode.length;
      // below must happen after above
      textnode = textnode.nextSibling;
    }
    window.cursorTextNode = textnode;
    window.cursorOffset = window.cursorOffset - sum;
  }
}

function normalizeText(word) {
  var cursor_parent = window.cursorTextNode.parentNode;
  if (cursor_parent == word) {
    var sibling;
    while ((sibling = window.cursorTextNode.previousSibling)) {
      window.cursorOffset += sibling.length;
      window.cursorTextNode = sibling;
    }
  }

  word.normalize();
}

function pushWordsDown($line) {
  if ($line[0].scrollWidth > $line[0].clientWidth) {
    var line_right = $line.offset().left + $line.width();

    var $word;
    $line.find('.smore-wordnode').each(function() {
      $word = $(this);
      if ($word.offset().left + $word.width() > line_right) { return false; }
    });

    var textnode = $word.contents().filter(function() { return this.nodeType == 3; })[0];
    splitTextByChar(textnode, '\u00a0');
    var $textnodes = $word.contents().filter(function() { return this.nodeType == 3; });
    $textnodes.each(function() {
      var range = document.createRange();
      range.selectNodeContents(this);
      var rects = range.getClientRects();
      var pos_left = rects[0].left;
      if (pos_left < line_right) {
        textnode = this;
      } else {
        return false;
      }
    });

    var $newline = $('<div class="smore-line"></div>');
    var $newword = $('<span class="smore-wordnode"></span>').css($word.css(STYLE_ATTRIBUTES));
    var $new_nbsp = $('<span class="smore-nbsp"></span>');
    var nbsp_node = document.createTextNode('\u00a0');

    $line.after($newline);
    $newline.append($newword);
    $newword.append($new_nbsp);
    $new_nbsp.append(nbsp_node);

    var moving = [];
    while (textnode) {
      var next = textnode.nextSibling;
      if (textnode.nodeType == 3) { moving.push(textnode); }
      textnode = next;
    }

    for (var i = moving.length - 1; i >= 0; i--) {
      $newword.prepend(moving[i]);
    }

    // move the cursor to the next line if it's in a nbsp end node
    if (window.cursorTextNode == $line.find('.smore-nbsp').contents()[0]) {
      window.cursorTextNode = $newline.find('.smore-nbsp').contents()[0];
    }

    normalizeText($word[0]);
    normalizeText($newword[0]);

    setCursorTextNode();

    pushWordsDown($newline);
  }
}

function pullWordsUp($line) {
  var $last_word = $line.contents().last();
  var space_left = ($line.position().left + $line.width()) - ($last_word.position().left + $last_word.width());

  var $next_line = $line.next('.smore-line');
  $next_line.contents().each(function() {
    var continue_loop = true;
    var $this_word = $(this);

    var textnode = $this_word.contents().filter(function() { return this.nodeType == 3; })[0];
    if (!textnode) { return false; }
    splitTextByChar(textnode, '\u00a0');

    var $nbsp = $last_word.contents('.smore-nbsp');
    var $textnodes = $this_word.contents().filter(function() { return this.nodeType == 3; });
    $textnodes.each(function() {
      var range = document.createRange();
      range.selectNodeContents(this);
      rects = range.getClientRects();
      var width = rects[0].right - rects[0].left;
      if (width < space_left) {
        if (compare_styles($last_word.css(STYLE_ATTRIBUTES), $this_word.css(STYLE_ATTRIBUTES))) {
          $nbsp.before(this);
        } else {
          var $new_word = $('<span class="smore-wordnode"></span>').css($this_word.css(STYLE_ATTRIBUTES));
          $last_word.after($new_word);
          $new_word.append($nbsp);
          $nbsp.before(this);
          $last_word = $new_word;
        }
        if ($nbsp.contents()[0] == window.cursorTextNode) { window.cursorTextNode = this; }
        space_left = ($line.position().left + $line.width()) - ($last_word.position().left + $last_word.width());
      } else {
        continue_loop = false; // stop $next_line.contents().each()
        return continue_loop; // stop $textnodes.each()
      }
    });

    if ($this_word.contents().filter(function() { return this.nodeType == 3; }).length) {
      normalizeText($this_word[0]);
    } else { // word is empty
      if ($this_word.find('.smore-nbsp').length && $this_word.contents('.smore-nbsp').contents()[0] == window.cursorTextNode) {
        window.cursorTextNode = $last_word.contents('.smore-nbsp').contents()[0];
      }
      $this_word.remove();
    }

    normalizeText($last_word[0]);
    return continue_loop;
  });

  if ($next_line.contents('.smore-wordnode').contents().filter(function() { return this.nodeType == 3; }).length == 0) {
    if ($next_line.find('.smore-nbsp').contents().filter(function() { return this.nodeType == 3; })[0] == window.cursorTextNode) {
      window.cursorTextNode = $line.find('.smore-nbsp').contents().filter(function() { return this.nodeType == 3; })[0];
    }
    $next_line.remove();
    $next_line = $line.next('.smore-line');
  }

  setCursorTextNode();

  if ($next_line.length) {
    pullWordsUp($next_line);
  }
}

/* Keypress handlers */

function handle_keypress(keycode) {
  var $word = $(window.cursorTextNode).closest('.smore-wordnode');
  var $line = $(window.cursorTextNode).closest('.smore-line');
  var charTextNode = document.createTextNode(String.fromCharCode(keycode));

  var word_format = $word.css(STYLE_ATTRIBUTES);
  var cursor_format = window.$cursor.css(STYLE_ATTRIBUTES);
  var same_styles = compare_styles(word_format, cursor_format);

  if (window.cursorOffset > 0) {
    if (same_styles) {
      var rightside = window.cursorTextNode.splitText(window.cursorOffset);
      $(rightside).before(charTextNode);
      set$Cursor(rightside);
      window.cursorOffset++;
      window.cursorTextNode.parentElement.normalize();
    } else {
      var rightside = window.cursorTextNode.splitText(window.cursorOffset);
      var $left_word = $word.clone().empty();
      $word.before($left_word);
      $left_word.append(window.cursorTextNode);

      $left_word = $word.clone().empty().css(cursor_format);
      $word.before($left_word);
      $left_word.append(charTextNode);

      window.cursorTextNode = rightside;
      window.cursorOffset = 0;
      setCursorTextNode();
    }
  } else {
    if ($(window.cursorTextNode.parentElement).hasClass('smore-nbsp')) {
      var prev_node = prevTextNode(window.cursorTextNode);
      if (prev_node && $(prev_node).closest('.smore-wordnode').is($word)) {
        if (compare_styles($(prev_node).closest('.smore-wordnode').css(STYLE_ATTRIBUTES), cursor_format)) {
          $(prev_node).after(charTextNode);
          setCursorTextNode(); // TODO all we need to do here is adjust the position. this calls the entire set$Cursor method
          prev_node.parentNode.normalize();
        } else {
          var $new_word = $('<span class="smore-wordnode"></span>').css(cursor_format);
          $word.after($new_word);
          $new_word.append(charTextNode);
          $new_word.append($(window.cursorTextNode.parentElement));
          setCursorTextNode(); // TODO all we need to do here is adjust the position. this calls the entire set$Cursor method
        }
      } else {
        $word.prepend(charTextNode);
        $word.css(cursor_format);
        setCursorTextNode(); // TODO all we need to do here is adjust the position. this calls the entire set$Cursor method
      }
    } else {
      var prev_node = prevTextNode(window.cursorTextNode);
      if (prev_node && $(prev_node).closest('.smore-line').is($line) && compare_styles($(prev_node).closest('.smore-wordnode').css(STYLE_ATTRIBUTES), cursor_format)) {
        $(prev_node).after(charTextNode);
        prev_node.parentNode.normalize();
        setCursorTextNode(); // TODO all we need to do here is adjust the position. this calls the entire set$Cursor method
      } else if (same_styles) {
        $(window.cursorTextNode).before(charTextNode);
        setCursorTextNode();
        window.cursorTextNode.parentNode.normalize();
        window.cursorOffset = 1;
      } else {
        console.log("different styles not finished");
        var $new_word = $('<span class="smore-wordnode"></span>').css(cursor_format);
        $word.before($new_word);
        $new_word.append(charTextNode);
        setCursorTextNode(); // TODO all we need to do here is adjust the position. this calls the entire set$Cursor method
      }
    }
  }

  pushWordsDown($line);
}

function handle_enter_keypress() {
  //var $parent = window.$cursor.parent();
  var $word = $(window.cursorTextNode).closest('.smore-wordnode');
  var $para = $word.closest('.smore-paragraph');

  // if the user presses "Enter" while in an empty list item
  //if ($parent[0].tagName == "LI" && $parent.contents().length == 1) {
  if (false) {
    // create a normal paragraph div
    var $new_para = $("<div />").css($parent.css(['text-align', 'line-height'])).append($parent.contents());
    var pl = $parent.prev().length;
    var nl = $parent.next().length;
    if (pl && nl) {
      // we are in the middle of a list, can't exit the list here
      $parent.after($new_para);
    } else if (pl) {
      // we are at the end of a list, exit the ul/ol and place after
      $parent.parent().after($new_para);
    } else if (nl) {
      // we are at the beginning of a list, exit the ul/ol and place before
      $parent.parent().before($new_para);
    } else {
      // list is completely empty, append div after and remove the entire list
      $parent.parent().after($new_para).remove();
    }
    $parent.remove(); // remove current LI
    $('#ol-checkbox')[0].checked = false;
    $('#ul-checkbox')[0].checked = false;
  } else {
    // create a copy of the current div and append the new div after the current
    var $new_para = $('<div class="smore-paragraph"></div>');
    $new_para[0].style.textAlign = $para[0].style.textAlign;
    $new_para[0].style.lineHeight = $para[0].style.lineHeight;
    var $new_line = $('<div class="smore-line"></div>');
    var $new_word = $('<span class="smore-wordnode"></span>').css($word.css(STYLE_ATTRIBUTES));
    var $new_nbsp = $('<span class="smore-nbsp"></span>');
    var nbsp_node = document.createTextNode('\u00a0');

    $para.after($new_para);
    $new_para.append($new_line);
    $new_line.append($new_word);

    if ($(window.cursorTextNode.parentNode).hasClass('smore-nbsp')) {
      $new_word.append(window.cursorTextNode.parentNode);
    } else {
      var rightside = window.cursorTextNode.splitText(window.cursorOffset);
      var next = rightside;

      while (next) {
        var curr = next;
        next = next.nextSibling;
        $new_word.append(curr);
      }

      window.cursorTextNode = rightside;
      window.cursorOffset = 0;
    }

    $word.append($new_nbsp);
    $new_nbsp.append(nbsp_node);
    set$Cursor(window.cursorTextNode);
  }
}

function handle_backspace() {
  var $line = $(window.cursorTextNode).closest('.smore-line');

  if (window.cursorOffset > 0) { // in the middle of a textNode
    // remove previous character
    var rightside = window.cursorTextNode.splitText(window.cursorOffset);
    var removeNode;
    if (window.cursorTextNode.length > 1) {
      removeNode = window.cursorTextNode.splitText(window.cursorTextNode.length - 1);
    } else {
      removeNode = window.cursorTextNode;
      window.cursorTextNode = rightside;
    }
    removeNode.remove();
    window.cursorOffset--;
    window.cursorTextNode.parentNode.normalize();
    setCursorTextNode();
  } else { // at the beginning of a textNode
    // find the previous textNode
    var prev_node = prevTextNode(window.cursorTextNode);

    if (prev_node) {
      var $word = $(window.cursorTextNode).closest('.smore-wordnode');

      if ($(window.cursorTextNode).parent().hasClass('smore-nbsp')) { // inside an end-block
        var $nbsp = $(window.cursorTextNode).parent();

        if ( $(prev_node).closest('.smore-wordnode').is($word) ) { // same word
          if (prev_node.length > 1) {
            prev_node.splitText(prev_node.length - 1).remove();
            setCursorTextNode();
          } else {
            var $prev_word = $word.prev('.smore-wordnode');

            // if a previous wordnode exists AND its in the same line THEN we copy the nbsp block into that word ELSE we do nothing
            if ($prev_word.length) {
              $prev_word.append($nbsp);
              $word.remove();
              setCursorTextNode();
            } else {
              prev_node.remove();
              setCursorTextNode();
            }
          }
        } else { // can assume that this line is empty besides the current end-block
          if ($line.prev('.smore-line').length) { // if this exists, we know we have a previous line in the same paragraph
            var $prev_line = $line.prev('.smore-line');
            console.log("shouldn't get here, prev line:");
            console.log($prev_line);
          } else if (prevOfClass($line, 'smore-line').length) {  // if this exists, we have a previous line, but not in the same paragraph
            var $prev_line = prevOfClass($line, 'smore-line');
            window.cursorTextNode = $prev_line.find('.smore-nbsp').contents()[0];
            $line.remove();
            setCursorTextNode();
          }
        }
      } else {
        var $prev_word = $word.prev('.smore-wordnode');

        if ($prev_word.length) {
          var prev_node = $prev_word.contents()[0];
          if (prev_node.length > 1) {
            prev_node.splitText(prev_node.length - 1).remove();
            setCursorTextNode();
          } else {
            $prev_word.remove();
            setCursorTextNode();
          }
        }
      }
    } // else { // do nothing }
  }

  $line.prev().length ? pullWordsUp($line.prev()) : pullWordsUp($line)
}

$(document).on('page:change', function() {
  if ($('#document-editor-toolbar').length) {
    // set up variables needed to save documents to the api
    window.timer = null;
    window.document_url = $('#document-editor-toolbar').data().url;

    // handle keypress events (character handling)
    $(document).on('keypress', '#document-editor', function(event) {
      event.preventDefault();
      if (event.which == 13) { // ENTER key
        handle_enter_keypress();
      } else if (event.which == 32) { // if SPACE is entered
        handle_keypress(160); // substitute a nbsp
      } else {
        handle_keypress(event.which);
      }
      scroll_to_cursor();
      saveChanges();
    });

    // handle keydown
    $(document).on('keydown', '#document-editor', function(event) {
      switch (event.which) {
        case 8: // backspace
          event.preventDefault();
          handle_backspace();
          scroll_to_cursor();
          saveChanges();
          break;
        case 37: // left
          event.preventDefault();
          move_cursor_left();
          scroll_to_cursor();
          break;
        case 38: // up
          event.preventDefault();
          move_cursor_up();
          scroll_to_cursor();
          break;
        case 39: // right
          event.preventDefault();
          move_cursor_right();
          scroll_to_cursor();
          break;
        case 40: // down
          event.preventDefault();
          move_cursor_down();
          scroll_to_cursor();
          break;
        default:
          // ignore
      }
    });

    // font-family select
    $('#font-fam-select li').click(function() {
      var family = $(this).html();
      $('#font-fam-select button span').html(family);
      format_selection('font-family', family);
    });

    // font-size select
    $('#font-size-select li').click(function() {
      var size = $(this).html();
      $('#font-size-select button span').html(size);
      format_selection('font-size', (size + 'px'));
    });

    // bold
    $('#bold-checkbox').change(function() {
      format_selection('font-weight', (this.checked ? 'bold' : 'normal'));
    });

    // italic
    $('#italic-checkbox').change(function() {
      format_selection('font-style', (this.checked ? 'italic' : 'normal'));
    });

    // underline
    $('#underline-checkbox').change(function() {
      format_selection('text-decoration', (this.checked ? 'underline' : 'none'));
    });

    // text-align
    $("input[name=align]:radio").change(function () {
      $(window.cursorTextNode).closest('.smore-paragraph').css('text-align', $(this).val());
      setCursorTextNode();
    });

    // line-height select
    $('#line-height-select li').click(function() {
      $('#line-height-select button span').html($(this).html());
      $(window.cursorTextNode).closest('.smore-paragraph').css('line-height', $(this).data().value);
      setCursorTextNode();
    });

    // ordered list
    $('#ol-checkbox').change(function() {
      if ( this.checked ) {
        // creating a ul
        if ($('#ul-checkbox')[0].checked) { // we're already in a ul
          // replace ul with ol
          var $list = $(window.cursorTextNode).closest('.smore-paragraph').parent();
          var $items = $list.contents();
          $list.replaceWith($items);
          $items.wrapAll("<ol />");
          $('#ul-checkbox')[0].checked = false;
        } else {
          var $para = $(window.cursorTextNode).closest('.smore-paragraph');
          $para.wrap("<ol />");
          var $li = $('<li class="smore-paragraph"></li>');
          $li[0].style.textAlign = $para[0].style.textAlign;
          $li[0].style.lineHeight = $para[0].style.lineHeight;
          $para.wrap($li);
          $para.replaceWith($para.contents());
        }
      } else {
        var $list = $(window.cursorTextNode).closest('.smore-paragraph').parent();
        $list.children().each(function() {
          var $this = $(this);
          var $para = $('<div class="smore-paragraph"></div>');
          $para[0].style.textAlign = this.style.textAlign;
          $para[0].style.lineHeight = this.style.lineHeight;
          $this.wrap($para);
          $this.replaceWith($this.contents());
        });
        $list.replaceWith($list.contents());
      }
      set$Cursor(window.cursorTextNode);
    });

    // unordered list
    $('#ul-checkbox').change(function() {
      if ( this.checked ) {
        // creating a ul
        if ($('#ol-checkbox')[0].checked) { // we're already in a ol
          // replace ol with ul
          var $list = $(window.cursorTextNode).closest('.smore-paragraph').parent();
          var $items = $list.contents();
          $list.replaceWith($items);
          $items.wrapAll("<ul />");
          $('#ol-checkbox')[0].checked = false;
        } else {
          var $para = $(window.cursorTextNode).closest('.smore-paragraph');
          $para.wrap("<ul />");
          var $li = $('<li class="smore-paragraph"></li>');
          $li[0].style.textAlign = $para[0].style.textAlign;
          $li[0].style.lineHeight = $para[0].style.lineHeight;
          $para.wrap($li);
          $para.replaceWith($para.contents());
        }
      } else {
        var $list = $(window.cursorTextNode).closest('.smore-paragraph').parent();
        $list.children().each(function() {
          var $this = $(this);
          var $para = $('<div class="smore-paragraph"></div>');
          $para[0].style.textAlign = this.style.textAlign;
          $para[0].style.lineHeight = this.style.lineHeight;
          $this.wrap($para);
          $this.replaceWith($this.contents());
        });
        $list.replaceWith($list.contents());
      }
      set$Cursor(window.cursorTextNode);
    });

    // indentation
    $('#outdent-button').click(function() {
      var $parent = window.$cursor.parent();
      var pad_left = parseInt($parent.css('padding-left'), 10);
      if (pad_left > 0) {
        $parent.css('padding-left', (pad_left - 48));
      }
    });

    $('#indent-button').click(function() {
      var $parent = window.$cursor.parent();
      if ($parent.width() > 48) {
        var pad_left = parseInt($parent.css('padding-left'), 10);
        $parent.css('padding-left', (pad_left + 48));
      }
    });

    // init cursor
    window.$cursor = $('<span class="smore-char char cursor">&#8203;</span>').css({'position': 'absolute'});
    $('body').append(window.$cursor);

    var $pages = $('#document-editor-pages .page');
    if ($pages.length) {
      var paragraph = $pages.find('.smore-paragraph').first()[0];
      var textnode = getFirstTextNode(paragraph);

      window.cursorTextNode = textnode;
      window.cursorOffset = 0;
      setCursorTextNode();
    } else {
      var $page = $('<div class="page" style="width: 8.5in; height: 11in; padding: 1in;"></div>');
      var $para = $('<div class="smore-paragraph"></div>').css({'text-align': 'left', 'line-height': 1});
      var $line = $('<div class="smore-line"></div>');
      var $word = $('<span class="smore-wordnode"></span>').css({'font-family': 'Arial', 'font-size': '24px', 'font-weight': 'normal', 'font-style': 'normal', 'text-decoration': 'none'});
      var $nbsp = $('<span class="smore-nbsp">&nbsp;</span>');

      $('#document-editor-pages').append($page.append($para.append($line.append($word.append($nbsp)))));

      window.cursorTextNode = $nbsp.contents()[0];
      window.cursorOffset = 0;
      setCursorTextNode();
    }

    // cursor blink when the document is in focus
    $('#document-editor').focusin(function() {
      window.focusin = true;
      window.$cursor.addClass('blink-1s');
    });
    $('#document-editor').focusout(function() {
      window.focusin = false;
      window.$cursor.removeClass('blink-1s');
    });

    $('#document-editor').mousedown(function() {
      update_selection();
    });
    $('#document-editor').mouseup(function() {
      update_selection();
    });
    $('#document-editor').mousemove(function() {
      if (window.focusin) { update_selection(); }
      // TODO scroll page when user drags cursor to select text over or under current window
    });
  }
});

function format_selection(property, value) {
  var sel = window.getSelection();
  var position = sel.anchorNode.compareDocumentPosition(sel.focusNode);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
    console.log("Left-to-right selection");
  } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
    console.log("Right-to-left selection");
  } else {
    console.log("only one node selected");
    if (sel.anchorOffset < sel.focusOffset) {
      console.log("Left-to-right selection");
    } else {
      console.log("Right-to-left selection");
    }
  }
  //$(getSelectedChars()).css(property, value); // TODO fix
  window.$cursor.css(property, value);
}

function getLastTextNode(node) {
  if (node.nodeType == Node.TEXT_NODE) {
    return node;
  } else {
    var childnodes = node.childNodes;
    for (i = (childnodes.length-1); i >= 0; i--) {
      var textnode = getLastTextNode(childnodes[i]);
      if (textnode) return textnode;
    }
  }
}

function getFirstTextNode(node) {
  if (node.nodeType == Node.TEXT_NODE) {
    return node;
  } else {
    var childnodes = node.childNodes;
    for (i = 0; i < childnodes.length; i++) {
      var textnode = getFirstTextNode(childnodes[i]);
      if (textnode) return textnode;
    }
  }
}

function prevTextNode(node) {
  var textnode;

  var previous = node;
  while ((previous = previous.previousSibling) && !textnode) {
    textnode = getLastTextNode(previous);
  }

  var parentnode = node;
  while ((parentnode = parentnode.parentNode) && !textnode && parentnode.id != 'document-editor-pages') {
    previous = parentnode;
    while ((previous = previous.previousSibling) && !textnode) {
      textnode = getLastTextNode(previous);
    }
  }

  return textnode;
}

function nextTextNode(node) {
  var textnode;

  var next = node;
  while ((next = next.nextSibling) && !textnode) {
    textnode = getFirstTextNode(next);
  }

  var parentnode = node;
  while ((parentnode = parentnode.parentNode) && !textnode && parentnode.id != 'document-editor-pages') {
    next = parentnode;
    while ((next = next.nextSibling) && !textnode) {
      textnode = getFirstTextNode(next);
    }
  }

  return textnode;
}

function move_cursor_left() {
  var selected_chars = getSelectedChars();
  if (selected_chars.length) {
    // set the cursor here
    collapse_selected();
  } else {
    var moveto;
    if (window.cursorOffset < 1) {
      moveto = prevTextNode(window.cursorTextNode);
      if (moveto) {
        window.cursorTextNode = moveto;
        window.cursorOffset = window.cursorTextNode.length;
      } else {
        return; // at the beginning of the text node and nothing to the left.. just return
      }
    }
    window.cursorOffset -= 1;
    if (window.cursorOffset > 0) {
      moveto = window.cursorTextNode.splitText(window.cursorOffset);
    } else {
      moveto = window.cursorTextNode;
    }
    set$Cursor(moveto);
    window.cursorTextNode.parentElement.normalize();
  }
}

function move_cursor_right() {
  var selected_chars = getSelectedChars();
  if (selected_chars.length) {
    // set the cursor here
    collapse_selected();
  }

  var moveto;
  if (window.cursorOffset + 1 == window.cursorTextNode.length) {
    moveto = nextTextNode(window.cursorTextNode);
    if (moveto) {
      window.cursorTextNode = moveto;
      window.cursorOffset = -1;
    } else {
      return; // at the end of the text node and nothing to the right.. just return
    }
  }
  window.cursorOffset += 1;
  if (window.cursorOffset > 0) {
    moveto = window.cursorTextNode.splitText(window.cursorOffset);
  } else {
    moveto = window.cursorTextNode;
  }
  set$Cursor(moveto);
  window.cursorTextNode.parentElement.normalize();
}

function prevOfClass($tag, classname) {
  var selector = '.' + classname;

  var $previous = $tag.prev(selector);
  var $parent = $tag.parent();

  while (!$previous.length && $parent.length && $parent.attr('id') != "document-editor") {
    $parent.prevAll().each(function(index, element) {
      var $found = $(element).find(selector);
      if ($found.length) {
        $previous = $found.last();
        return false;
      }
    });
    $parent = $parent.parent();
  }

  return $previous;
}

function nextOfClass($tag, classname) {
  var selector = '.' + classname;

  var $next = $tag.next(selector);
  var $parent = $tag.parent();

  while (!$next.length && $parent.length && $parent.attr('id') != "document-editor") {
    $parent.nextAll().each(function(index, element) {
      var $found = $(element).find(selector);
      if ($found.length) {
        $next = $found.first();
        return false;
      }
    });
    $parent = $parent.parent();
  }

  return $next;
}

function move_cursor_up() {
  if (getSelectedChars().length) { move_cursor_left(); }

  var $curr_line = $(window.cursorTextNode).closest('.smore-line');
  var $prev_line = prevOfClass($curr_line, 'smore-line');
  var textnode;

  if (window.cursorOffset > 0) {
    textnode = window.cursorTextNode.splitText(window.cursorOffset);
  } else {
    textnode = window.cursorTextNode;
  }

  var range = document.createRange();
  range.selectNodeContents(textnode);
  var rects = range.getClientRects();
  var pos_left = rects[0].left;
  textnode.parentNode.normalize();

  matchClickToWord($prev_line, {pageX: pos_left})
}

function move_cursor_down() {
  if (getSelectedChars().length) { move_cursor_right(); }

  var $curr_line = $(window.cursorTextNode).closest('.smore-line');
  var $next_line = nextOfClass($curr_line, 'smore-line');
  var textnode;

  if (window.cursorOffset > 0) {
    textnode = window.cursorTextNode.splitText(window.cursorOffset);
  } else {
    textnode = window.cursorTextNode;
  }

  var range = document.createRange();
  range.selectNodeContents(textnode);
  var rects = range.getClientRects();
  var pos_left = rects[0].left;
  textnode.parentNode.normalize();

  matchClickToWord($next_line, {pageX: pos_left})
}

function set_format_vals() {
  // font-family
  var font_family = window.$cursor.css('font-family').replace(/^'|'$/g, '');
  $('#font-fam-select button span').html(font_family);

  // font-size
  var font_size = window.$cursor.css('font-size').replace(/px/g, '');
  $('#font-size-select button span').html(font_size);

  // font-weight
  if (window.$cursor.css('font-weight') == 'bold') {
    $('#bold-checkbox')[0].checked = true;
  } else {
    $('#bold-checkbox')[0].checked = false;
  }

  // font-style
  if (window.$cursor.css('font-style') == 'italic') {
    $('#italic-checkbox')[0].checked = true;
  } else {
    $('#italic-checkbox')[0].checked = false;
  }

  // text-decoration
  if (window.$cursor.css('text-decoration') == 'underline') {
    $('#underline-checkbox')[0].checked = true;
  } else {
    $('#underline-checkbox')[0].checked = false;
  }

  var $para = $(window.cursorTextNode).closest('.smore-paragraph');

  // text-align
  var align = $para.css('text-align');
  $("input:radio[name ='align']").val([align]);

  // line-height
  var line_height = $para[0].style.lineHeight;
  if (line_height == '1') {
    line_height = 'Single';
  } else if (line_height == '2') {
    line_height = 'Double';
  }
  $('#line-height-select button span').html(line_height);

  var ol_bool = false;
  var ul_bool = false;
  if ($para[0].tagName == "LI") {
    if ($para.parent()[0].tagName == "OL") { ol_bool = true; }
    else if ($para.parent()[0].tagName == "UL") { ul_bool = true; }
  }
  $('#ol-checkbox')[0].checked = ol_bool;
  $('#ul-checkbox')[0].checked = ul_bool;
}

function saveChanges() {
  clearTimeout(window.timer);
  $('#doc-saved-at').html("Saving...");
  window.timer = setTimeout(updateDocument, 1500);
}

function updateDocument() {
  $.ajax({
    type: "PUT",
    dataType: 'json',
    url: window.document_url,
    data: { document: { body: $('#document-editor-pages').html() } }
  })
    .done(function() {
      $('#doc-saved-at').html("All changes saved " + date_to_time_str(new Date()));
    })
    .fail(function() {
      $('#doc-saved-at').html("Could not connect to server");
    });
}

function scroll_to_cursor() {
  var $body = $('body');
  var cursor_top = window.$cursor.offset().top;
  var cursor_bottom = cursor_top + window.$cursor.outerHeight(true);
  var scroll_top = $body.scrollTop();
  var scroll_bottom = scroll_top + $body.outerHeight(true);

  // adjust scrollTop if the cursor is outside of the window
  if (cursor_bottom > scroll_bottom) {
    $body.animate({
      scrollTop: (scroll_top + window.$cursor.css('line-height').replace('px', '') * 2)
    }, 200);
  } else if (cursor_top < scroll_top) {
    $body.animate({
      scrollTop: (scroll_top - window.$cursor.css('line-height').replace('px', '') * 2)
    }, 200);
  }
}

/* ---------- Dropdowns ---------- */
$(document).on('page:change', function() {
  $('.drop-button').click(function() {
    var $li = $(this).next();
    $('.dropdown-list').not($li).hide();
    $li.toggle();
    return false;
  });

  $(document).click(function() {
    $('.dropdown-list').hide();
  });
});
