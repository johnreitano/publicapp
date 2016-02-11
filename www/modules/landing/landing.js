angular.module('Publicapp.landing', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider){

    $stateProvider

    .state('app.landing', {
      url: "/landing",
      views: {
        'menuContent': {
          templateUrl: "modules/landing/landing.html",
          controller: "LandingCtrl as vm"
        }
      }
    })

    ;
}])

.directive('handlePhoneSubmit', function () {
  return function (scope, element, attr) {
      var textFields = element.find('input');

      element.bind('submit', function() {
          console.log('form was submitted');
          textFields[0].blur();
      });
  };
})

.controller('LandingCtrl', function($scope, SharedMethods, $state, Fireb, $ionicModal, $rootScope) {
  var ctrl = this;

  ctrl.sharedScope = $scope;
  angular.extend(ctrl, SharedMethods);

  ctrl.usingMobileBrowser = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }


})
;
