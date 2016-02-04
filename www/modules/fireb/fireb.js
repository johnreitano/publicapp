angular.module('Publicapp.fireb', [])

.factory('Fireb', function (FeedLoader) {

  var _ref = null;
  var _signedInUserId = null;
  var _signedInUser = null;

  function signedIn() {
    return !!_signedInUserId;
  };

  function signedInUserId() {
    return _signedInUserId;
  };

  function signedInUser() {
    return _signedInUser;
  };

  ionic.Platform.ready(function() {
    _ref = new Firebase("https://publicapp-dev.firebaseio.com");

    _ref.onAuth(function(authData) {
      if (authData) {
        console.log("Authenticated with uid:", authData.uid);
        _signedInUserId = authData.uid;
        _ref.child("users").child(_signedInUserId).on("value", function(snapshot) {
          _signedInUser = snapshot.val();
          FeedLoader.load(_ref, _signedInUserId);
        });
      } else {
        console.log("Client unauthenticated.")
        _signedInUserId = null;
        _signedInUserUser = null;
        // TODO: detach on() hook above
      }
    });
  });

  return {
    ref: _ref,
    signedIn: signedIn,
    signedInUserId: signedInUserId,
    signedInUser: signedInUser
  };

})

;


