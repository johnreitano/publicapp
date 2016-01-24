angular.module('Publicapp.auth', [])


.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider){

    $stateProvider

    .state('app.signIn', {
      url: '/sign-in',
      views: {
        'menuContent': {
          templateUrl: "client/modules/auth/sign_in.html",
          controller: 'AuthCtrl as vm'
        }
      }
    })

    .state('app.signUp', {
      url: '/sign-up',
      views: {
        'menuContent': {
          templateUrl: "client/modules/auth/sign_up.html",
          controller: 'AuthCtrl as vm'
        }
      }
    })

  }
])

.controller('AuthCtrl', function($scope, $state, $q, $rootScope, $location, $meteor, Contacts, SharedMethods) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  ctrl.user = Meteor.user();
  ctrl.errorMessage = '';
  ctrl.password = '';

  ctrl.signIn = function() {
    if (Meteor.userId()) {
      Meteor.logout();
    }

    Meteor.loginWithPassword(ctrl.email, ctrl.password, function(error) {

      if (error) {
        console.log("signIn error", error);
        ctrl.errorMessage = error.reason;
      } else {
        console.log("just logged in as user", Meteor.userId());
        $state.go('app.profile');
      }
      if(!$scope.$$phase) {
        $scope.$apply();
      }

    });
  };

  ctrl.signedIn = function() {
    return !!Meteor.userId();
  };


  ctrl.resetPassword = function() {
    Meteor.call("resetPasswordWithoutSendingEmail", 'jreitano@gmail.com', 'password');
  }

  ctrl.signOut = function() {
    if (Meteor.userId()) {
      Meteor.logout();
      if(!$scope.$$phase) {
        $scope.$apply();
      }
    }
    $location.path('/sign-in');
  };

  ctrl.signUp = function() {
    Meteor.call("createPublicUser", {
      username: ctrl.username,
      email: ctrl.email,
      password: ctrl.password,
      profile: {
        name: ctrl.name
      }
    });
    ctrl.signIn();
  };

  ctrl.generateUsernameOnTheFly($scope, 'mainForm');

})

;
