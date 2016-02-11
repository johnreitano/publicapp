angular.module('Publicapp.about', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider){

    $stateProvider

    .state('app.about', {
      url: "/about",
      views: {
        'menuContent': {
          templateUrl: "modules/about/about.html",
          controller: "AboutCtrl as vm"
        }
      }
    })

    ;
}])

.controller('AboutCtrl', function($scope, SharedMethods) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  ctrl.adminUserSignedIn = function() {
    return ctrl.signedIn() && ctrl.signedInUser().admin;
  };

  ctrl.confirmAndReSeedDatabase = function(window) {
    if (!confirm('Are you sure you want to re-seed?')) {
      console.log('seed canceled')
      return;
    }

    ctrl.reSeedDatabase(false);
  };
})

;
