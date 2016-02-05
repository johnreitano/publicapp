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

.controller('AuthCtrl', function($scope, $state, $q, $rootScope, $location, Contacts, SharedMethods, Fireb, $ionicLoading) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  ctrl.errorMessage = '';
  ctrl.password = '';

  ctrl.signIn = function() {
    ctrl.errorMessage = '';
    ctrl.showSpinner("Signing in...");
    authenticateAndRedirect();
  };

  function authenticateAndRedirect() {
    Fireb.ref.authWithPassword({ email: ctrl.email, password: ctrl.password }, function(error, authData) {
      ctrl.hideSpinner();
      if (error) {
        console.log("Login Failed!", error);
        ctrl.errorMessage = "Your email or password is not correct";
        if(!$scope.$$phase) {
          $scope.$apply();
        }
      } else {
        console.log("Authenticated successfully with payload:", authData);
        $state.go('app.profile.feed', {id: authData.uid})
      }
    }).catch(function(error) {
      ctrl.errorMessage = "got auth error";
    });
  };

  ctrl.signUp = function() {
    ctrl.showSpinner("Signing up...");
    ctrl.createUser({
      email: ctrl.email,
      password: ctrl.password,
      phone: ctrl.phone,
      name: ctrl.name,
      username: ctrl.username
    }, false, function(error, newUser) {
      ctrl.hideSpinner();
      if (error) {
        ctrl.errorMessage = error.message;
      } else {
        authenticateAndRedirect();
      }
    });
  };

  ctrl.showSpinner = function(spinnerMessage) {
    $ionicLoading.show(
      { template: '<ion-spinner icon="android"></ion-spinner><p style="margin: 5px 0 0 0;">' + spinnerMessage + '</p>'}
    );

  };

  ctrl.hideSpinner= function() {
    $ionicLoading.hide();
  };

  ctrl.generateUsernameOnTheFly($scope, 'form');

})


;
