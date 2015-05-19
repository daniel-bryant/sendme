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

    var client = new ZeroClipboard( $("#share-clip") );

    client.on( "ready", function( readyEvent ) {
      client.on( "aftercopy", function( event ) {
        $('#share-clip-wrap').attr('title', 'Copied!').tooltip('fixTitle').tooltip('show');
      });
    });
  }

  var $scroll_watch = $('.scroll-watch');

  if ($scroll_watch.length) {
    $(window).scroll(function() {
      if($(this).scrollTop()) {
        $scroll_watch.addClass('scroll-shadow');
      } else {
        $scroll_watch.removeClass('scroll-shadow');
      }
    });
  }
});
