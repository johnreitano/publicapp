angular.module('Publicapp.auth', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider) {

    $stateProvider

    .state('app.signOut', {
      url: '/sign-out',
      controller: 'AuthCtrl as vm'
    })

  }
])

.directive('focusMe', function($timeout) {
  return {
    link: function(scope, element, attrs) {

      $timeout(function() {
        element[0].focus();
      }, 150);
    }
  };
})

.controller('AuthCtrl', function($scope, $state, $q, $rootScope, $location, Contacts, SharedMethods, Fireb, $ionicLoading, $firebaseAuth, $ionicPopup, $timeout) {
  var ctrl = this;
  ctrl.sharedScope = $scope;

  angular.extend(ctrl, SharedMethods);

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
    if (!Fireb.signedIn() && toState.authenticate) {
      ctrl.originalToState = toState;
      ctrl.originalToParams = toParams;
      event.preventDefault();
      if (toParams.viaSignUp) {
        ctrl.showGenericSignUpPopup();
      } else {
        ctrl.showGenericSignInPopup();
      }
    }
  });

  ctrl.signUp = function() {
    var ctrl = this;

    ctrl.showSpinner("Signing up...");
    ctrl.createPasswordAuthAndUserObject({
      email: ctrl.email,
      password: ctrl.password,
      phone: ctrl.phone,
      name: ctrl.name,
      username: ctrl.username
    }, function(error, newUser) {
      ctrl.hideSpinner();
      if (error) {
        ctrl.errorMessage = error.message;
      } else {
        ctrl.signInWithEmail();
      }
    });
  };

  ctrl.showGenericSignUpPopup = function() {
    var ctrl = this;

    ctrl.showPassword = false;
    ctrl.email = '';
    ctrl.password = '';
    ctrl.genericSignUpPopup = $ionicPopup.show({
      cssClass: 'popup-outer auth-view',
      templateUrl: 'modules/auth/generic_sign_up_popup.html',
      scope: ctrl.sharedScope,
      title: 'Sign Up with Public',
      buttons: [{
        text: '',
        type: 'close-popup ion-ios-close-outline'
      }]
    });
  };

  ctrl.showEmailSignUpPopup = function() {
    var ctrl = this;

    ctrl.name = '';
    ctrl.username = '';
    ctrl.password = '';
    ctrl.errorMessage = '';
    ctrl.emailSignUpPopup = $ionicPopup.show({
      cssClass: 'popup-outer auth-view',
      templateUrl: 'modules/auth/email_sign_up_popup.html',
      scope: ctrl.sharedScope,
      title: 'Sign up with email',
      buttons: [{
        text: '',
        type: 'close-popup ion-ios-close-outline'
      }]
    });

    ctrl.generateUsernameOnTheFly();

  };

  ctrl.showGenericSignInPopup = function() {
    var ctrl = this;

    ctrl.showPassword = false;
    ctrl.email = '';
    ctrl.password = '';
    ctrl.genericSignInPopup = $ionicPopup.show({
      cssClass: 'popup-outer auth-view',
      templateUrl: 'modules/auth/generic_sign_in_popup.html',
      scope: ctrl.sharedScope,
      title: 'Please sign in to continue',
      buttons: [{
        text: '',
        type: 'close-popup ion-ios-close-outline'
      }]
    });
  };

  ctrl.showEmailSignInPopup = function() {
    var ctrl = this;

    ctrl.password = '';
    ctrl.errorMessage = '';
    ctrl.emailSignInPopup = $ionicPopup.show({
      cssClass: 'popup-outer auth-view',
      templateUrl: 'modules/auth/email_sign_in_popup.html',
      scope: ctrl.sharedScope,
      title: 'Sign in with email',
      buttons: [{
        text: '',
        type: 'close-popup ion-ios-close-outline'
      }]
    });

  };

  // private methods

  ctrl.generateUsernameOnTheFly = function() {
    var ctrl = this;

    ctrl.form = {};
    $scope.$watch('vm.name', function() {
      form = ctrl.form;
      if (form.username && form.username.$pristine && !s.isBlank(ctrl.name)) {
        ctrl.username = Fireb.generateUsername(ctrl.name);
      }
    }, true);
  };

  ctrl.signInWithEmail = function() {
    var ctrl = this;
    ctrl.signIn("password", {
      email: ctrl.email,
      password: ctrl.password
    });
  };

  ctrl.signIn = function(provider, credentials) {
    var ctrl = this;

    ctrl.errorMessage = '';
    ctrl.showSpinner("Signing in...");

    Fireb.doAuth(provider, credentials, function(error) {
      ctrl.hideSpinner();
      if (error) {
        console.log("Login Failed!", error);
        ctrl.errorMessage = error; // "Your email or password is not correct";
        return;
      }

      ctrl.closePopups();
      if (ctrl.originalToState) {
        console.log("successfully signed in - proceeding to original action");
         // using timeout to give onAuth a chance to save user id
        $timeout( function() {
          $state.go(ctrl.originalToState, ctrl.originalToParams);
          ctrl.originalToState = null;
          ctrl.originalToParams = null;
        }, 10 );
      } else {
        $state.go('app.home');
      }
    });
  };

  ctrl.closePopups = function() {
    var ctrl = this;

    if (ctrl.genericSignUpPopup) {
      ctrl.genericSignUpPopup.close();
      ctrl.genericSignUpPopup = null;
    }
    if (ctrl.emailSignUpPopup) {
      ctrl.emailSignUpPopup.close();
      ctrl.emailSignUpPopup = null;
    }
    if (ctrl.genericSignInPopup) {
      ctrl.genericSignInPopup.close();
      ctrl.genericSignInPopup = null;
    }
    if (ctrl.emailSignInPopup) {
      ctrl.emailSignInPopup.close();
      ctrl.emailSignInPopup = null;
    }
  };
})


;
