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
        }
      })

      .state('app.people.search', {
        url: "/search",
        authenticate: true
      })

      .state('app.people.contacts', {
        url: "/contacts",
        authenticate: true
      })

      ;
  }])

  .controller('PeopleCtrl', function($scope, SharedMethods, Contacts, $timeout, $state, Fireb, $firebaseArray, $firebaseObject, $ionicModal) {
    var ctrl = this;

    ctrl.sharedScope = $scope;
    angular.extend(ctrl, SharedMethods);

    if (ctrl.isCurrentState('app.people.contacts')) {
      Contacts.get(function(retrievedContacts) {
        ctrl.contacts = retrievedContacts;
      })
    }

    ctrl.usingDevice = function() {
      return ionic.Platform.isWebView();
    };

    ctrl.addUser = function() {
      // close modal
      // insert user
      // get new user id
      // var newUserId = ...;
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

        user.name = standardizedName(contact.displayName);

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
          user.phone = phoneNumber.value;
        }

        if (user.name && (user.emails.length > 0 || user.phone)) {
          return user;
        } else {
          return null;
        }
      };

      $scope.newUser = findMatchingUserBasedOnContact(contact) || { profile: {} };
      $scope.modal.show();
    };

    ctrl.showProfileOrOpenAddUserModal = function(contact) {
      if (contact.user && contact.user._id) {
        ctrl.showProfile(contact.user);
      } else {
        ctrl.openAddUserModalUsingContact(contact);
      }
    }

  })
;
