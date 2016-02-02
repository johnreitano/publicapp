// Public mobile app

angular.module('underscore', [])
  .factory('_', function() {
    return window._; // assumes underscore has already been loaded on the page
});

angular.module('Publicapp', [
  'ionic',
  'firebase',
  'ngCordova',
  'ngSanitize',
  'underscore',
  'angularMoment',
  'internationalPhoneNumber',
  'Publicapp.about',
  'Publicapp.auth',
  'Publicapp.contacts',
  'Publicapp.fireb',
  'Publicapp.help',
  'Publicapp.feedLoader',
  'Publicapp.people',
  'Publicapp.message',
  'Publicapp.profile',
  'Publicapp.settings',
  'Publicapp.sharedMethods'
])

.constant('GCM_SENDER_ID', '574597432927')

.run(function($rootScope, $state, $location, Contacts, FeedLoader, $ionicConfig, Fireb) {

  $rootScope.$on('$stateChangeStart', function(){
     // $rootScope.$broadcast('$routeChangeSuccess');
  });

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
    if (toState.authenticate && !Fireb.signedIn()) {
      event.preventDefault();
      $state.go('app.signIn');
    } else if (toState.name == "app.signOut") {
      if (Fireb.signedIn()) {
        Fireb.ref.unauth();
      }
      $state.go("app.signIn");
    } else if (toState.name == "app.start") {
      event.preventDefault();
      $state.go("app.profile.feed", toParams);
    } else if (toState.name == "app.profile") {
      if (s.isBlank(toParams.id)) {
        toParams.id = Fireb.signedInUserId()
      }
      event.preventDefault();
      if (toParams.id == Fireb.signedInUserId()) {
        $state.go("app.profile.feed", toParams);
      } else {
        $state.go("app.profile.messages", toParams);
      }
    } else if (toState.name == "app.people") {
      event.preventDefault();
      if (ionic.Platform.isWebView()) {
        $state.go('app.people.contacts');
      } else {
        $state.go('app.people.listenees');
      }
    }
  });


  ionic.Platform.ready(function() {
    Contacts.load(); // TODO: check whether this preloading of the contacts will trigger a warning in iOS

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
  })

  .state('app.start', {
    url: "/start/:id"
  })

  ;

  // $urlRouterProvider.otherwise('/start');

  $urlRouterProvider.otherwise(function ($injector, $location) {
    $injector.invoke(function($state, Fireb) {
      $state.go('app.start', {id: Fireb.signedInUserId()});
    });
  });
})

.controller('AppCtrl', function($scope) {
  ctrl = this;
})

;

