$(document).on('click', '.page', function(event) {
  alert("page clicked");
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
    window.document_url = '/documents/' + $('#hidden-body').data().id;

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
          set_cursor_vals();
          save_changes();
          event.preventDefault();
          break;
        case 37: // left
          move_cursor_left();
          set_cursor_vals();
          event.preventDefault();
          break;
        case 38: // up
          move_cursor_up();
          set_cursor_vals();
          event.preventDefault();
          break;
        case 39: // right
          move_cursor_right();
          set_cursor_vals();
          event.preventDefault();
          break;
        case 40: // down
          move_cursor_down();
          set_cursor_vals();
          event.preventDefault();
          break;
        default:
          // ignore
      }
    });

    // font select
    $('#font-select li').click(function() {
      $('#font-select button span').html($(this).html());
    });

    // text-align
    $("input[name=align]:radio").change(function () {
      window.$cursor.parent().css('text-align', $(this).val())
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
          $para.wrap("<li />");
          $para.parent().css($para.css(['text-align', 'min-height']));
          $para.replaceWith($para.contents());
        }
      } else {
        var $list = window.$cursor.parent().parent();
        $list.children().each(function() {
          var $this = $(this);
          $this.wrap( $("<div />").css($this.css(['text-align', 'min-height', 'font-weight', 'font-style', 'text-decoration'])) );
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
          $para.wrap("<li />");
          $para.parent().css($para.css(['text-align', 'min-height']));
          $para.replaceWith($para.contents());
        }
      } else {
        var $list = window.$cursor.parent().parent();
        $list.children().each(function() {
          var $this = $(this);
          $this.wrap( $("<div />").css($this.css(['text-align', 'min-height', 'font-weight', 'font-style', 'text-decoration'])) );
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

    window.$cursor = $('<span id="cursor" style="width: 2px; height: 24px; margin-right: -2px; background-color: black; display: inline-block; vertical-align: middle;"></span>');
    // cursor blink when the document is in focus
    $('#document-editor').focusin(function() { window.$cursor.addClass('blink-1s'); });
    $('#document-editor').focusout(function() { window.$cursor.removeClass('blink-1s'); });

    var $paragraphs = $('#page1 .para');
    if ($paragraphs.length) {
      $paragraphs.first().prepend(window.$cursor);
    } else {
      var $new_para = $('<div class="para" style="font-size: 24px; min-height:24px; font-weight:normal; font-style:normal; text-decoration:none; text-align:left;"></div>');
      $('#page1').prepend($new_para);
      $new_para.prepend(window.$cursor);
    }

    set_cursor_vals();
  }
});

function handle_enter_keypress() {
  var $parent = window.$cursor.parent();

  // if the user presses "Enter" while in an empty list item
  if ($parent[0].tagName == "LI" && $parent.contents().length == 1) {
    // create a normal paragraph div
    var $new_para = $("<div />").css($parent.css(['text-align', 'min-height'])).append($parent.contents());
    var pl = $parent.prev().length;
    var nl = $parent.next().length;
    if (pl && nl) {
      // we are in the middle of a list, can't exit the list here
      $parent.after($new_para);
    } else if (pl) {
      // we are at the end of a list, exit the ul/ol and place before
      $parent.parent().after($new_para);
    } else if (nl) {
      // we are at the beginning of a list, exit the ul/ol and place after
      $parent.parent().before($new_para);
    }
    $parent.remove();
    $('#ol-checkbox')[0].checked = false;
    $('#ul-checkbox')[0].checked = false;
  } else {
    // create a copy of the current div and append the new div after the current
    var $clone = $parent.clone().empty();
    $clone.append(window.$cursor.nextAll().andSelf());
    $clone.css(make_format_obj());
    $parent.after($clone);
  }
}

function make_format_obj() {
  var size = $('#font-select button span').html() + 'px';
  var weight = $('#bold-checkbox')[0].checked ? 'bold' : 'normal';
  var style = $('#italic-checkbox')[0].checked ? 'italic' : 'normal';
  var deco = $('#underline-checkbox')[0].checked ? 'underline' : 'none';
  return {'font-size': size, 'font-weight': weight, 'font-style': style, 'text-decoration': deco};
}

function handle_backspace() {
  if (window.$cursor.prev().length) {
    window.$cursor.prev().remove();
    return;
  }

  var $parent = window.$cursor.parent();
  if ($parent.prev().length) {
    $parent.prev().append($parent.contents());
    $parent.remove();
  }
}

function move_cursor_left() {
  // if there is a previous character, move to the left of it and return
  if (window.$cursor.prev().length) {
    window.$cursor.prev().before(window.$cursor);
    return;
  }

  // if not, check if there's anything before the current (div or li) container
  $parent = window.$cursor.parent();
  $moveto = $parent.prev();
  if (!($moveto.length) && $parent[0].tagName == "LI") {
    $moveto = $parent.parent().prev();
  }

  if ($moveto.length) {
    if ($moveto[0].tagName == "OL" || $moveto[0].tagName == "UL") {
      $moveto = $moveto.children().last();
    }
    $moveto.append(window.$cursor);
  }
}

function move_cursor_right() {
  // if there a a next character, move to the right of it and return
  if (window.$cursor.next().length) {
    window.$cursor.next().after(window.$cursor);
    return;
  }

  // if not, check if there's anything after the current (div or li) container
  $parent = window.$cursor.parent();
  $moveto = $parent.next();
  if (!($moveto.length) && $parent[0].tagName == "LI") {
    $moveto = $parent.parent().next();
  }

  if ($moveto.length) {
    if ($moveto[0].tagName == "OL" || $moveto[0].tagName == "UL") {
      $moveto = $moveto.children().first();
    }
    $moveto.prepend(window.$cursor);
  }
}

function move_cursor_up() {
  var $prev = window.$cursor.prev();
  var top = window.$cursor.position().top;
  var left = window.$cursor.position().left;

  while ($prev.length) {
    // go backwards until we find one ABOVE the cursor
    if ($prev.position().top < top) break;
    $prev = $prev.prev();
  }

  while ($prev.length) {
    // go backwards until we find one to the left of the cursor
    if ($prev.position().left <= left) break;
    $prev = $prev.prev();
  }

  if ($prev.length) $prev.before(window.$cursor);
}

function move_cursor_down() {
  var $next = window.$cursor.next();
  var top = window.$cursor.position().top;
  var left = window.$cursor.position().left;

  while ($next.length) {
    // go backwards until we find one ABOVE the cursor
    if ($next.position().top > top) break;
    $next = $next.next();
  }

  while ($next.length) {
    // go backwards until we find one to the left of the cursor
    if ($next.position().left >= left) break;
    $next = $next.next();
  }

  if ($next.length) $next.before(window.$cursor);
}

function set_cursor_vals() {
  var $prev, $next;
  if ( ($prev = window.$cursor.prev()).length ) {
    set_cursor_with_tag($prev);
  } else if ( ($next = window.$cursor.next()).length ) {
    set_cursor_with_tag($next);
  } else {
    set_cursor_with_tag(window.$cursor.parent());
  }
}

function set_cursor_with_tag($tag) {
  // font-size
  var font_size = $tag.css('font-size');
  window.$cursor.height(font_size);
  $('#font-select button span').html(font_size);

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

  var $parent = window.$cursor.parent();

  // text-align
  var align = $parent.css('text-align');
  $("input:radio[name ='align']").val([align]);

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
  var $prev = window.$cursor.prev();
  var $parent = window.$cursor.parent();
  window.$cursor.detach();

  var body = $('#page1').html().trim();

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

  if ($prev.length) {
    $prev.after(window.$cursor);
  } else {
    $parent.prepend(window.$cursor);
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
