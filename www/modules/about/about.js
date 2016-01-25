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
      },
      authenticate: false
    })

    ;
}])

.controller('AboutCtrl', function($scope) {
  var ctrl = this;

  ctrl.adminUserSignedIn = function() {
    return ctrl.signedIn() && ctrl.signedInUser().admin;
  };

  ctrl.reSeedDatabase = function(window) {
    if (!confirm('Are you sure you want to re-seed?')) {
      console.log('seed canceled')
      return;
    }

    Fireb.reSeedDatabase();
  };
})

;
