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

.controller('MessageCtrl', function($scope, $stateParams, SharedMethods, Fireb, $firebaseObject) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  ctrl.messageId = $stateParams.id;

  Fireb.ref.child("messages").child(ctrl.messageId).once("value", function(snapshot) {
    ctrl.message = snapshot.val();
    ctrl.createdAtRel = ctrl.createdAtRelative(ctrl.message);
    var usersRef = Fireb.ref.child("users");
    ctrl.author = $firebaseObject(usersRef.child(ctrl.message.authorUserId));
    ctrl.subject = $firebaseObject(usersRef.child(ctrl.message.subjectUserId));
    var x = 7;
  });



})

;
