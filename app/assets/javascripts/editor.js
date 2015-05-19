var STYLE_ATTRIBUTES = ['font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration'];

function init_cursor($char) {
  window.$cursor = $('<span class="char cursor">&#8203;</span>');
  set_to_cursor($char);
}

function set_to_cursor($char) {
  $char.before(window.$cursor);
  // match styles to the new previous char if one exists, else match to the next
  var $prev = window.$cursor.prev();
  var $match_styles = $prev.length ? $prev : $char;
  window.$cursor.css($match_styles.css(STYLE_ATTRIBUTES));
  set_format_vals();
}

$(document).on('mousedown', '#document-editor', function(event) {
  if (this === event.target) {
    var $paras = $(this).find('.para');
    var $paragraph = $paras.first();
    $paras.each(function() {
      if ($(this).offset().top > event.pageY) return false;
      $paragraph = $(this);
    });
    var $char = $paragraph.children('span').closestToOffset({left: event.pageX, top: event.pageY});
    set_to_cursor($char);
  }
});

$(document).on('mousedown', '.page', function(event) {
  if (this === event.target) {
    var $paragraph = $(this).children().first();
    $(this).children('.para').each(function() {
      if ($(this).offset().top > event.pageY) return false;
      $paragraph = $(this);
    });

    var $char = $paragraph.children('span').closestToOffset({left: event.pageX, top: event.pageY});
    set_to_cursor($char);
  }
});

$(document).on('mousedown', '.page .para', function(event) {
  if (this === event.target) {
    var $char = $(this).children('span').closestToOffset({left: event.pageX, top: event.pageY});
    set_to_cursor($char);
  }
});

$(document).on('mousedown', '.page .para span', function(event) {
  var $char = $(this);
  var $next = $char.next();
  // if the click is on the right hand side
  // && there is a char next to this one && it is on the same line
  if (event.pageX > ($char.offset().left + $char.width()/2)
    && $next.length && $next.position().top == $char.position().top) {
    $char = $next;
  }
  set_to_cursor($char);
});

