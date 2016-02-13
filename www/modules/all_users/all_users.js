angular.module('Publicapp.allUsers', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider){

    $stateProvider

    .state('app.allUsers', {
      url: "/all-users",
      views: {
        'menuContent': {
          templateUrl: "modules/all_users/all_users.html",
          controller: "AllUsersCtrl as vm"
        }
      }
    })

    ;
}])

.controller('AllUsersCtrl', function($scope, SharedMethods, Fireb, $firebaseArray) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  var allUsersRef = Fireb.ref().child("users")
  ctrl.allUsers = $firebaseArray(allUsersRef);

  // ctrl.removeEmptyMessages = function() {
  //   allUsersRef.on("value", function(snapshot) {
  //     var users = snapshot.val();
  //     console.log("There are " + _.keys(users).length + " users");
  //     _.each(users, function(user,userId) {
  //       _.each(user.profileMessages, function(message, messageId) {
  //         if (s.isBlank(message.text)) {
  //           allUsersRef.child(userId).child("profileMessages").child(messageId).remove();
  //           console.log("Removed profile message " + messageId);
  //         }
  //       });
  //       _.each(user.feedeMessages, function(message, messageId) {
  //         if (s.isBlank(message.text)) {
  //           allUsersRef.child(userId).child("feedMessages").child(messageId).remove();
  //           console.log("Removed feed message " + messageId);
  //         }
  //       });
  //     });
  //   });
  // };
  // ctrl.removeEmptyMessages();

})

;
