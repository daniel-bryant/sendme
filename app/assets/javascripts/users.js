$(function() {
  var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  $('.doc-time').each(function() {
    var $this = $(this);
    var current_date = new Date();
    var doc_date = new Date(parseInt($this.data().time, 10));

    if (doc_date.getYear() == current_date.getYear()) {
      if (doc_date.getDate() == current_date.getDate() && doc_date.getMonth() == current_date.getMonth()) {
        $this.html(date_to_time_str(doc_date));
      } else {
        $this.html(monthNames[doc_date.getMonth()] + ' ' + doc_date.getDate());
      }
    } else {
      $this.html(monthNames[doc_date.getMonth()] + ' ' + doc_date.getDate() + ', ' + doc_date.getFullYear());
    }
  });
});
