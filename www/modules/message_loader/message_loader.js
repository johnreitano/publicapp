angular.module('Publicapp.messageLoader', [])

.factory('MessageLoader', function(Fireb) {

  var load = function(callback) {

    var signedInUserRef = Fireb.ref.child("users").child(Fireb.signedInUserId());
    var feedDestination = signedInUserRef.child("feedMessageStubs");

    signedInUserRef.child("listeneeStubs").on("value", function(snapshot) {
      var sourceUserIds = _.union(_.keys(snapshot.val()), [Fireb.signedInUserId()]);

      _.each(sourceUserIds, function(sourceUserId) {
        var sourceUser = Fireb.ref.child("users").child(sourceUserId);
        sourceUser.child("profileMessageStubs").orderByChild("createdAt").limitToLast(50).on("child_added", function(snapshot) {
          var message = snapshot.val();
          var messageId = snapshot.key();
          feedDestination.child(messageId).set({createdAt: message.createdAt});
        });
      });
    });
  };

  return {
    load: load
  };

})

;


