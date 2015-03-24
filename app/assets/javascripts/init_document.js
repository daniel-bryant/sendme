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
