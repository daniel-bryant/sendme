$(document).on('page:change', function() {
  $('.bottom-tooltip').tooltip({placement: 'bottom'});
});

// convert Date to string and return in the format "12:34 pm"
function date_to_time_str(date) {
  var hours = date.getHours();
  var period = (hours < 12 ? 'am' : 'pm');
  hours = (hours % 12) || 12;
  var minutes = date.getMinutes();
  minutes = (minutes < 10) ? ('0' + minutes) : minutes;

  return hours + ':' + minutes + ' ' + period;
}
