angular.module('Publicapp.profile', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider, $stateParams, $scope){

    $stateProvider

    .state('app.profile', {
      url: "/profile/:id",
      views: {
        'menuContent': {
          templateUrl: 'modules/profile/profile.html',
          controller: "ProfileCtrl as vm"
        }
      }
    })

    .state('app.profile.feed', {
      url: "/feed",
      authenticate: true
    })

    .state('app.profile.messages', {
      url: "/messages"
    })

    .state('app.profile.listeners', {
      url: "/listeners"
    })

    .state('app.profile.sendingMessage', {
      url: "/sending-message",
      authenticate: true
    })

}])

.controller('ProfileCtrl', function($scope, $location, SharedMethods, $stateParams, Fireb, $firebaseObject, $firebaseArray, $state, $cordovaNativeAudio, MessageData, $ionicPopup, $timeout) {
  var ctrl = this;

  ctrl.sharedScope = $scope;
  angular.extend(ctrl, SharedMethods);

  if (s.isBlank($stateParams.id)) {
    return; // TODO: find out why we sometimes enter this controller without an id
  }

  // retrueve user data for specfied id
  var userRef = Fireb.ref().child('users').child($stateParams.id);
  ctrl.user = $firebaseObject(userRef);

  ctrl.startSendingMessage = function(event) {
    if (event) {
      event.preventDefault();
    }

    ctrl.stateBeforeSending = $state.current.name;
    $state.go("app.profile.sendingMessage");
  };

  $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    if (toState.name == 'app.profile.sendingMessage') {
      ctrl.createMessage({
        subject: ctrl.user,
        text: ctrl.newMessage
      }, function(error) {
        if (error) {
          console.log("could not send message", error);
        } else {
          ctrl.newMessage = '';
        }
        $state.go(ctrl.stateBeforeSending);
      });

    } else if (/app\.profile\..+/.test($state.current.name)) {

      $timeout(function() {
        var element = document.getElementById("message-textarea");
        if (element) {
          element.focus();
        }
        // // scroll to top of messages so you can see new message
        // var element = document.getElementById("scrollable-content");
        // if (element) {
        //   angular.element(element).controller('scrollableContent').scrollTo(0);
        // }
      }, 150);

      ctrl.setUpIncomingMessageSound();
    }
  });

  ctrl.claimed = function(user) {
    return !s.isBlank(user.authId);
  };

  ctrl.firstName = function(user) {
    var name = s.isBlank(user.name) ? user.username : user.name
    return s.isBlank(name) ? null : name.split(/ /)[0];
  };

  ctrl.setUpIncomingMessageSound = function() {

    // play incoming message sound for recent messages when viewing signed in users' profile page
    if ($stateParams.id == ctrl.signedInUserId()) {

      // load sounds
      var webAudio;
      ionic.Platform.ready(function() {
        if (ionic.Platform.isWebView()) {
        $cordovaNativeAudio
          .preloadSimple('incoming', 'sounds/dewdrop_touchdown.ogg')
          .then(function (msg) {
            console.log("loaded sound: " + msg);
          }, function (error) {
            alert(error);
          });
        } else {
          webAudio = new buzz.sound('/sounds/dewdrop_touchdown.ogg');
        }
      });

      userRef.child("profileMessages").orderByChild("createdAt").startAt(Date.now() - 60000).on("child_added", function(snapshot) {
        var message = snapshot.val();

        if (message.author.id != ctrl.signedInUserId()) {
          if (ionic.Platform.isWebView()) {
            $cordovaNativeAudio.play('incoming').then(function (msg) {
            }, function (error) {
              console.log("got error trying to play sound on cordova")
            });
          } else {
            webAudio.play();
          }
        }
      });
    }
  };

  ctrl.viewingOwnProfile = function() {
    return $stateParams.id && ctrl.signedInUserId() && $stateParams.id == ctrl.signedInUserId();
  };

  ctrl.showMessageViaFeed = function(message, event) {
    event.preventDefault();
    MessageData.message = message;
    $state.go("app.messageViaFeed", {profileId: $stateParams.id, id: message.$id});
  };

  ctrl.showMessageViaProfile = function(message, event) {
    event.preventDefault();
    MessageData.message = message;
    $state.go("app.messageViaProfile", {profileId: $stateParams.id, id: message.$id});
  };


})

;
