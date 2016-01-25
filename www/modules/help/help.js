angular.module('Publicapp.help', [])

  .config(['$urlRouterProvider', '$stateProvider',
    function($urlRouterProvider, $stateProvider){

      $stateProvider

      .state('app.help', {
        url: "/help",
        views: {
          'menuContent': {
            templateUrl: "modules/help/help.html",
            controller: "HelpCtrl"
          }
        },
        authenticate: false
      })

      ;
  }])

  .controller('HelpCtrl', function($scope, Fireb) {

    var x = 7;

  })
;
