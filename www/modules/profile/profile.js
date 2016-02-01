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

.controller('ProfileCtrl', function($scope, $location, SharedMethods, $stateParams, Fireb, $firebaseObject, $firebaseArray, $state, $timeout) {
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

  ctrl.profileMessages = [];
  var incomingMessageSound = new buzz.sound('/sounds/dewdrop_touchdown.ogg');
  userRef.child("profileMessageStubs").orderByChild("createdAt").on("child_added", function(snapshot) {

    var messageId = snapshot.key();
    ctrl.profileMessages.unshift({$id: messageId});

    Fireb.ref.child("messages").child(messageId).once("value", function(messageSnapshot) {
      var message = _.find(ctrl.profileMessages, function(message){ return message.$id == messageSnapshot.key() });
      _.extend(message, messageSnapshot.val());

      // play incoming message sound if appropriate
      if (Date.now() - message.createdAt < 30000 && ctrl.userId == ctrl.signedInUserId() && message.authorUserId != ctrl.signedInUserId()) {
        console.log("gonna try to beep");
        incomingMessageSound.play();
      }

      if (!userFirebaseObjects[message.authorUserId]) {
        userFirebaseObjects[message.authorUserId] = $firebaseObject(Fireb.ref.child("users").child(message.authorUserId));
      }
      if (!userFirebaseObjects[message.subjectUserId]) {
        userFirebaseObjects[message.subjectUserId] = $firebaseObject(Fireb.ref.child("users").child(message.subjectUserId));
      }
    });
  });

  ctrl.feedMessages = [];
  userRef.child("feedMessageStubs").orderByChild("createdAt").on("child_added", function(snapshot) {
    var messageId = snapshot.key();
    ctrl.feedMessages.unshift({$id: messageId});

    Fireb.ref.child("messages").child(messageId).once("value", function(messageSnapshot) {
      var message = _.find(ctrl.feedMessages, function(message){ return message.$id == messageSnapshot.key() });
      _.extend(message, messageSnapshot.val());

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
    ctrl.createMessage({
      subjectUserId: ctrl.userId,
      text: ctrl.newMessage
    });
    ctrl.newMessage = '';

    //
    // // scroll to top of posts so you can see new post
    // var element = document.getElementById("scrollable-content");
    // if (element) {
    //   angular.element(element).controller('scrollableContent').scrollTo(0);
    // }
    //
    // // put focus back into new post textarea
    // $timeout(function() {
    //   var element = document.getElementById("new-post-text");
    //   if (element) {
    //     element.focus();
    //   }
    // })


  };

  ctrl.showMessageViaFeed = function(message, event) {
    event.preventDefault();
    $state.go("app.messageViaFeed", {profileId: ctrl.userId, id: message.$id});
  };

  ctrl.showMessageViaProfile = function(message, event) {
    event.preventDefault();
    $state.go("app.messageViaProfile", {profileId: ctrl.userId, id: message.$id});
  };

})

;
