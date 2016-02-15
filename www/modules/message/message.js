angular.module('Publicapp.message', [])

.config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){

  $stateProvider

  .state('app.messageViaFeed', {
    url: "/profile/:userId/feed/message/:id",
    views: {
      'menuContent': {
        templateUrl: "modules/message/message.html",
        controller: "MessageViaFeedCtrl as vm"
      }
    }
  })

  .state('app.messageViaProfile', {
    url: "/profile/:userId/messages/message/:id",
    views: {
      'menuContent': {
        templateUrl: "modules/message/message.html",
        controller: "MessageViaProfileCtrl as vm"
      }
    }
  })

}])

.controller('MessageViaFeedCtrl', function($scope, $stateParams, SharedMethods, Fireb, $firebaseObject) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  var messageRef = Fireb.ref().child('users').child($stateParams.userId).child("feedMessages").child($stateParams.id);
  ctrl.message = $firebaseObject(messageRef);

})

.controller('MessageViaProfileCtrl', function($scope, $stateParams, SharedMethods, Fireb, $firebaseObject) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  var messageRef = Fireb.ref().child('users').child($stateParams.userId).child("profileMessages").child($stateParams.id);
  ctrl.message = $firebaseObject(messageRef);

})

;
