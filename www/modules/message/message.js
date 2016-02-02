angular.module('Publicapp.message', [])

.config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){

  $stateProvider

  .state('app.messageViaFeed', {
    url: "/profile/:profileId/feed/message/:id",
    views: {
      'menuContent': {
        templateUrl: "modules/message/message.html",
        controller: "MessageCtrl as vm"
      }
    },
    authenticate: true
  })

  .state('app.messageViaProfile', {
    url: "/profile/:profileId/messages/message/:id",
    views: {
      'menuContent': {
        templateUrl: "modules/message/message.html",
        controller: "MessageCtrl as vm"
      }
    },
    authenticate: true
  })

}])

.service('MessageData', function($timeout, $state, Fireb) {
  var message;

  return {
    message: message
  };

})

// .directive('profileLink', function() {
//   return {
//     restrict: 'E',
//     scope: {
//         uid: '=uid'
//     },
//     compile: function(elem) {
//       var oldText = elem.html();
//       var newText = "<span class='profile-link' ui-sref='app.profile.feed{id: \"{{uid}}\"}'>" + oldText + "</span>",
//       elem.replaceWith(newText);
//     }
//   };
// })

// .directive('profileLink', function() {
//   return {
//     restrict: 'E',
//     replace: true,
//     transclude: true,
//     scope: {
//         uid: '=uid'
//     },
//     template: "<span class='profile-link' ui-sref='app.profile.feed{id: \"{{uid}}\"}' ng-transclude></span>",
//   };
// });
//
.controller('MessageCtrl', function($scope, $stateParams, SharedMethods, Fireb, $firebaseObject, MessageData, $sce) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  ctrl.message = MessageData.message;

  var re = /(<profile-link[^\>]*>[\@_\w \,\.]+<\/profile-link>)/;
  ctrl.messageParts = ctrl.message.text.replace(re, '|$1|').split("|");

  ctrl.linkText = function(part) {
    var re = /<profile-link[^\>]*>([\@_\w \,\.]+)<\/profile-link>/;
    if (re.test(part)) {
      return RegExp.$1;
    } else {
      return null;
    }
  };

  ctrl.linkUiSref = function(part) {
    var re = /<profile-link[^\>]*uid\=[\'\"]([\w-]+)[\'\"][^\>]*>[\@_\w \,\.]+<\/profile-link>/;
    if (re.test(part)) {
      var uid = RegExp.$1
      return "app.profile.messages({id: '" + uid + "'})";
    } else {
      return null;
    }
  };

  var x = 7;
})

;
