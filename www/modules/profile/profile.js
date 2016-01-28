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
    });
}])

.controller('ProfileCtrl', function($scope, $location, SharedMethods, $stateParams, Fireb, $firebaseObject, $firebaseArray) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  ctrl.userId = $stateParams.id;

  // retrueve user data for specfied id
  $scope.ctrl = ctrl; // TODO: remove this?

  var userRef = Fireb.ref.child('users').child(ctrl.userId);

  ctrl.user = $firebaseObject(userRef);

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

  ctrl.profileMessages = [];
  userRef.child("profileMessageStubs").on("child_added", function(snapshot) {
    var messageId = snapshot.key();
    Fireb.ref.child("messages").child(messageId).once("value", function(messageSnapshot) {
      var message = messageSnapshot.val();
      ctrl.profileMessages.push(message); // TODO: fix the order of messages

      if (!userFirebaseObjects[message.authorUserId]) {
        userFirebaseObjects[message.authorUserId] = $firebaseObject(Fireb.ref.child("users").child(message.authorUserId));
      }
      if (!userFirebaseObjects[message.subjectUserId]) {
        userFirebaseObjects[message.subjectUserId] = $firebaseObject(Fireb.ref.child("users").child(message.subjectUserId));
      }
    });
  });

  ctrl.feedMessages = [];
  userRef.child("feedMessageStubs").on("child_added", function(snapshot) {
    var messageId = snapshot.key();
    Fireb.ref.child("messages").child(messageId).once("value", function(messageSnapshot) {
      var message = messageSnapshot.val();
      ctrl.feedMessages.push(message); // TODO: fix the order of messages

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
  };


  ctrl.showMessage = function(post) {
    // var postUrl = "/profile/" + post.authorUserId + "/messages/post/" + post._id;
    var messageUrl = "/profile/" + post.authorUserId + "/feed/message/" + message._id;
    $location.path(messageUrl);
  }

})

;
