/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

$(document).ready(function () {
  window.GOVUKFrontend.initAll()

  $('#summaryToggle').click(function () {
    // The click handler will decide whether the toggle should "show"/"hide" and set the cookie.
    var closed = $('.grantSummary').is(':hidden')
    if (closed) {
      $('.grantSummary').show()
      $('#summaryToggle').html('<a href="#">Hide grant details</a><span class="govuk-accordion__icon hidden"></span>')
    }
    else {
      $('.grantSummary').hide()
      $('#summaryToggle').html('<a href="#">Show grant details</a><span class="govuk-accordion__icon"></span>')
    }

    setCookie('showSummary', closed, 365)
  });

  // The initial load event will try and pull the cookie to see if the toggle is "open"
  var openToggle = getCookie('showSummary')
  if (openToggle === 'true') {
    $('.grantSummary').show()
    $('#summaryToggle').html('<a href="#">Hide grant details</a><span class="govuk-accordion__icon hidden"></span>')
  }
  else {
    $('.grantSummary').hide()
    $('#summaryToggle').html('<a href="#">Show grant details</a><span class="govuk-accordion__icon"></span>')
  }
});

function setCookie(c_name, value, exdays) {
  var exdate = new Date()
  exdate.setDate(exdate.getDate() + exdays)
  var c_value = escape(value) + ((exdays == null) ? '' : '; expires=' + exdate.toUTCString())
  document.cookie = c_name + '=' + c_value
}

function getCookie(c_name) {
  var i, x, y, ARRcookies = document.cookie.split(';')
  for (i = 0; i < ARRcookies.length; i++) {
    x = ARRcookies[i].substr(0, ARRcookies[i].indexOf('='))
    y = ARRcookies[i].substr(ARRcookies[i].indexOf('=') + 1)
    x = x.replace(/^\s+|\s+$/g, '')
    if (x == c_name) {
      return unescape(y)
    }
  }
}