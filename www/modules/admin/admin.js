angular.module('Publicapp.admin', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider){

    $stateProvider

    .state('app.admin', {
      url: "/admin",
      views: {
        'menuContent': {
          templateUrl: "modules/admin/admin.html",
          controller: "AdminCtrl as vm"
        }
      }
    })

    ;
}])

.controller('AdminCtrl', function($scope, SharedMethods, Fireb, $firebaseArray, $ionicPopup) {
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
        _.each(user.feedMessages, function(message, messageId) {
          if (s.isBlank(message.text)) {
            allUsersRef.child(userId).child("feedMessages").child(messageId).remove();
            console.log("Removed feed message " + messageId);
          }
        });
      });
    });
  };

  ctrl.getAllMessages = function() {
    ctrl.messages = [];
    allUsersRef.once("value", function(snapshot) {
      var users = snapshot.val();
      console.log("getting messages");
      _.each(users, function(user,userId) {
        _.each(user.profileMessages, function(message, messageId) {
          if (message.author.id == user.id) {
            ctrl.messages.push(message);
            console.log("adding message");
          }
        });
      });
    });
  };


  ctrl.mergeUserAfterConfirmation = function(sourceUser, event) {
    event.preventDefault();
    event.stopPropagation();

    var confirmPopup = $ionicPopup.show({
      template: '<h5>Merge {{sourceUser.username}} into which target username:</h5><input type="text" ng-model="vm.targetUsername">',
      title: 'Merge User',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Save</b>',
          type: 'button-assertive',
          onTap: function(e) {
            if (s.isBlank(ctrl.targetUsername)) {
              //don't allow the user to close unless he enters wifi password
              e.preventDefault();
            } else {
              return ctrl.targetUsername;
            }
          }
        }
      ]
    });


    confirmPopup.then(function(targetUsername) {
      if (targetUsername) {
        ctrl.mergeUser(sourceUser.username, targetUsername);
      }
    });
  };


  ctrl.mergeUser = function(sourceUsername, targetUsername) {
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


      // var oldUser = undefined;
      // _.each(users, function(user, userId) {
      //   if (!user.mergedUsers) {
      //     return;
      //   }
      //   _.each(user.mergedUsers, function(mergedUser, mergedUserId) {
      //     if (mergedUser.username == sourceUsername) {
      //       oldUser = mergedUser;
      //     }
      //   });
      // });
      // if (!oldUser) {
      //   console.log("unable to find old user");
      //   return;
      // }
      // console.log("found old user", oldUser);
      // allUsersRef.child(oldUser.id).setWithPriority(oldUser, 0 - oldUser.createdAt);
      // return;




      var sourceUser = _.find(users, function(user, userId) { return user.username == sourceUsername; });
      if (!sourceUser) {
        console.log("unable to find user with username ", sourceUsername);
        return;
      }

      // save a copy of source user
      var deepCopyOfSourceUser = JSON.parse(JSON.stringify(sourceUser))
      var targetUserRef = Fireb.ref().child("users").child(targetUser.id);
      targetUserRef.child("mergedUsers").child(sourceUser.id).setWithPriority(deepCopyOfSourceUser, 0 - Date.now());

      // copy selected fields from source to target user
      var changes = {};
      if ( (s.isBlank(targetUser.authProvider) || targetUser.authProvider == "none") && !(s.isBlank(sourceUser.authProvider) || sourceUser.authProvider == "none")) {
        changes.authProvider = sourceUser.authProvider;
        changes.authId = sourceUser.authId;
      }
      if ( (s.isBlank(targetUser.face) || /dummyimage\.com/.test(targetUser.face)) && !(s.isBlank(sourceUser.face) || /dummyimage\.com/.test(sourceUser.face)) ) {
        changes.face = sourceUser.face;
      }
      if (s.isBlank(targetUser.email) && !s.isBlank(sourceUser.email)) {
        changes.email = sourceUser.email;
      }
      if (s.isBlank(targetUser.phone) && !s.isBlank(sourceUser.phone)) {
        changes.phone = sourceUser.phone;
      }
      if (_.keys(changes).length > 0) {
        targetUserRef.update(changes);
      }

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
            copyMessage = false;
            var re = new RegExp(sourceUsername, 'g');
            if (re.test(message.text)) {
              message.text = message.text.replace(re, targetUsername);
              copyMessage = true;
            }
            if (message.author.id == sourceUser.id) {
              message.author = targetUserStub;
              copyMessage = true;
            }
            if (message.subject.id == sourceUser.id) {
              message.subject = targetUserStub;
              copyMessage = true;
            }
            if (copyMessage) {
              targetUserRef.child(profileOrFeedMessages).child(messageId).setWithPriority(message, 0 - message.createdAt)
            }
          });
        };

        adjustMessages("feedMessages");
        adjustMessages("profileMessages");

        function adjustListenersOrListenees(listenersOrListenees) {
          _.each(user[listenersOrListenees], function(listenerOrListenee) {
            if (listenerOrListenee.id == sourceUser.id) {
              var stub = _.extend({addedAt: listenerOrListenee.addedAt }, targetUserStub);
              userRef.child(listenersOrListenees).child(targetUser.id).setWithPriority(stub, 0 - stub.addedAt);
              userRef.child(listenersOrListenees).child(sourceUser.id).remove();
            }
          });
        };
        adjustListenersOrListenees("listeners");
        adjustListenersOrListenees("listenees");

      });

      console.log("attempting to remove user with id " + sourceUser.id + " and username " + sourceUser.username);
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

    allUsersRef.once("value", function(snapshot) {

      var users = snapshot.val();
      console.log("There are " + _.keys(users).length + " users");

      var sourceUser = _.find(users, function(user, userId) {
        return user.id == rawSourceUser.id;
      });
      if (!sourceUser) {
        console.log("unable to find user using options ", options);
        return;
      }

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

      console.log("attempting to remove user with id " + sourceUser.id + " and username " + sourceUser.username);
      allUsersRef.child(sourceUser.id).remove();
      console.log("successfully removed user " + sourceUser.username);
    });
  };


  ctrl.changeUsername = function(sourceUsername, targetUsername) {
    if (sourceUsername == targetUsername) {
      console.log("source username cannot equal target username");
      return;
    }

    allUsersRef.once("value", function(snapshot) {

      var users = snapshot.val();
      console.log("There are " + _.keys(users).length + " users");

      var sourceUser = _.find(users, function(user, userId) { return user.username == sourceUsername; });
      if (!sourceUser) {
        console.log("unable to find user with username ", sourceUsername);
        return;
      }

      var targetUser = _.find(users, function(user, userId) { return user.username == targetUsername; });
      if (targetUser) {
        console.log("target username already in use by user", targetUser);
        return;
      }

      allUsersRef.child(sourceUser.id).child("priorUsernames").child(Date.now()).setWithPriority(sourceUsername, 0 - Date.now());

      _.each(users, function(user) {
        var userRef = allUsersRef.child(user.id);

        if (user.id == sourceUser.id) {
          userRef.child("username").set(targetUsername);
        }
        if (user.addedBy.id == sourceUser.id) {
          userRef.child("addedBy").child("username").set(targetUsername);
        }

        function adjustMessages(profileOrFeedMessages) {
          _.each(user[profileOrFeedMessages], function(message, messageId) {
            var re = new RegExp(sourceUsername, 'g');
            if (re.test(message.text)) {
              var newText = message.text.replace(re, targetUsername);
              userRef.child(profileOrFeedMessages).child(messageId).child("text").set(newText);
            }
            if (message.author.id == sourceUser.id) {
              userRef.child(profileOrFeedMessages).child(messageId).child("author").child("username").set(targetUsername);
            }
            if (message.subject.id == sourceUser.id) {
              userRef.child(profileOrFeedMessages).child(messageId).child("subject").child("username").set(targetUsername);
            }
          });
        };

        adjustMessages("feedMessages");
        adjustMessages("profileMessages");

        function adjustListenersOrListenees(listenersOrListenees) {
          _.each(user[listenersOrListenees], function(listenerOrListenee) {
            if (listenerOrListenee.id == sourceUser.id) {
              userRef.child(listenersOrListenees).child(listenerOrListenee.id).child("username").set(targetUsername);
            }
          });
        };
        adjustListenersOrListenees("listeners");
        adjustListenersOrListenees("listenees");

      });

      console.log("successfully changed username from " + sourceUsername + " to " + targetUsername);

    });
  };


  ctrl.updateUser = function(sourceUsername, changes) {

    allUsersRef.once("value", function(snapshot) {

      var users = snapshot.val();

      var sourceUser = _.find(users, function(user, userId) {
        return user.username == sourceUsername;
      });
      if (!sourceUser) {
        console.log("unable to find user with username " + sourceUsername);
        return;
      }

      var sourceUserRef = Fireb.ref().child("users").child(sourceUser.id);
      sourceUserRef.update(changes);
      console.log("successfully updated user with username " + sourceUsername + " and id " + sourceUser.id);
    });
  };

  // ctrl.updateUser("@mariecarrillo", {email: "mariecarrillp@gmail.com"});
})

;
