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

.controller('ProfileCtrl', function($scope, $location, SharedMethods, $stateParams, Fireb, $firebaseObject, $firebaseArray, $state, $cordovaNativeAudio, MessageData) {
  var ctrl = this;

  ctrl.userId = $stateParams.id;
  if (s.isBlank(ctrl.userId)) {
    return; // TODO: find out why we sometimes enter this controller without an id
  }

  angular.extend(ctrl, SharedMethods);

  // retrueve user data for specfied id
  var userRef = Fireb.ref.child('users').child(ctrl.userId);
  ctrl.user = $firebaseObject(userRef);

  // play incoming message sound for recent messages when viewing signed in users' profile page
  if (ctrl.userId == ctrl.signedInUserId()) {

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

  ctrl.viewingOwnProfile = function() {
    return !ctrl.userId || !ctrl.signedInUserId() || ctrl.userId == ctrl.signedInUserId();
  };

  ctrl.sendMessage = function() {
    ctrl.createMessage({
      subject: ctrl.user,
      subjectUserId: ctrl.userId,
      text: ctrl.newMessage
    }, function(error) {
      ctrl.newMessage = '';
    });

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
    MessageData.message = message;
    $state.go("app.messageViaFeed", {profileId: ctrl.userId, id: message.$id});
  };

  ctrl.showMessageViaProfile = function(message, event) {
    event.preventDefault();
    MessageData.message = message;
    $state.go("app.messageViaProfile", {profileId: ctrl.userId, id: message.$id});
  };

  ctrl.textWithoutProfileLinks = function(message) {
    return message.text.replace( /<profile-link[^>]*>/, "" ).replace( /<\/profile-link>/, "" );
  };


})

;
