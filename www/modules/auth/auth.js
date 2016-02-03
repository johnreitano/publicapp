angular.module('Publicapp.auth', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider){

    $stateProvider

    .state('app.signIn', {
      url: '/sign-in',
      views: {
        'menuContent': {
          templateUrl: "modules/auth/sign_in.html",
          controller: 'AuthCtrl as vm'
        }
      }
    })

    .state('app.signOut', {
      url: '/sign-out',
      views: {
        'menuContent': {
          templateUrl: "modules/auth/sign_in.html",
          controller: 'AuthCtrl as vm'
        }
      }
    })

    .state('app.seed', {
      url: '/seed',
      views: {
        'menuContent': {
          templateUrl: "modules/auth/sign_in.html",
          controller: 'AuthCtrl as vm'
        }
      }
    })

    .state('app.signUp', {
      url: '/sign-up',
      views: {
        'menuContent': {
          templateUrl: "modules/auth/sign_up.html",
          controller: 'AuthCtrl as vm'
        }
      }
    })

  }
])

.controller('AuthCtrl', function($scope, $state, $q, $rootScope, $location, Contacts, SharedMethods, Fireb) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  ctrl.errorMessage = '';
  ctrl.password = '';

  ctrl.signIn = function() {
    if (Fireb.signedIn()) {
      Fireb.ref.unauth();
    }

    Fireb.ref.authWithPassword({ email: ctrl.email, password: ctrl.password }, function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
        ctrl.errorMessage = error.reason;
      } else {
        console.log("Authenticated successfully with payload:", authData);
        $state.go('app.profile.feed', {id: authData.uid})
      }
    });
  };

  ctrl.signUp = function() {
    if (Fireb.signedIn()) {
      Fireb.ref.unauth();
    }

    ctrl.createUser({
      email: ctrl.email,
      password: ctrl.password,
      phone: ctrl.phone,
      name: ctrl.name,
      username: ctrl.username
    }, false, function(error, newUser) {
      if (error) {
        ctrl.errorMessage = error.message;
      } else {
        ctrl.signIn();
      }
    });
  };

  ctrl.generateUsernameOnTheFly($scope, 'form');

})

;
