$(document).on('click', '.para span', function(event) {
  var $char = $(this);
  var $next = $char.next();
  // if the click is on the right hand side && there is a char next to this one && it is on the same line
  if (event.pageX > ($char.offset().left + $char.width()/2) && $next.length && $next.position().top == $char.position().top) {
    $char = $next;
  }
  window.$cursor.removeClass('cursor blink-1s');
  $char.addClass('cursor blink-1s');
  window.$cursor = $char;
  set_format_vals();
});

$(document).on("page:before-change", function(){
  ZeroClipboard.destroy();
});

$(document).on('page:change', function() {
  if ($('#share-modal').length) {
    $('#share-link').click(function() {
      $(this).select();
    });
    $('#share-clip-wrap').tooltip({container: 'body'}).on('hidden.bs.tooltip', function() {
      $(this).attr('title', 'Copy to clipboard').tooltip('fixTitle');
    });
    var client = new ZeroClipboard( $("#share-clip") )
    client.on( "ready", function( readyEvent ) {
      client.on( "aftercopy", function( event ) {
        $('#share-clip-wrap').attr('title', 'Copied!').tooltip('fixTitle').tooltip('show');
      });
    });
  }

  if ($('#document-info').length) {
    var $doc_info = $('#document-info');
    $(window).scroll(function() {
      if($(this).scrollTop()) {
        $doc_info.addClass('scroll-shadow');
      } else {
        $doc_info.removeClass('scroll-shadow');
      }
    });
  }

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
          var format = make_format_obj();
          var character = $('<span>' + String.fromCharCode(event.which) + '</span>').css(format);
          window.$cursor.before(character);
          window.$cursor.height(format['font-size']);
      }
      save_changes();
      event.preventDefault();
    });

    // handle keydown
    $(document).on('keydown', '#document-editor', function(event) {
      switch (event.which) {
        case 8: // backspace
          handle_backspace();
          set_format_vals();
          save_changes();
          event.preventDefault();
          break;
        case 37: // left
          move_cursor_left();
          set_format_vals();
          event.preventDefault();
          break;
        case 38: // up
          move_cursor_up();
          set_format_vals();
          event.preventDefault();
          break;
        case 39: // right
          move_cursor_right();
          set_format_vals();
          event.preventDefault();
          break;
        case 40: // down
          move_cursor_down();
          set_format_vals();
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
      window.$cursor = $paragraphs.first().contents().first();
      window.$cursor.addClass('cursor');
    } else {
      var $new_para = $('<div class="para" style="text-align: left; line-height: 1;"></div>');
      var $nbsp_char = $('<span class="nbsp-char" style="font-family:Arimo;font-size:24px;font-weight:normal;font-style:normal;text-decoration:none;">&nbsp;</span>');
      $('#page1').prepend($new_para);
      $new_para.prepend($nbsp_char);
      window.$cursor = $nbsp_char;
      window.$cursor.addClass('cursor');
    }

    // cursor blink when the document is in focus
    $('#document-editor').focusin(function() { window.$cursor.addClass('blink-1s'); });
    $('#document-editor').focusout(function() { window.$cursor.removeClass('blink-1s'); });

    set_format_vals();
  }
});

function format_selection(property, value) {
  var selection = window.getSelection();
  var range = selection.getRangeAt(0);
  var common_ancestor = range.commonAncestorContainer;

  // if we have a single letter selected, it will be a text node
  if (common_ancestor.nodeType == Node.TEXT_NODE) {
    $(common_ancestor).parent().css(property, value);
  } else {
    $(range.commonAncestorContainer).find("span").each(function() {
      if (selection.containsNode(this, true)) {
        $(this).css(property, value);
      }
    });
  }
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
    $parent.append($nbsp_char.clone().removeClass('cursor blink-1s'));
    $parent.after($clone);
  }
}

function make_format_obj() {
  var font = $('#font-fam-select button span').html();
  var size = $('#font-size-select button span').html() + 'px';
  var weight = $('#bold-checkbox')[0].checked ? 'bold' : 'normal';
  var style = $('#italic-checkbox')[0].checked ? 'italic' : 'normal';
  var deco = $('#underline-checkbox')[0].checked ? 'underline' : 'none';
  return {'font-family': font, 'font-size': size, 'font-weight': weight, 'font-style': style, 'text-decoration': deco};
}

