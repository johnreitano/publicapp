// Public mobile app

angular.module('underscore', [])
.factory('_', function() {
  return window._; // assumes underscore has already been loaded on the page
});

_.mixin({
  compactObject : function(o) {
    return _.pick(o, function(value, key, object) {
      return !(_.isNull(value) || _.isUndefined(value) || _.isNaN(value));
    });
  }
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
  'Publicapp.allUsers',
  'Publicapp.auth',
  'Publicapp.contacts',
  'Publicapp.claimPage',
  'Publicapp.fireb',
  'Publicapp.help',
  'Publicapp.landing',
  'Publicapp.listenees',
  'Publicapp.message',
  'Publicapp.people',
  'Publicapp.profile',
  'Publicapp.settings',
  'Publicapp.sharedMethods',
  'Publicapp.staticPages'
])

.constant('GCM_SENDER_ID', '574597432927')

.run(function($rootScope, $state, $stateParams, $location, Contacts, $ionicConfig, Fireb, $ionicPlatform, $ionicPopup, $ionicHistory, $timeout) {

  // Disable BACK button on home
  $ionicPlatform.registerBackButtonAction(function(event) {
    var viewingOwnProfile = app.profile.test($state.current.name) && $stateParams.id == Fireb.signedInUserId();
    if (viewingOwnProfile) {
      $ionicPopup.confirm({
        title: 'Leaving Public',
        template: 'Are you sure you want to quit?'
      }).then(function(res) {
        if (res) {
          ionic.Platform.exitApp();
        }
      })
    } else {
      $ionicHistory.goBack();
    }
  }, 100);

  var rootScope = $rootScope;

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
    if (toState.name == "app.home") {
      event.preventDefault();
      if (Fireb.signedIn()) {
        $state.go("app.profile.feed");
      } else {
        $state.go("app.landing");
      }
    } else if (toState.name == "app.marketing") {
      event.preventDefault();
      window.localStorage['marketingId'] = toParams.id;
      $state.go("app.landing");
    } else if (toState.name == "app.landing" && Fireb.signedIn()) {
      event.preventDefault();
      $state.go("app.profile.feed");
    } else if (toState.name == "app.signOut") {
      event.preventDefault();
      if (Fireb.signedIn()) {
        Fireb.doUnauth();
      }
      $state.go("app.landing");
    } else if (toState.name == "app.profile") {
      event.preventDefault();
      if (s.isBlank(toParams.id)) {
        toParams.id = Fireb.signedInUserId();
      }
      if (toParams.id == Fireb.signedInUserId()) {
        $state.go("app.profile.feed", toParams);
      } else {
        $state.go("app.profile.messages", toParams);
      }
    } else if (toState.name == "app.profile.feed" && Fireb.signedIn() && s.isBlank(toParams.id)) {
      event.preventDefault();
      $state.go("app.profile.feed", {id: Fireb.signedInUserId()});
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

  .state('app.home', {
    url: "/home"
  })

  .state('app.marketing', {
    url: "/go/:id"
  })

  $urlRouterProvider.otherwise('/landing');

})

.controller('AppCtrl', function($scope, $rootScope, $ionicPopup) {
  ctrl = this;


})

;

