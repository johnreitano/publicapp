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

  ctrl.showSearchResults = false;

  ctrl.search = function() {
    ctrl.showSpinner("Searching...");
    var searchText = s.trim(ctrl.searchText).replace(/ +/g,' ').replace(/\@/,'').toLowerCase();
    var searchTextParts = searchText.split(/ /);
    if (searchTextParts.length == 0) {
      ctrl.errorMessage = "Please try again with more characters";
      ctrl.hideSpinner();
    } else if (searchTextParts.length == 1) {
      // do an partial search on username
      queryStart = "@" + searchTextParts[0];
      queryEnd = queryStart + "z";
      Fireb.ref().child("users").orderByChild("username").startAt(queryStart).endAt(queryEnd).once("value", function(snapshot) {
        ctrl.searchResults = _.values(snapshot.val());
        ctrl.searchText = '';
        ctrl.showSearchResults = true;
        ctrl.hideSpinner();
      });
    } else {
      // do a partial search on searchableName
      queryStart = searchText;
      queryEnd = queryStart + "z";
      Fireb.ref().child("users").orderByChild("searchableName").startAt(queryStart).endAt(queryEnd).once("value", function(snapshot) {
        ctrl.searchResults = _.values(snapshot.val());
        ctrl.searchText = '';
        ctrl.showSearchResults = true;
        ctrl.hideSpinner();
      });
    }
  };


})
;
