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


.controller('SettingsCtrl', function($scope, Fireb, SharedMethods) {
  var ctrl = this;

  angular.extend(ctrl, SharedMethods);

  ctrl.user = {};
  resetFields();
  var userRef = Fireb.ref.child("users").child(ctrl.signedInUserId());
  userRef.once("value", function(snapshot) {
    var retrievedUser = snapshot.val();
    ctrl.user.name = retrievedUser.name;
    ctrl.user.phone = retrievedUser.phone;
    ctrl.user.username = retrievedUser.username;
    ctrl.user.email = Fireb.ref.getAuth().password.email;
  });

  function addError(newError) {
    if (!s.isBlank(ctrl.errorMessage)) {
      ctrl.errorMessage = ctrl.errorMessage + "; "
    }
    ctrl.errorMessage = ctrl.errorMessage + newError;
  };

  function changePassword(callback) {
    if (!s.isBlank(ctrl.user.currentPassword) && !s.isBlank(ctrl.user.newPassword)) {
      var options = {
        email: Fireb.ref.getAuth().password.email,
        oldPassword: ctrl.user.currentPassword,
        newPassword: ctrl.user.newPassword
      };
      Fireb.ref.changePassword(options, function(error) {
        if (error) {
          addError("Error changing password: " + error.reason);
        }
        callback(error);
      });
    } else {
      callback();
    }
  };

  function changeEmail(dirty, callback) {
    if (dirty) {
      Fireb.ref.changeEmail({
        oldEmail: Fireb.ref.getAuth().password.email,
        newEmail: ctrl.user.email,
        password: ctrl.user.currentPassword
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
        } else {
          console.log("User email changed successfully!");
        }
        callback(error);
      })
    } else {
      callback();
    }
  };

  function changeCoreFields(coreFieldsDirty, callback) {
    if (coreFieldsDirty) {
      userRef.update({
        name: ctrl.user.name,
        phone: ctrl.user.phone,
        username: ctrl.user.username,
      }, function(error) {
        if (error) {
          addError("Error saving data: " + error.reason);
        }
        callback(error);
      });
    } else {
      callback();
    }
  };

  function resetFields() {
    ctrl.user.currentPassword = "";
    ctrl.user.newPassword = "";
    ctrl.user.newPasswordConfirmation = "";
    ctrl.errorMessage = "";
  };

  ctrl.updateSettings = function(form) {
    changeEmail(form.email.$dirty, function(error) {
      if (error) {
        resetFields();
      } else {
        changePassword(function(error) {
          if (error) {
            resetFields();
          } else {
            changeCoreFields(
              form.name.$dirty || form.username.$dirty || form.phone.$dirty, function(error) {
                if (!error) {
                  console.log("successfully saved all settings");
                }
                resetFields();
            })
          }
        });
      }
    });
  };
})
;

