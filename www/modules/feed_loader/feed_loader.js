angular.module('Publicapp.feedLoader', [])

.factory('FeedLoader', function () {

  var load = function(fireBaseRef, signedInUserId) {
    if (!signedInUserId) {
      console.log("could not load feed because user not signed in");
      return;
    }

    var signedInUserRef = fireBaseRef.child("users").child(signedInUserId);
    var feedDestination = signedInUserRef.child("feedMessageStubs");

    signedInUserRef.child("listeneeStubs").on("value", function(snapshot) {
      var sourceUserIds = _.union(_.keys(snapshot.val()), [signedInUserId]);

      _.each(sourceUserIds, function(sourceUserId) {
        var sourceUser = fireBaseRef.child("users").child(sourceUserId);
        sourceUser.child("profileMessageStubs").limitToLast(50).on("child_added", function(snapshot) {
          var message = snapshot.val();
          var messageId = snapshot.key();
          feedDestination.child(messageId).set({createdAt: message.createdAt});
        });
      });
    });
  };

  return {
    load: load
  }

})

;


