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

    ctrl.adminUserLoggedIn = function() {
      return Meteor.user() && (Meteor.user().emails[0].address == 'jreitano@gmail.com' || Meteor.user().emails[0].address == 'sarmadhbokhari@gmail.com');
    };

    ctrl.reSeedDatabase = function(window) {
      if (confirm('Are you sure you want to re-seed?')) {
        Meteor.call("reSeedDatabase", {});
      } else {
        console.log('seed canceled')
      }

    };

  })
;
