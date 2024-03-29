angular.module('Publicapp.fireb', [])

.factory('Fireb', function ($firebaseAuth, $rootScope) {

  var _ref = new Firebase("https://publicapp-production.firebaseio.com");
  var _signedInUser = null;

  function ref() {
    return _ref;
  };

  function signedIn() {
    return !!signedInUserId();
  };

  function signedInUserId() {
    return signedInUser() ? signedInUser().id : undefined;
  };

  function signedInUser() {
    if (!_signedInUser) {
      var signedInUserData = window.localStorage['signedInUserData'];
      if (signedInUserData) {
        _signedInUser = JSON.parse(signedInUserData)
      }
    }
    return _signedInUser;
  };

  function signedInUserRef() {
    return _ref.child("users").child(signedInUserId());
  };

  function doUnauth() {
    _ref.unauth();
    _signedInUser = undefined;
    window.localStorage.removeItem('signedInUserData')
  };

  var _oneTimeAuthCallback = null;

  function doAuth(provider, credentials, callback) {
    _oneTimeAuthCallback = callback;
    var auth = $firebaseAuth(_ref);
    var promise = provider == "password" ? auth.$authWithPassword(credentials) : auth.$authWithOAuthPopup(provider, { scope: 'email'});
    promise.then(function(authData) {
      console.log("Just logged in as:", authData.uid);
      // do nothing: data login info will be saved by onAuth
    }).catch (function(error) {
      console.log("Login Failed!", error);
      var callback = _oneTimeAuthCallback;
      _oneTimeAuthCallback = null;
      callback(error);
    });
  };

  function doOneTimeCallback(error) {
    if (_oneTimeAuthCallback) {
      var callback = _oneTimeAuthCallback;
      _oneTimeAuthCallback = null;
      callback(error);
    }
  };

  var authDataCopy = null;
  _ref.onAuth(function(authData) {
    if (authData) {
      authDataCopy = authData; // need to copy authData into variable so that it is available below
      _ref.child("users").orderByChild("authId").equalTo(authDataCopy.uid).once ("value", function(snapshot) {

        _signedInUser = _.values(snapshot.val())[0];

        if (_signedInUser) {
          window.localStorage['signedInUserData'] = JSON.stringify(_signedInUser);
          $rootScope.$broadcast('signedInUserSet', _signedInUser);
          keepSignedInUserAndFeedFresh();
          doOneTimeCallback();
        } else {

          if (authDataCopy.provider == "password") {
            doOneTimeCallback("could not find user associated with valid auth id" + authDataCopy.uid);
            return;
          }

          var user = {
            authId: authDataCopy.uid,
            authProvider: authDataCopy.provider
          };
          if (authDataCopy.provider == "google") {
            user.name = authDataCopy.google.displayName;
            user.face = authDataCopy.google.profileImageURL;
            user.email = authDataCopy.google.email;
          } else if (authDataCopy.provider == "facebook") {
            user.name = authDataCopy.facebook.displayName;
            user.face = authDataCopy.facebook.profileImageURL;
            user.email = authDataCopy.facebook.email;
          } else {
            error = "unknown provider" + authDataCopy.provider;
            console.log(error);
            doOneTimeCallback(error);
            return;
          }

          createUserObject(user, function(error, newUser) {
            _signedInUser = newUser;
            doOneTimeCallback(error);
          });
        }
      });
    } else {
      // TODO: undo watches in keepSignedInUserAndFeedFresh()
      _signedInUser = undefined;
      window.localStorage.removeItem('signedInUserData')
    }
  });

  function generateFaceUrl(name, username) {
    var colorScheme = _.sample([{
      background: "DD4747",
      foreground: "FFFFFF"
    }, {
      background: "ED6D54",
      foreground: "FFFFFF"
    }, {
      background: "FFBE5B",
      foreground: "FFFFFF"
    }, {
      background: "FFE559",
      foreground: "FFFFFF"
    }]);
    var sourceOfInitials = name;
    if (s.isBlank(sourceOfInitials)) {
      sourceOfInitials = username;
    }
    var firstLetters = sourceOfInitials.match(/\b\w/g);
    var initials = firstLetters[0];
    if (firstLetters.length > 1) {
      initials = initials + firstLetters[firstLetters.length - 1];
    }
    initials = initials.toUpperCase();
    return "https://dummyimage.com/100x100/" + colorScheme.background + "/" + colorScheme.foreground + "&text=" + initials;
  };

  function createUserObject(user, callback) {
    console.log("About to create profile for user with auth id", user.authId);

    if (s.isBlank(user.name) && s.isBlank(user.username)) {
      console.log("user must have a name or username");
      callback("user must have a name or username", null);
      return;
    }

    var newUserRef = _ref.child("users").push();

    var newUser = {
      id: newUserRef.key(),
      authProvider: user.authProvider || "none",
      admin: user.admin ? true : false,
      createdAt: user.createdAt || Date.now(),
      face: s.isBlank(user.face) ? generateFaceUrl(user.name, user.username) : user.face
    };

    if (!s.isBlank(user.name)) {
      newUser.name = user.name.trim().replace(/ +/g, ' ');
      newUser.searchableName = newUser.name.toLowerCase();
    }

    if (s.isBlank(user.username)) {
      newUser.username = '@' + newUser.name.replace(/[^\w_]/g, '');
    } else {
      newUser.username = user.username;
    }

    if (!s.isBlank(user.authId)) {
      newUser.authId = user.authId;
    }
    if (!s.isBlank(user.phone)) {
      newUser.phone = user.phone;
    }

    if (!s.isBlank(user.email)) {
      newUser.email = user.email;
    }

    if (window.localStorage['marketingId']) {
      newUser.marketingId = window.localStorage['marketingId'];
    }

    var preferredUsername = s.isBlank(user.username) ? generateUsername(newUser.name) : user.username;
    findAvailableUsername(preferredUsername, function(availableUsername) {
      // store new user in db
      newUser.username = availableUsername;

      if (!newUser.addedBy) {
        // record the the user who added this new user
        var addedBy = signedIn() ? signedInUser() : newUser;
        newUser.addedBy = _.compactObject({
          id: signedIn() ? signedInUserId() : newUserRef.key(),
          name: addedBy.name,
          username: addedBy.username,
          face: addedBy.face
        });
      }

      newUserRef.setWithPriority(newUser, 0 - newUser.createdAt, function(error) {
        if (error) {
          console.log('error saving profile data for user', newUser, error);
          callback(error, null);
          return
        }
        console.log('successfully saved profile data for user', newUser);
        // TODO: consider adding signed-in-user to listerners of this user
        callback(null, newUser);
      });
    });
  };

  function generateUsername(name) {
    return '@' + (name || '').replace(/[^\w_]/, '').toLowerCase();
  };

  function findAvailableUsername(preferredUsername, callback) {
    preferredUsername = preferredUsername.toLowerCase();
    _ref.child("users").orderByChild("username").startAt(preferredUsername).endAt(preferredUsername + "99999").once("value", function(snapshot) {
      var takenUsernames = _.map(_.values(snapshot.val()), function(user) { return user.username; })
      var suffix = preferredUsername.match(/(\d*$)/)[0];
      while(true) {
        var potentialUsername = preferredUsername.replace(/(\d*$)/, suffix);
        if (takenUsernames.indexOf(potentialUsername) == -1) {
          callback(potentialUsername);
          return;
        }
        suffix = (suffix == "") ? "1" : (parseInt(suffix) + 1).toString();
      }
    });
  };

  function keepSignedInUserAndFeedFresh() {
    signedInUserRef().on("value", function(snapshot) {
      _signedInUser = snapshot.val();
    });

    var feedDestination = signedInUserRef().child("feedMessages");
    signedInUserRef().child("listenees").on("value", function(snapshot) {
      var sourceUserIds = _.compact(_.union(_.keys(snapshot.val()), [signedInUserId()]));
      _.each(sourceUserIds, function(sourceUserId) {
        var feedSource = _ref.child("users").child(sourceUserId).child("profileMessages");
        feedSource.limitToLast(50).on("child_added", function(snapshot) {
          var message = snapshot.val();
          var messageId = snapshot.key();
          feedDestination.child(messageId).setWithPriority(message, 0 - message.createdAt);
        });
      });
    });
  };

  return {
    ref: ref,
    doAuth: doAuth,
    doUnauth: doUnauth,
    signedIn: signedIn,
    signedInUserId: signedInUserId,
    signedInUser: signedInUser,
    signedInUserRef: signedInUserRef,
    createUserObject: createUserObject,
    generateUsername: generateUsername
  };

})

;


