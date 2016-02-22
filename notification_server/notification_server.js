var throng = require('throng');
var Firebase = require("firebase");
var _ = require('underscore');
var s = require('underscore.string');

throng(start, { workers: 1 });

function start() {
  console.log('worker started');

  var ref = new Firebase("https://publicapp-dev.firebaseio.com/");

  ref.child("users").on("child_added", function(snapshot) {
    var user = snapshot.val();
    if ((!user.authProvider || user.authProvider == "none") && !user.sentProfileCreationNotification && !s.isBlank(user.email)) {
      console.log("user " + user.username + " needs an email");

      // send email here...

      // set user.sentProfileCreationNotification to true here...

    }
  });

  process.on('SIGTERM', function() {
    console.log('exiting');
    process.exit();
  });
}

