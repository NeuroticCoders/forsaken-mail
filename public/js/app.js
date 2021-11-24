/**
 * Created by Hongcai Deng on 2015/12/29.
 */

$(function(){
  $('.ui.modal')
    .modal()
  ;

  var clipboard = new Clipboard('.copyable');

  $customShortId = $('#customShortid');
  $shortId = $('#shortid');
  $customTheme = 'check';
  $placeholder_old = 'Please wait for a temporary mailbox to be allocated';
  $placeholder_new = 'Please enter the email account without suffix';
  $customShortId.on('click',function() {
    var self = $(this);
    var editEnable = true;
    $shortId.prop('disabled', false);
    if(self.hasClass('edit')) {
      $shortId.val('');
      self.removeClass('edit');
      self.toggleClass($customTheme);
      $shortId.prop('placeholder', $placeholder_new);
    } else {
      $shortId.prop('disabled', true);
      self.removeClass('check');
      self.toggleClass('edit');
      $shortId.prop('placeholder',$placeholder_old);
      $mailUser = $shortId.val();
      var mailaddress = $mailUser + '@' + location.hostname;
      setMailAddress($mailUser);
      $shortId.val(mailaddress);
      window.location.reload();
    }
  });
  
  
  $maillist = $('#maillist');

  $maillist.on('click', 'tr', function() {
    var mail = $(this).data('mail');
    $('#mailcard .header').text(mail.headers.subject || 'no subject');
    $('#mailcard .content:last').html(mail.html);
    $('#mailcard i').click(function() {
      $('#raw').modal('show');
    });
    $('#raw .header').text('RAW');
    $('#raw .content').html($('<pre>').html($('<code>').addClass('language-json').html(JSON.stringify(mail, null, 2))));
    Prism.highlightAll();
  });

  var socket = io();

  var setMailAddress = function(id) {
    localStorage.setItem('shortid', id);
    var mailaddress = id + '@' + location.hostname;
    $('#shortid').val(mailaddress).parent().siblings('button').find('.mail').attr('data-clipboard-text', mailaddress);
  };

  $('#refreshShortid').click(function() {
    socket.emit('request shortid', true);
  });

  socket.on('connect', function() {
    if(('localStorage' in window)) {
      var shortid = localStorage.getItem('shortid');
      if(!shortid) {
        socket.emit('request shortid', true);
      }
      else {
        socket.emit('set shortid', shortid);
      }
    }
  });

  socket.on('shortid', function(id) {
    setMailAddress(id);
  });

  socket.on('mail', function(mail) {
    if(('Notification' in window)) {
      if(Notification.permission === 'granted') {
        new Notification('New mail from ' + mail.headers.from);
      }
      else if(Notification.permission !== 'denied') {
        Notification.requestPermission(function(permission) {
          if(permission === 'granted') {
            new Notification('New mail from ' + mail.headers.from);
          }
        })
      }
    }
    $tr = $('<tr>').data('mail', mail);
    $tr
      .append($('<td>').text(mail.headers.from))
      .append($('<td>').text(mail.headers.subject || 'no subject'))
      .append($('<td>').text((new Date(mail.headers.date)).toLocaleTimeString()));
    $maillist.prepend($tr);
  });
});
