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
})
;
