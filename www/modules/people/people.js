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

      .state('app.people.contacts', {
        url: "/contacts",
        authenticate: true
      })

      .state('app.people.listenees', {
        url: "/listenees",
        authenticate: true
      })

      .state('app.people.searchResults', {
        url: "/search-results",
        authenticate: true
      })

      ;
  }])

  .controller('PeopleCtrl', function($scope, SharedMethods, Contacts, $timeout, $state, Fireb, $firebaseArray, $firebaseObject, $ionicModal) {
    var ctrl = this;

    angular.extend(ctrl, SharedMethods);

    var userRef = Fireb.ref.child("users").child(Fireb.signedInUserId());

    var userFirebaseObjects = {};
    var listeneeStubsRef = userRef.child("listeneeStubs");
    ctrl.listeneeStubs = $firebaseArray(listeneeStubsRef);
    listeneeStubsRef.on("child_added", function(snapshot) {
      var userId = snapshot.key();
      userFirebaseObjects[userId] = $firebaseObject(Fireb.ref.child("users").child(userId));
    });

    ctrl.listenee = function(listeneeStub) {
      return userFirebaseObjects[listeneeStub.$id ];
    };


    ctrl.showSearchResultsTab = false;

    ctrl.search = function() {
      var normalizedSearchText = s.trim(ctrl.searchText).replace(/ +/g,' ').replace(/@/,'');
      var usersRef = Fireb.ref.child("users");
      if (/ /.test(normalizedSearchText)) {
        // search by name
        var name = normalizedSearchText;
        query = usersRef.orderByChild("name").startAt(name).endAt(name);
        ctrl.searchResults = $firebaseArray(query);
      } else {
        // search by username
        var username = "@" + normalizedSearchText;
        query = usersRef.orderByChild("username").startAt(username).endAt(username);
        ctrl.searchResults = $firebaseArray(query);
      }
      ctrl.showSearchResultsTab = true;
      $state.go( "app.people.searchResults" );

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

    // IONIC MODAL

    $ionicModal.fromTemplateUrl('add-user-modal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal
    })  

    $scope.openModal = function() {
      $scope.modal.show()
    }

    $scope.closeModal = function() {
      $scope.modal.hide();
    };

    $scope.addUserToPublic = function() {
      var user = {};
      user.name = contact.name;
      user.email = contact.email || '';
      user.phone = contact.phone || '';

      SharedMethods.createUser(user);
      SharedMethods.startListeningTo(user, $event);
    };

    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });


  })
;
