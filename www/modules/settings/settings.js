angular.module('Publicapp.settings', [])

.config(['$urlRouterProvider', '$stateProvider',
  function($urlRouterProvider, $stateProvider){

    $stateProvider

    .state('app.settings', {
      url: "/settings",
      views: {
        'menuContent': {
          templateUrl: "modules/settings/settings.html",
          controller: "SettingsCtrl as vm"
        }
      },
      authenticate: true
    })

    ;
}])

.directive("compareTo", function() {
  return {
    require: "ngModel",
    scope: {
      otherModelValue: "=compareTo"
    },
    link: function(scope, element, attributes, ngModel) {
      ngModel.$validators.compareTo = function(modelValue) {
        return modelValue == scope.otherModelValue;
      };

      scope.$watch("otherModelValue", function() {
        ngModel.$validate();
      });
    }
  };
})


.controller('SettingsCtrl', function($scope, $rootScope, Fireb, SharedMethods, $firebaseObject, $timeout, $ionicLoading) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  ctrl.user = {};
  if (Fireb.signedIn()) {
    resetFields();
  }
  $rootScope.$on('signedInUserSet', function(signedInUser){
    resetFields();
  });

  function addError(newError) {
    if (!s.isBlank(ctrl.errorMessage)) {
      ctrl.errorMessage = ctrl.errorMessage + "; "
    }
    ctrl.errorMessage = ctrl.errorMessage + newError;
  };

  function changeAuthEmail(emailDirty, callback) {
    if (ctrl.usesPasswordAuth() && emailDirty) {
      Fireb.ref().changeEmail({
          oldEmail: Fireb.ref().getAuth().password.email,
          newEmail: ctrl.user.email,
          password: ctrl.currentPassword
      }, function(error) {
        if (error) {
          switch (error.code) {
            case "INVALID_PASSWORD":
              addError("The password you entered is not correct.");
              break;
            case "INVALID_USER":
              addError("No user with that email.");
              break;
            default:
              addError("Error changing email: ", error.reason);
              break;
          }
          callback(error);
          return;
        }
        console.log("User email changed in auth record");
        callback();
      });
    } else {
      callback();
    }
  };

  function changeAuthPassword(callback) {
    if (ctrl.usesPasswordAuth() && !s.isBlank(ctrl.currentPassword) && !s.isBlank(ctrl.newPassword) && ctrl.newPassword == ctrl.newPasswordConfirmation) {
      var options = {
        email: Fireb.ref().getAuth().password.email,
        oldPassword: ctrl.currentPassword,
        newPassword: ctrl.newPassword
      };
      Fireb.ref().changeAuthPassword(options, function(error) {
        if (error) {
          addError("Error changing password: " + error.reason);
        }
        callback(error);
      });
    } else {
      callback();
    }
  };

  function changeCoreFields(coreFieldsDirty, callback) {
    if (coreFieldsDirty) {
      var updatedFields = {
        name: ctrl.user.name || '',
        email: ctrl.user.email || '',
        username: ctrl.user.username || '',
        phone: ctrl.user.phone || ''
      }
      Fireb.signedInUserRef().update(updatedFields, function(error) {
        if (error) {
          console.log("Error saving core fields:", error);
          addError("Error saving core fields: ", error);
        } else {
          console.log("successfully saved core fields");
        }
        callback(error);
      });
    } else {
      callback();
    }
  };

  function resetFields() {
    var signedInUser = Fireb.signedInUser();
    ctrl.user = {
      name: signedInUser.name,
      email: signedInUser.email,
      username: signedInUser.username,
      phone: signedInUser.phone,
      signInType: signedInUser.authProvider == "password" ? "Email and Password" : s.titleize(signedInUser.authProvider)
    };
    ctrl.currentPassword = "";
    ctrl.newPassword = "";
    ctrl.newPasswordConfirmation = "";
    ctrl.errorMessage = "";
  };

  ctrl.usesPasswordAuth = function() {
    return ctrl.user.signInType == "Email and Password";
  };

  ctrl.updateSettings = function(form) {
    changeAuthEmail(form.email.$dirty, function(error) {
      if (error) {
        return;
      }

      changeAuthPassword(function(error) {
        if (error) {
          return;
        }

        changeCoreFields(form.email.$dirty || form.name.$dirty || form.username.$dirty || form.phone.$dirty, function(error) {
            if (!error) {
              console.log("successfully saved all settings");
              resetFields();
              $ionicLoading.show({ template: 'Settings have been updated', noBackdrop: true, duration: 3000 });
              ctrl.goHome();
            }
        });
      });
    });
  };

})
;

