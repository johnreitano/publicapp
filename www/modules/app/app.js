// Public mobile app

angular.module('underscore', [])
  .factory('_', function() {
    return window._; // assumes underscore has already been loaded on the page
});

angular.module('Publicapp', [
  'ionic',
  'ui.router', // included by ionic
  'firebase',
  // 'ngCordova',
  // 'ngCordova.plugins.datePicker',
  // 'ngCordova.plugins.push',
  'underscore',
  // 'ngResource',
  'internationalPhoneNumber',
  'Publicapp.about',
  'Publicapp.auth',
  'Publicapp.contacts',
  'Publicapp.fireb',
  'Publicapp.help',
  'Publicapp.feedLoader',
  'Publicapp.people',
  'Publicapp.post',
  'Publicapp.profile',
  'Publicapp.settings',
  'Publicapp.sharedMethods'
])

.constant('GCM_SENDER_ID', '574597432927')

.run(function($rootScope, $state, $location, Contacts, FeedLoader, $ionicPlatform, $ionicConfig, Fireb) {

  $rootScope.$on('$stateChangeStart', function(){
     $rootScope.$broadcast('$routeChangeSuccess');
  });

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
    if  (toState.name == "app.seed") {
      Fireb.reSeedDatabase();
      $location.path('/sign-in');
    } else if (toState.authenticate && !Fireb.signedIn()) {
      $location.path('/sign-in');
    } else if (toState.name == "app.profile" && s.isBlank(toParams.id)) {
      $location.path('/profile/' + Fireb.signedInUserId());
    }
  });

  Contacts.load(); // TODO: check whether this preloading of the contacts will trigger a warning in iOS
  FeedLoader.load(Fireb.ref, Fireb.signedInUserId());

  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

})

.config(function($urlRouterProvider, $stateProvider, ipnConfig) {
    ipnConfig.defaultCountry = 'us';
    ipnConfig.preferredCountries = ['us', 'ca', 'mx'];

    $stateProvider

    .state('app', {
      url: "",
      abstract: true,
      templateUrl: "modules/app/sidemenu.html",
      controller: 'AppCtrl as app',
    });

    $urlRouterProvider.otherwise('/profile/');
  })

.controller('AppCtrl', function($scope) {
  ctrl = this;
})

;

