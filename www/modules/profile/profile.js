angular.module('Publicapp.profile', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider, $stateParams, $scope) {

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
      authenticate: true,
      params: {
        viaSignUp: false
      }
    })

    .state('app.profile.messages', {
      url: "/messages"
    })

    .state('app.profile.listeners', {
      url: "/listeners"
    })

    .state('app.profile.sendingMessage', {
      url: "/sending-message",
      authenticate: true,
      params: {
        viaSignUp: false
      }
    })

  }
])

.directive('longMessageWithProfileLinks', function($compile, $sanitize) {
  return {
    restrict: 'A',
    replace: true,
    link: function(scope, ele, attrs) {
      scope.$watch(attrs.longMessageWithProfileLinks, function(html) {
        linkMessage(scope, ele, attrs, null, $compile, $sanitize, html);
      });
    }
  };
})

.directive('shortMessageWithProfileLinks', function($compile, $sanitize) {
  return {
    restrict: 'A',
    replace: true,
    link: function(scope, ele, attrs) {
      scope.$watch(attrs.shortMessageWithProfileLinks, function(html) {
        linkMessage(scope, ele, attrs, null, $compile, $sanitize, html);
      });
    }
  };
})

.directive('openInTab', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.bind('click', function(event) {
        event.preventDefault()
        event.stopPropagation()
        window.open(attrs.href, '_blank');
      });
    }
  }
})

// .directive('a', function() {
//   return {
//     restrict: 'E',
//     link: function(scope, elem, attrs) {
//       if (attrs.target == '_blank') {
//         elem.on('click', function(e) {
//           e.preventDefault();
//         });
//       }
//     }
//   };
// })

.controller('ProfileCtrl', function($scope, $location, SharedMethods, $stateParams, Fireb, $firebaseObject, $firebaseArray, $state, $cordovaNativeAudio, $ionicPopup, $timeout, $sce, $sanitize) {
  var ctrl = this;

  if (s.isBlank($stateParams.id)) {
    return; // TODO: find out why we sometimes enter this controller without an id
  }

  ctrl.sharedScope = $scope;
  angular.extend(ctrl, SharedMethods);

  $timeout(function() {
    if (Fireb.signedIn()) {
      ctrl.turnOnincomingMessageSound();
    } else {
      ctrl.turnOffincomingMessageSound();
    }
  }, 3000);

  // retrueve user data for specfied id
  var userRef = Fireb.ref().child('users').child($stateParams.id);
  ctrl.user = $firebaseObject(userRef);

  ctrl.authenticateAndSendMessage = function(event) {
    if (event) {
      event.preventDefault();
    }

    ctrl.stateBeforeSending = $state.current.name;
    ctrl.explanation = "In order to finish sending this message, you'll need to join Public."
    ctrl.messageSendingComplete = false;
    ctrl.authenticateAndGo("app.profile.sendingMessage")

    // wait until authentincation is complete before sending the actual message
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      if (toState.name == 'app.profile.sendingMessage') {
        if (!ctrl.messageSendingComplete) { // HACK: using this flag to prevent message being sent twice
          ctrl.messageSendingComplete = true;
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
        }
      }
    });
  };

  ctrl.claimed = function(user) {
    return !s.isBlank(user.authId);
  };

  ctrl.firstName = function(user) {
    var name = s.isBlank(user.name) ? user.username : user.name
    return s.isBlank(name) ? null : name.split(/ /)[0];
  };

  ctrl.viewingOwnProfile = function() {
    return $stateParams.id && ctrl.signedInUserId() && $stateParams.id == ctrl.signedInUserId();
  };

  ctrl.showMessageViaFeed = function(messageId, message, event) {
    event.preventDefault();
    $state.go("app.messageViaFeed", {
      userId: $stateParams.id,
      id: messageId
    });
  };

  ctrl.showMessageViaProfile = function(messageId, message, event) {
    event.preventDefault();
    $state.go("app.messageViaProfile", {
      userId: $stateParams.id,
      id: messageId
    });
  };

  ctrl.messageBlank = function() {
    return s.isBlank(ctrl.newMessage);
  };

  ctrl.shortMessageText = function(message, lengthLimit) {
    var text = ctrl.baseMessageText(message);
    text = text.length > lengthLimit - 3 ? text.slice(0, lengthLimit - 3) + '...' : text;
    return text;
  };

  ctrl.turnOnincomingMessageSound = function() {
    // load sounds
    ionic.Platform.ready(function() {
      if (ionic.Platform.isWebView()) {
        $cordovaNativeAudio
          .preloadSimple('incoming', 'sounds/dewdrop_touchdown.ogg')
          .then(function(msg) {
            console.log("loaded sound: " + msg);
          }, function(error) {
            alert(error);
          });
      } else {
        ctrl._webAudio = new buzz.sound('/sounds/dewdrop_touchdown.ogg');
      }
    });

    ctrl.profileMessagesRef = Fireb.signedInUserRef().child("profileMessages").orderByChild("createdAt").startAt(Date.now() - 60000);
    ctrl.profileMessagesRef.on("child_added", ctrl.playSoundIfMessageIsNotFromSignedInUser);
  };

  ctrl.turnOffincomingMessageSound = function() {
    if (ctrl.profileMessagesRef) {
      ctrl.profileMessagesRef.off("child_added", ctrl.playSoundIfMessageIsNotFromSignedInUser);
      ctrl.profileMessagesRef = null;
    }
  };


  ctrl.playSoundIfMessageIsNotFromSignedInUser = function(snapshot) {
    var message = snapshot.val();
    if (message.author.id != ctrl.signedInUserId()) {
      if (ionic.Platform.isWebView()) {
        $cordovaNativeAudio.play('incoming').then(function(msg) {}, function(error) {
          console.log("got error trying to play sound on cordova")
        });
      } else {
        ctrl._webAudio.play();
      }
    }
  };


})

;

function linkMessage(scope, ele, attrs, maxLength, $compile, $sanitize, html) {
  var text = $sanitize(html);
  var profileLinkPattern = /<a [^>]+profile-user-id-([\w\-\_]+)\b[^>]*>/;
  while (matches = text.match(profileLinkPattern)) {
    var originalString = matches[0];
    var userId = matches[1];
    var newString = "<a ng-click=\"vm.showProfileByUserId('" + userId + "', $event)\">";
    text = text.replace(profileLinkPattern, newString);
  }

  var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
  text = text.replace(urlPattern, '<a open-in-tab href="$&">$&</a>');

  if (maxLength && text.length > maxLength) {
    text = text.slice(0, maxLength - 3) + '...';
  }
  ele.html(text);
  $compile(ele.contents())(scope);
};

