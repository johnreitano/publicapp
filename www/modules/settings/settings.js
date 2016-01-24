angular.module('Publicapp.settings', [])

  .config(['$urlRouterProvider', '$stateProvider',
    function($urlRouterProvider, $stateProvider){

      $stateProvider

      .state('app.settings', {
        url: "/settings",
        views: {
          'menuContent': {
            templateUrl: "modules/settings/settings.html",
            controller: "SettingsCtrl"
          }
        },
        authenticate: true
      })

      ;
  }])

  .controller('SettingsCtrl', function($scope, $meteor) {

    var user = Meteor.user();

    if (user) {
      $scope.name = user.profile.name;
      $scope.email = user.emails[0].address;
      $scope.phone = user.profile.phone;
    }
    $scope.currentPassword = "";
    $scope.newPassword = "";
    $scope.newPasswordConfirmation = "";
    $scope.errorMessage = "";

    $scope.updateSettings = function() {
      if (!s.isBlank($scope.currentPassword) && !s.isBlank($scope.newPassword) && $scope.newPassword == $scope.confirmPassword) {
        Accounts.changePassword($scope.currentPassword, $scope.newPassword, function(error) {
          if (error) {
            $scope.errorMessage = "Password error: " + error.reason;
            return;
          }
        });
        $scope.newPassword = "";
        $scope.newPasswordConfirmation = "";
        $scope.errorMessage = "";
      }

      var newEmails = Meteor.user().emails;
      newEmails[0].address= $scope.email;
      var newProfile = Meteor.user().profile;
      newProfile.name = $scope.name;
      newProfile.phone = $scope.phone;
      Meteor.users.update( Meteor.userId(), {
        $set: {
          emails: newEmails,
          profile: newProfile
        }
      });
    };


  })
;
