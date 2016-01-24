angular.module('Publicapp.people', [])

  .config(['$urlRouterProvider', '$stateProvider',
    function($urlRouterProvider, $stateProvider){

      $stateProvider

      .state('app.people', {
        url: "/people",
        views: {
          'menuContent': {
            templateUrl: "modules/people/people.html",
            controller: "PeopleCtrl as vm"
          }
        },
        authenticate: true
      })

      ;
  }])

  .controller('PeopleCtrl', function($scope, SharedMethods, $reactive, Contacts, $timeout, $state, $rootScope, SharedState) {
    var ctrl = this;

    angular.extend(ctrl, SharedMethods);

    $reactive(this).attach($scope);

    SharedState.initialize($rootScope, 'addUserModal');

    ctrl.userId = Meteor.userId();

    ctrl.user = Meteor.user();

    ctrl.showSearchResultsTab = false;

    ctrl.search = function() {
      var normalizedSearchText = s.trim(ctrl.searchText).replace(/ +/g," ").replace(/@/,'');
      if (/ /.test(normalizedSearchText)) {
        // search by name
        ctrl.usersFromSearch = Meteor.users.find({"profile.name": normalizedSearchText}).fetch();
      } else {
        // search by username
        normalizedSearchText = "@" + normalizedSearchText;
        ctrl.usersFromSearch = Meteor.users.find({username: normalizedSearchText}).fetch();
      }
      ctrl.showSearchResultsTab = true;
      $timeout(function() {
        angular.element('#search-results').triggerHandler('click');
      }, 100);

    };

    ctrl.addUser = function() {
      $rootScope.Ui.turnOff('addUserModal')
      var newUserId = Meteor.call("createPublicUser", ctrl.newUser);
      Posts.insert({
        authorUserId: Meteor.userId(),
        subjectUserId: newUserId,
        text: ctrl.firstMessageToNewUser,
        createdAt: new Date()
      });
      $state.go( "app.profile", { id: newUserId } );
    };

    ctrl.openAddUserModalUsingContact = function(contact) {

      var standardizedEmailAddress = function(emailAddress) {
        if (emailAddress) {
          trimmedEmailAddress = emailAddress.trim();
          var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if (re.test(trimmedEmailAddress)) {
            return trimmedEmailAddress;
          }
        }
        return null;
      };

      var standardizedPhone = function(phone) {
        if (phone) {
          phone = phone.replace(/^\+/, '011');
          phone = phone.replace(/\D/g, '');
          phone = phone.replace(/1(\d{10})/, '$1');

          var re = /^((\d{10})|(011\d{7,}))$/
          if (re.test(phone)) {
            return phone;
          }
        }
        return null;
      };

      var standardizedName = function(name) {
        if (!s.isBlank(name)) {
          return name.trim();
        } else {
          return null;
        }
      };

      var findMatchingUserBasedOnContact = function(contact) {
        var user = { emails: [], profile: {} };

        user.profile.name = standardizedName(contact.displayName);

        _.each(contact.emails, function(email,index,list) {
          email.value = standardizedEmailAddress(email.value);
        });
        var email = _.find(contact.emails, function(email) {
          return email.type == 'home' && email.value;
        });
        if (!email) {
          email = _.find(contact.emails, function(email) {
            return email.value;
          });
        }
        if (email && !s.isBlank(email.value)) {
          user.emails[0] = {
            address: email.value,
            verified: false
          }
        }

        _.each(contact.phoneNumbers, function(phoneNumber) {
          phoneNumber.value = standardizedPhone(phoneNumber.value);
        });
        var phoneNumber = _.find(contact.phoneNumbers, function(phoneNumber) {
          return phoneNumber.type == 'mobile' && phoneNumber.value;
        });
        if (phoneNumber) {
          user.profile.phone = phoneNumber.value;
        }

        if (user.profile.name && (user.emails.length > 0 || user.profile.phone)) {
          return user;
        } else {
          return null;
        }
      };

      ctrl.newUser = findMatchingUserBasedOnContact(contact) || { profile: {} };
      $scope.Ui.turnOn('addUserModal')
    };

    ctrl.showProfileOrOpenAddUserModal = function(contact) {
      if (contact.user && contact.user._id) {
        ctrl.showProfile(contact.user);
      } else {
        ctrl.openAddUserModalUsingContact(contact);
      }
    }

    ctrl.openAddUserModal = function() {
      ctrl.newUser = { profile: {} };
      $scope.Ui.turnOn('addUserModal')
    };

    ctrl.helpers({
      listeners: () => {
        if (Meteor.userId()) {
          return Meteor.users.find(
            { "profile.listeneeUserIds": { $in: [ Meteor.userId() ] } },
            { sort: {createdAt : -1} }
          );
        } else {
          return [];
        }
      },
      listenees: () => {
        if (Meteor.user()) {
          return Meteor.users.find({_id: {$in: Meteor.user().profile.listeneeUserIds}});
        } else {
          return [];
        }
      }
    });

    Contacts.get(function(contacts) {
      ctrl.contacts = contacts;
      console.log("contacts now accessible from controller");
      if(!$scope.$$phase) {
        $scope.$apply();
      }
    });

    ctrl.generateUsernameOnTheFly($scope, 'mainForm');

  })
;
