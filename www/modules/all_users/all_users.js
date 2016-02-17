angular.module('Publicapp.allUsers', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider){

    $stateProvider

    .state('app.allUsers', {
      url: "/all-users",
      views: {
        'menuContent': {
          templateUrl: "modules/all_users/all_users.html",
          controller: "AllUsersCtrl as vm"
        }
      }
    })

    ;
}])

.controller('AllUsersCtrl', function($scope, SharedMethods, Fireb, $firebaseArray, $ionicPopup) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  var allUsersRef = Fireb.ref().child("users")
  ctrl.allUsers = $firebaseArray(allUsersRef);

  ctrl.removeEmptyMessages = function() {
    allUsersRef.once("value", function(snapshot) {
      var users = snapshot.val();
      console.log("There are " + _.keys(users).length + " users");
      _.each(users, function(user,userId) {
        _.each(user.profileMessages, function(message, messageId) {
          if (s.isBlank(message.text)) {
            allUsersRef.child(userId).child("profileMessages").child(messageId).remove();
            console.log("Removed profile message " + messageId);
          }
        });
        _.each(user.feedeMessages, function(message, messageId) {
          if (s.isBlank(message.text)) {
            allUsersRef.child(userId).child("feedMessages").child(messageId).remove();
            console.log("Removed feed message " + messageId);
          }
        });
      });
    });
  };

  ctrl.mergeUser = function(targetUsername, sourceUsername) {
    if (sourceUsername == targetUsername) {
      console.log("source cannot equal target");
      return;
    }

    allUsersRef.once("value", function(snapshot) {

      var users = snapshot.val();
      console.log("There are " + _.keys(users).length + " users");

      var targetUser = _.detect(users, function(user, userId) { return user.username == targetUsername; });
      if (!targetUser) {
        console.log("unable to find user with username ", targetUsername);
        return;
      }

      var sourceUser = _.find(users, function(user, userId) { return user.username == sourceUsername; });
      if (!sourceUser) {
        console.log("unable to find user with username ", sourceUsername);
        return;
      }

      // save a copy of source user
      var deepCopyOfSourceUser = JSON.parse(JSON.stringify(sourceUser))
      targetUserRef.child("mergedUsers").child(sourceUser.id).setWithPriority(deepCopyOfSourceUser, 0 - Date.now());

      // copy source user's profile messages to target user
      var targetUserStub = _.pick(targetUser, ["id", "name", "username", "face"]);

      // replace source user info with target user info in all feeds
      _.each(users, function(user) {
        var userRef = allUsersRef.child(user.id);

        if (user.addedBy.id == sourceUser.id) {
          userRef.child("addedBy").set(targetUserStub);
        }

        function adjustMessages(profileOrFeedMessages) {
          _.each(user[profileOrFeedMessages], function(message, messageId) {
            var re = new RegExp(sourceUsername, 'g');
            if (re.test(message.text)) {
              var newText = message.text.replace(re, targetUsername);
              userRef.child(profileOrFeedMessages).child(messageId).child("text").set(newText);
            }
            if (message.author.id == sourceUser.id) {
              userRef.child(profileOrFeedMessages).child(messageId).child("author").set(targetUserStub);
            }
            if (message.subject.id == sourceUser.id) {
              userRef.child(profileOrFeedMessages).child(messageId).child("subject").set(targetUserStub);
            }
          });
        };

        adjustMessages("feedMessages");
        adjustMessages("profileMessages");

        function adjustListenersOrListenees(listenersOrListenees) {
          _.each(user[listenersOrListenees], function(listenerOrListenee) {
            if (listenerOrListenee.id == sourceUser.id) {
              userRef.child(listenersOrListenees).child(targetUser.id).setWithPriority(
                _.extend({addedAt: listenerOrListenee.addedAt }, targetUserStub),
                0 - listenerOrListenee.addedAt
              );
              userRef.child(listenersOrListenees).child(sourceUser.id).remove();
            }
          });
        };
        adjustListenersOrListenees("listeners");
        adjustListenersOrListenees("listenees");

      });

      allUsersRef.child(sourceUser.id).remove();
      console.log("successfully merged user " + sourceUser.username + " into " + targetUser.username);

    });
  };

  ctrl.removeUserAfterConfirmation = function(sourceUser, event) {
    event.preventDefault();
    event.stopPropagation();

    var confirmPopup = $ionicPopup.show({
      title: 'Remove User',
      template: 'DANGER: Are you sure you want to remove user ' + sourceUser.username + '?',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Remove User</b>',
          type: 'button-assertive',
          onTap: function(e) {
            return true;
          }
        }
      ]
    });


    confirmPopup.then(function(res) {
      if(res) {
        ctrl.removeUser(sourceUser);
      }
    });
  };

  ctrl.removeUser = function(rawSourceUser) {

    var sourceUser = _.pick(rawSourceUser, function(value,key) { return /^\w/.test(key);  });
    allUsersRef.once("value", function(snapshot) {

      var users = snapshot.val();
      console.log("There are " + _.keys(users).length + " users");


      // save a copy of source user
      var deepCopyOfSourceUser = JSON.parse(JSON.stringify(sourceUser))
      Fireb.ref().child("deletedUsers").child(sourceUser.id).setWithPriority(deepCopyOfSourceUser, 0 - Date.now());

      _.each(users, function(user) {
        var userRef = allUsersRef.child(user.id);

        if (user.addedBy.id == sourceUser.id) {
          // user will now be marked as added-by-self
          var stub = _.pick(user, ["id", "name", "username", "face"]);
          userRef.child("addedBy").set(stub);
          console.log("adjusted addedBy");
        }

        function removeProfileOrFeedMessages(profileOrFeedMessages) {
          _.each(user[profileOrFeedMessages], function(message, messageId) {
            if (message.author.id == sourceUser.id || message.subject.id == sourceUser.id) {
              userRef.child(profileOrFeedMessages).child(messageId).remove();
              console.log("removed message " + messageId + " from " + profileOrFeedMessages);
              return
            }
            var re = new RegExp("<a[^>]+>([^<]*" + sourceUser.username + "[^<]*)</a>" );
            if (re.test(message.text)) {
              while (true) {
                var name = RegExp.$1
                message.text = message.text.replace(re, name);
                if (!re.test(message.text)) {
                  break;
                }
              }
              userRef.child(profileOrFeedMessages).child(messageId).child("text").set(message.text);
              console.log("removed profile link from message");
            }
          });
        };
        removeProfileOrFeedMessages("feedMessages");
        removeProfileOrFeedMessages("profileMessages");

        function removeListenersOrListenees(listenersOrListenees) {
          _.each(user[listenersOrListenees], function(listenerOrListenee) {
            if (listenerOrListenee.id == sourceUser.id) {
              userRef.child(listenersOrListenees).child(sourceUser.id).remove();
              console.log("removed user " + listenerOrListenee.id + " from " + listenersOrListenees);
            }
          });
        };
        removeListenersOrListenees("listeners");
        removeListenersOrListenees("listenees");
      });

      allUsersRef.child(sourceUser.id).remove();
      console.log("successfully removed user " + sourceUser.username);
    });
  };

  ctrl.foo = function(targetUsername, sourceUsernames) {
    allUsersRef.once("value", function(snapshot) {

      var users = snapshot.val();
      console.log("There are " + _.keys(users).length + " users");

      _.each(users, function(user) {
        var userRef = allUsersRef.child(user.id);

        // do something with user here...
      });

      console.log("successfully did i!");

    });

  };

  // ctrl.removeUser("@testsignup" );
})

;
