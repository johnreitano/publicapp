angular.module('Publicapp.feedLoader', [])

.factory('FeedLoader', function () {

  var load = function(fireBaseRef, signedInUserId) {
    var signedInUserRef = fireBaseRef.child("users").child(signedInUserId);
    var feedDestination = signedInUserRef.child("feedMessageStubs");

    signedInUserRef.child("listeneeStubs").on("value", function(snapshot) {
      var sourceUserIds = _.union(_.keys(snapshot.val()), [signedInUserId]);

      _.each(sourceUserIds, function(sourceUserId) {
        var feedSource = fireBaseRef.child("users").child(sourceUserId).child("profileMessageStubs");
        feedSource.limitToLast(50).on("child_added", function(snapshot) {
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


