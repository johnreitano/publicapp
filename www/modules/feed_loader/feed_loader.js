angular.module('Publicapp.feedLoader', [])

.factory('FeedLoader', function () {

  var load = function(fireBaseRef, signedInUserId) {
    if (!signedInUserId) {
      return;
    }
    var signedInUserRef = fireBaseRef.child("users").child(signedInUserId);
    var feedDestination = signedInUserRef.child("feedMessages");

    signedInUserRef.child("listenees").on("value", function(snapshot) {
      var sourceUserIds = _.union(_.keys(snapshot.val()), [signedInUserId]);

      _.each(sourceUserIds, function(sourceUserId) {
        var feedSource = fireBaseRef.child("users").child(sourceUserId).child("profileMessages");
        feedSource.limitToLast(50).on("child_added", function(snapshot) {
          var message = snapshot.val();
          var messageId = snapshot.key();
          feedDestination.child(messageId).set(message);
        });
      });
    });
  };

  return {
    load: load
  }

})

;


