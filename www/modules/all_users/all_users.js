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

.controller('AllUsersCtrl', function($scope, SharedMethods, Fireb, $firebaseArray) {
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

  ctrl.mergeUsers = function(targetUsername, sourceUsernames) {
    allUsersRef.once("value", function(snapshot) {

      var users = snapshot.val();
      console.log("There are " + _.keys(users).length + " users");

      var targetUser = _.detect(users, function(user, userId) { return user.username == targetUsername; });
      if (!targetUser) {
        console.log("unable to find user with username ", targetUsername);
        return;
      }
      var usersRef = Fireb.ref().child("users");
      var targetUserRef = usersRef.child(targetUser.id);

      sourceUsernames = _.without(sourceUsernames, targetUsername);
      _.each(sourceUsernames, function(sourceUsername) {

        var sourceUser = _.find(users, function(user, userId) { return user.username == sourceUsername; });
        if (!sourceUser) {
          console.log("unable to find user with username ", sourceUsername);
          return;
        }

        // save a copy of source user
        var deepCopyOfSourceUser = JSON.parse(JSON.stringify(sourceUser))
        targetUserRef.child("mergedUsers").child(sourceUser.id).setWithPriority(deepCopyOfSourceUser, Date.now());

        // copy source user's profile messages to target user
        var targetUserStub = _.pick(targetUser, ["id", "name", "username", "face"]);

        // replace source user info with target user info in all feeds
        _.each(users, function(user) {
          var userRef = allUsersRef.child(user.id);

          _.each(user.profileMessages, function(message, messageId) {
            if (message.author.id == sourceUser.id) {
              userRef.child("feedMessages.author").set(targetUserStub);
            }
            if (message.subject.id == sourceUser.id) {
              userRef.child("feedMessages.subject").set(targetUserStub);
            }
          });

          _.each(user.feedMessages, function(message, messageId) {
            if (message.author.id == sourceUser.id) {
              userRef.child("feedMessages.author").set(targetUserStub);
            }
            if (message.subject.id == sourceUser.id) {
              userRef.child("feedMessages.subject").set(targetUserStub);
            }
          });

          _.each(user.listeners, function(listener) {
            if (listener.id == sourceUser.id) {
              var newListener = _.extend(targetUserStub,{addedAt: listener.addedAt });
              userRef.child("listeners").child(targetUser.id).add(newListener);
              userRef.child("listeners").child(listener.id).remove();
            }
          });

          _.each(user.listenees, function(listenee) {
            if (listenee.id == sourceUser.id) {
              var newListenee = _.extend(targetUserStub,{addedAt: listenee.addedAt });
              userRef.child("listenees").child(targetUser.id).add(newListenee);
              userRef.child("listenees").child(listenee.id).remove();
            }
          });
        });

        usersRef.child(sourceUser.id).remove();
        console.log("successfully merged user " + sourceUser.username + " into " + targetUser.username);

      });

    });
  };


})

;
