angular.module('Publicapp.staticPages', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider){

    $stateProvider

    .state('app.terms', {
      url: "/terms",
      views: {
        'menuContent': {
          templateUrl: "modules/static_pages/terms.html",
          controller: "StaticPagesCtrl as vm"
        }
      }
    })

    .state('app.privacy', {
      url: "/privacy",
      views: {
        'menuContent': {
          templateUrl: "modules/static_pages/privacy.html",
          controller: "StaticPagesCtrl as vm"
        }
      }
    })

    ;
}])

.controller('StaticPagesCtrl', function($scope, SharedMethods, $state, Fireb, $rootScope) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  // $scope.foo = 6;
  $rootScope.foo = 16;

})
;
