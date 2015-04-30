function paginate_page($page) {
  var height = $page.height();
  var top_padding = ($page.innerHeight() - height)/2;
  var page_bottom = $page.offset().top + top_padding + height;

  $page.contents().each(function(i) {
    // if the bottom of this element is beyond the page bottom
    if (($(this).offset().top + $(this).outerHeight(true)) > page_bottom) {
      var $new_page = $('<div class="page" style="width: 8.5in; height: 11in; padding: 1in;"></div>');
      $(this).nextAll().andSelf().appendTo($new_page);
      $page.after($new_page);
      paginate_page($new_page);
      return false;
    }
  });
}

function init_document() {
  paginate_page( $('#page1') );
}

function push_words_down($page) {
  var height = $page.height();
  var top_padding = ($page.innerHeight() - height)/2;
  var page_bottom = $page.offset().top + top_padding + height;

  var $new_page;
  $($page.contents().get().reverse()).each(function() {
    var $this = $(this);
    if (($this.offset().top + $this.outerHeight(true)) > page_bottom) {
      $new_page = $new_page || $page.next();
      if (!$new_page.length) {
        $new_page = $('<div class="page" style="width: 8.5in; height: 11in; padding: 1in;"></div>');
        $page.after($new_page);
      }
      $this.prependTo($new_page);
    } else {
      return false;
    }
  });

  if ($new_page) {
    push_words_down($new_page);
  }
}

function pull_words_up($page) {
  var $next_page = $page.next();
  if ($next_page.length) {
    var height = $page.height();
    var top_padding = ($page.innerHeight() - height)/2;
    var page_bottom = $page.offset().top + top_padding + height;

    $next_page.contents().each(function() {
      var $this = $(this);
      $this.appendTo($page);
      if (($this.offset().top + $this.outerHeight(true)) > page_bottom) {
        $this.prependTo($next_page);
        pull_words_up($next_page);
        return false;
      }
    });
  }
}