function handle_backspace() {
  if (window.$cursor.prev().length) {
    window.$cursor.prev().remove();
    return;
  }

  var $parent = window.$cursor.parent();
  var $parent_prev = $parent.prev();
  if ($parent_prev.length) {
    $parent_prev.contents().last().remove();
    $parent_prev.append($parent.contents());
    $parent.remove();
  }
}

function prev_char($tag) {
  var $moveto = $tag.prev();

  if (!($moveto.length)) {
    var $parent = $tag.parent();
    $moveto = $parent.prev();
    if (!($moveto.length) && $parent[0].tagName == "LI") {
      $moveto = $parent.parent().prev();
    }

    if ($moveto.length) {
      if ($moveto[0].tagName == "OL" || $moveto[0].tagName == "UL") {
        $moveto = $moveto.children().last().children().last();
      } else {
        $moveto = $moveto.children().last();
      }
    }
  }
  return $moveto;
}

function next_char($tag) {
  var $moveto = $tag.next();

  if (!($moveto.length)) {
    var $parent = $tag.parent();
    $moveto = $parent.next();
    if (!($moveto.length) && $parent[0].tagName == "LI") {
      $moveto = $parent.parent().next();
    }

    if ($moveto.length) {
      if ($moveto[0].tagName == "OL" || $moveto[0].tagName == "UL") {
        $moveto = $moveto.children().first().children().first();
      } else {
        $moveto = $moveto.children().first();
      }
    }
  }
  return $moveto;
}

function move_cursor_left() {
  var $moveto = prev_char(window.$cursor);
  if ($moveto.length) {
    window.$cursor.removeClass('cursor blink-1s');
    $moveto.addClass('cursor blink-1s');
    window.$cursor = $moveto;
  }
}

function move_cursor_right() {
  var $moveto = next_char(window.$cursor);
  if ($moveto.length) {
    window.$cursor.removeClass('cursor blink-1s');
    $moveto.addClass('cursor blink-1s');
    window.$cursor = $moveto;
  }
}

function move_cursor_up() {
  var $moveto = window.$cursor;
  var topp = $moveto.position().top;
  var left = $moveto.position().left;
  var $prev = prev_char($moveto);

  var new_top = topp;
  while ($prev.length && !($prev.position().top + $prev.outerHeight(true) < topp)) {
    // go backwards until we find one ABOVE the cursor
    $moveto = $prev;
    $prev = prev_char($prev);
  }

  if ($prev.length) { new_top = $prev.position().top; }

  while ($prev.length && !($prev.position().left <= left) && !($prev.position().top + $prev.outerHeight(true) < new_top)) {
    // go backwards until we find one to the left of the cursor
    $moveto = $prev;
    $prev = prev_char($prev);
  }

  if ($prev.length && !($prev.position().top + $prev.outerHeight(true) < new_top)) { $moveto = $prev; }

  window.$cursor.removeClass('cursor blink-1s');
  $moveto.addClass('cursor blink-1s');
  window.$cursor = $moveto;
}

function move_cursor_down() {
  var $moveto = window.$cursor;
  var bottom = $moveto.position().top + $moveto.outerHeight(true);
  var left = $moveto.position().left;
  var $next = next_char($moveto);

  var new_bottom = bottom;
  while ($next.length && !($next.position().top > bottom)) {
    // go forwards until we find one BELOW the cursor
    $moveto = $next;
    $next = next_char($next);
  }

  if ($next.length) { new_bottom = $next.position().top + $next.outerHeight(true); }

  while ($next.length && !($next.position().left >= left) && !($next.position().top > new_bottom)) {
    // go forwards until we find one to the right of the cursor
    $moveto = $next;
    $next = next_char($next);
  }

  if ($next.length && !($next.position().top > new_bottom)) { $moveto = $next; }

  window.$cursor.removeClass('cursor blink-1s');
  $moveto.addClass('cursor blink-1s');
  window.$cursor = $moveto;
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
  window.$cursor.removeClass('cursor blink-1s');

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

  window.$cursor.addClass('cursor blink-1s');
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
