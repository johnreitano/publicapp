angular.module('Publicapp.profile', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider, $stateParams){

    $stateProvider

    .state('app.profile', {
      url: "/profile/:id",
      views: {
        'menuContent': {
          templateUrl: 'modules/profile/profile.html',
          controller: "ProfileCtrl as vm"
        }
      },
      authenticate: true
    })

    .state('app.profile.feed', {
      url: "/feed",
      authenticate: true
    })

    .state('app.profile.messages', {
      url: "/messages",
      authenticate: true
    })

    .state('app.profile.listeners', {
      url: "/listeners",
      authenticate: true
    })
}])

.controller('ProfileCtrl', function($scope, $location, SharedMethods, $stateParams, Fireb, $firebaseObject, $firebaseArray, $state) {
  var ctrl = this;

  ctrl.userId = $stateParams.id;
  if (s.isBlank(ctrl.userId)) {
    return; // TODO: find out why we sometimes enter this controller without an id
  }

  angular.extend(ctrl, SharedMethods);

  $scope.ctrl = ctrl; // TODO: remove this?

  // retrueve user data for specfied id
  var userRef = Fireb.ref.child('users').child(ctrl.userId);
  ctrl.user = $firebaseObject(userRef);

  // retrieve listener data
  var userFirebaseObjects = {};
  var listenerStubsRef = userRef.child("listenerStubs");
  ctrl.listenerStubs = $firebaseArray(listenerStubsRef);
  listenerStubsRef.on("child_added", function(snapshot) {
    var userId = snapshot.key();
    userFirebaseObjects[userId] = $firebaseObject(Fireb.ref.child("users").child(userId));
  });

  ctrl.listener = function(listenerStub) {
    return userFirebaseObjects[listenerStub.$id ];
  };

  ctrl.profileMessages = {};
  userRef.child("profileMessageStubs").on("child_added", function(snapshot) {
    var messageId = snapshot.key();
    Fireb.ref.child("messages").child(messageId).once("value", function(messageSnapshot) {
      var message = messageSnapshot.val();
      ctrl.profileMessages[messageId] = message; // TODO: fix the order of messages

      if (!userFirebaseObjects[message.authorUserId]) {
        userFirebaseObjects[message.authorUserId] = $firebaseObject(Fireb.ref.child("users").child(message.authorUserId));
      }
      if (!userFirebaseObjects[message.subjectUserId]) {
        userFirebaseObjects[message.subjectUserId] = $firebaseObject(Fireb.ref.child("users").child(message.subjectUserId));
      }
    });
  });

  ctrl.feedMessages = {};
  userRef.child("feedMessageStubs").on("child_added", function(snapshot) {
    var messageId = snapshot.key();
    Fireb.ref.child("messages").child(messageId).once("value", function(messageSnapshot) {
      var message = messageSnapshot.val();
      ctrl.feedMessages[messageId] = message; // TODO: fix the order of messages

      if (!userFirebaseObjects[message.authorUserId]) {
        userFirebaseObjects[message.authorUserId] = $firebaseObject(Fireb.ref.child("users").child(message.authorUserId));
      }
      if (!userFirebaseObjects[message.subjectUserId]) {
        userFirebaseObjects[message.subjectUserId] = $firebaseObject(Fireb.ref.child("users").child(message.subjectUserId));
      }
    });
  });

  ctrl.author = function(message) {
    return userFirebaseObjects[message.authorUserId];
  };

  ctrl.subject = function(message) {
    return userFirebaseObjects[message.subjectUserId];
  };

  ctrl.viewingOwnProfile = function() {
    return !ctrl.userId || !ctrl.signedInUserId() || ctrl.userId == ctrl.signedInUserId();
  };

  ctrl.sendMessage = function() {
    Fireb.createMessage({
      subjectUserId: ctrl.userId,
      text: ctrl.newMessage
    });
    console.log(ctrl.newMessage, "Message succesfully posted");
    ctrl.newMessage = '';
  };

  ctrl.showMessageViaFeed = function(message, messageId, event) {
    event.preventDefault();
    $state.go("app.messageViaFeed", {profileId: ctrl.userId, id: messageId});
  };

  ctrl.showMessageViaProfile = function(message, messageId, event) {
    event.preventDefault();
    $state.go("app.messageViaProfile", {profileId: ctrl.userId, id: messageId});
  };

})

;