$(document).on('page:change', function() {
  if ($('#document-editor').length) {
    init_document();
  }

  if ($('#document-editor-toolbar').length) {
    // set up variables needed to save documents to the api
    window.timer = null;
    window.document_url = '/documents/' + $('#page1').data().id;

    // handle keypress events (character handling)
    $(document).on('keypress', '#document-editor', function(event) {
      switch (event.which) {
        case 13: // enter
          handle_enter_keypress();
          break;
        default:
          var format = window.$cursor.css(STYLE_ATTRIBUTES);
          var $character = $('<span class="char">' + String.fromCharCode(event.which) + '</span>').css(format);
          window.$cursor.before($character);
          var $next = window.$cursor.next();
          if ($next.hasClass('nbsp-char')) { $next.css(format); }
      }
      push_words_down(window.$cursor.closest('.page'));
      scroll_to_cursor();
      save_changes();
      event.preventDefault();
    });

    // handle keydown
    $(document).on('keydown', '#document-editor', function(event) {
      switch (event.which) {
        case 8: // backspace
          handle_backspace();
          pull_words_up(window.$cursor.closest('.page'));
          scroll_to_cursor();
          save_changes();
          event.preventDefault();
          break;
        case 37: // left
          move_cursor_left();
          scroll_to_cursor();
          event.preventDefault();
          break;
        case 38: // up
          move_cursor_up();
          scroll_to_cursor();
          event.preventDefault();
          break;
        case 39: // right
          move_cursor_right();
          scroll_to_cursor();
          event.preventDefault();
          break;
        case 40: // down
          move_cursor_down();
          scroll_to_cursor();
          event.preventDefault();
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
      window.$cursor.parent().css('text-align', $(this).val())
    });

    // line-height select
    $('#line-height-select li').click(function() {
      $('#line-height-select button span').html($(this).html());
      window.$cursor.parent().css('line-height', $(this).data().value)
    });

    // ordered list
    $('#ol-checkbox').change(function() {
      if ( this.checked ) {
        // creating a ul
        if ($('#ul-checkbox')[0].checked) { // we're already in a ul
          // replace ul with ol
          var $list = window.$cursor.parent().parent();
          var items = $list.contents();
          $list.replaceWith(items);
          items.wrapAll("<ol />");
          $('#ul-checkbox')[0].checked = false;
        } else {
          var $para = window.$cursor.parent();
          $para.wrapAll("<ol />");
          $para.wrap( $('<li class="para"></li>').css($para.css(['text-align', 'line-height'])) );
          $para.replaceWith($para.contents());
        }
      } else {
        var $list = window.$cursor.parent().parent();
        $list.children().each(function() {
          var $this = $(this);
          $this.wrap( $('<div class="para"></div>').css($this.css(['text-align', 'line-height'])) );
          $this.replaceWith($this.contents());
        });
        $list.replaceWith($list.contents());
      }
    });

    // unordered list
    $('#ul-checkbox').change(function() {
      if ( this.checked ) {
        // creating a ul
        if ($('#ol-checkbox')[0].checked) { // we're already in a ol
          // replace ol with ul
          var $list = window.$cursor.parent().parent();
          var items = $list.contents();
          $list.replaceWith(items);
          items.wrapAll("<ul />");
          $('#ol-checkbox')[0].checked = false;
        } else {
          var $para = window.$cursor.parent();
          $para.wrapAll("<ul />");
          $para.wrap( $('<li class="para"></li>').css($para.css(['text-align', 'line-height'])) );
          $para.replaceWith($para.contents());
        }
      } else {
        var $list = window.$cursor.parent().parent();
        $list.children().each(function() {
          var $this = $(this);
          $this.wrap( $('<div class="para"></div>').css($this.css(['text-align', 'line-height'])) );
          $this.replaceWith($this.contents());
        });
        $list.replaceWith($list.contents());
      }
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

    var $paragraphs = $('#page1 .para');
    if ($paragraphs.length) {
      init_cursor($paragraphs.first().contents().first());
    } else {
      var $new_para = $('<div class="para"></div>').css({'text-align': 'left', 'line-height': 1});
      var $nbsp_char = $('<span class="char nbsp-char">&nbsp;</span>').css({'font-family': 'Arial', 'font-size': '24px', 'font-weight': 'normal', 'font-style': 'normal', 'text-decoration': 'none'});
      $('#page1').prepend($new_para);
      $new_para.prepend($nbsp_char);
      init_cursor($nbsp_char);
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
  $(getSelectedChars()).css(property, value);
  window.$cursor.css(property, value);
}

function handle_enter_keypress() {
  var $parent = window.$cursor.parent();

  // if the user presses "Enter" while in an empty list item
  if ($parent[0].tagName == "LI" && $parent.contents().length == 1) {
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
    var $clone = $parent.clone().empty();
    var $nbsp_char = $parent.children('.nbsp-char');
    $clone.append(window.$cursor.nextAll().andSelf());
    $parent.append($nbsp_char.clone());
    $parent.after($clone);
  }
}

function handle_backspace() {
  if (window.$cursor.prev().length) {
    window.$cursor.prev().remove();
    set_to_cursor(window.$cursor.next());
  } else {
    var $parent = window.$cursor.parent();
    var $parent_prev = $parent.prev();
    if ($parent_prev.length) {
      $parent_prev.contents().last().remove();
      $parent_prev.append($parent.contents());
      $parent.remove();
    }
  }

  var $prev = window.$cursor.prev(), $next = window.$cursor.next();
  if ($prev.length && $next.hasClass('nbsp-char')) {
    $next.css($prev.css(STYLE_ATTRIBUTES));
  }
}

function prev_char($tag) {
  var $moveto = $tag.prev();
  var $parent = $tag.parent();

  while (!$moveto.length && $parent.length && $parent.attr('id') != "document-editor") {
    $parent.prevAll().each(function(index, element) {
      var $chars= $(element).find('.char');
      if ($chars.length) {
        $moveto = $chars.last();
        return false;
      }
    });
    $parent = $parent.parent();
  }

  return $moveto;
}

function next_char($tag) {
  var $moveto = $tag.next();
  var $parent = $tag.parent();

  while (!$moveto.length && $parent.length && $parent.attr('id') != "document-editor") {
    $parent.nextAll().each(function(index, element) {
      var $chars= $(element).find('.char');
      if ($chars.length) {
        $moveto = $chars.first();
        return false;
      }
    });
    $parent = $parent.parent();
  }

  return $moveto;
}

function move_cursor_left() {
  var selected_chars = getSelectedChars();
  if (selected_chars.length) {
    set_to_cursor($(selected_chars).first());
    collapse_selected();
  } else {
    var $char = prev_char(window.$cursor);
    if ($char.length) { set_to_cursor($char); }
  }
}

function move_cursor_right() {
  var selected_chars = getSelectedChars();
  if (selected_chars.length) {
    set_to_cursor($(selected_chars).last());
    collapse_selected();
  }
  var $char = next_char(window.$cursor.next());
  if ($char.length) { set_to_cursor($char); }
}

function move_cursor_up() {
  if (getSelectedChars().length) { move_cursor_left(); }
  var $moveto = window.$cursor;
  var bottom = $moveto.position().top + $moveto.height();
  var left = $moveto.position().left;
  var $prev = prev_char($moveto);

  var new_bottom = bottom;
  while ($prev.length && !($prev.position().top + $prev.height() < bottom)) {
    // go backwards until we find one ABOVE the cursor
    $moveto = $prev;
    $prev = prev_char($prev);
  }

  if ($prev.length) { new_bottom = $prev.position().top + $prev.height(); }

  while ($prev.length && !($prev.position().left <= left) && !($prev.position().top + $prev.height() < new_bottom)) {
    // go backwards until we find one to the left of the cursor
    $moveto = $prev;
    $prev = prev_char($prev);
  }

  if ($prev.length && !($prev.position().top + $prev.height() < new_bottom)) { $moveto = $prev; }

  set_to_cursor($moveto);
}

function move_cursor_down() {
  if (getSelectedChars().length) { move_cursor_right(); }
  var $moveto = window.$cursor;
  var bottom = $moveto.position().top + $moveto.height();
  var left = $moveto.position().left;
  var $next = next_char($moveto);

  var new_bottom = bottom;
  while ($next.length && !($next.position().top + $next.height() > bottom)) {
    // go forwards until we find one BELOW the cursor
    $moveto = $next;
    $next = next_char($next);
  }

  if ($next.length) { new_bottom = $next.position().top + $next.height(); }

  while ($next.length && !($next.position().left >= left) && !($next.position().top + $next.height() > new_bottom)) {
    // go forwards until we find one to the right of the cursor
    $moveto = $next;
    $next = next_char($next);
  }

  if ($next.length && !($next.position().top + $next.height() > new_bottom)) { $moveto = $next; }

  set_to_cursor($moveto);
}

function set_format_vals() {
  var $tag = window.$cursor;

  // font-family
  var font_family = $tag.css('font-family').replace(/^'|'$/g, '');
  $('#font-fam-select button span').html(font_family);

  // font-size
  var font_size = $tag.css('font-size').replace(/px/g, '');
  $('#font-size-select button span').html(font_size);

  // font-weight
  if ($tag.css('font-weight') == 'bold') {
    $('#bold-checkbox')[0].checked = true;
  } else {
    $('#bold-checkbox')[0].checked = false;
  }

  // font-style
  if ($tag.css('font-style') == 'italic') {
    $('#italic-checkbox')[0].checked = true;
  } else {
    $('#italic-checkbox')[0].checked = false;
  }

  // text-decoration
  if ($tag.css('text-decoration') == 'underline') {
    $('#underline-checkbox')[0].checked = true;
  } else {
    $('#underline-checkbox')[0].checked = false;
  }

  var $parent = $tag.parent();

  // text-align
  var align = $parent.css('text-align');
  $("input:radio[name ='align']").val([align]);

  // line-height
  var line_height = $parent[0].style.lineHeight;
  if (line_height == '1') {
    line_height = 'Single';
  } else if (line_height == '2') {
    line_height = 'Double';
  }
  $('#line-height-select button span').html(line_height);

  // lists
  var ol_bool = false;
  var ul_bool = false;
  if ($parent[0].tagName == "LI") {
    if ($parent.parent()[0].tagName == "OL") { ol_bool = true; }
    else if ($parent.parent()[0].tagName == "UL") { ul_bool = true; }
  }
  $('#ol-checkbox')[0].checked = ol_bool;
  $('#ul-checkbox')[0].checked = ul_bool;
}

function save_changes() {
  clearTimeout(window.timer);
  $('#doc-saved-at').html("Saving...");
  window.timer = setTimeout(update_document, 1500);
}

function update_document() {
  var $char = window.$cursor.next();
  window.$cursor.remove();

  var body = "";
  $('#page1').nextAll().andSelf().each(function() {
    body += $(this).html().trim();
  });

  $.ajax({
    type: "PUT",
    dataType: 'json',
    url: window.document_url,
    data: { document: { body: body } }
  })
    .done(function() {
      $('#doc-saved-at').html("All changes saved " + date_to_time_str(new Date()));
    })
    .fail(function() {
      $('#doc-saved-at').html("Could not connect to server");
    });

  $char.before(window.$cursor);
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

/* ---------- closestToOffset ---------- */
// http://stackoverflow.com/questions/2337630/find-html-element-nearest-to-position-relative-or-absolute
jQuery.fn.extend({
  closestToOffset: function(offset) {
    var el = null, elOffset, x = offset.left, y = offset.top, distance, dx, dy, minDistance;
    this.each(function() {
      elOffset = $(this).offset();

      if ((x >= elOffset.left) && (x <= elOffset.right) && (y >= elOffset.top) && (y <= elOffset.bottom)) {
        el = $(this);
        return false;
      }

      var offsets = [[elOffset.left, elOffset.top], [elOffset.right, elOffset.top], [elOffset.left, elOffset.bottom], [elOffset.right, elOffset.bottom]];
      for (off in offsets) {
        dx = offsets[off][0] - x;
        dy = offsets[off][1] - y;
        distance = Math.sqrt((dx*dx) + (dy*dy));
        if (minDistance === undefined || distance < minDistance) {
          minDistance = distance;
          el = $(this);
        }
      }
    });
    return el;
  }
});
