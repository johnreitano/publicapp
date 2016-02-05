angular.module('Publicapp.listenees', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider){

    $stateProvider

    .state('app.listenees', {
      url: "/listening-to",
      authenticate: true,
      views: {
        'menuContent': {
          templateUrl: "modules/listenees/listenees.html",
          controller: "ListeneesCtrl as vm"
        },
      }
    })

    ;
}])

.controller('ListeneesCtrl', function($scope, SharedMethods, Fireb, $firebaseArray) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  var listeneesRef = Fireb.signedInUserRef().child("listenees");
  ctrl.listenees = $firebaseArray(listeneesRef);
})
;
