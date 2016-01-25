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

.service('Fireb', function() {
  var ref = new Firebase("https//publicapp3.firebaseio.com");
  var signedInUserId = null;
  var signedInUser = null;

  function signedIn() {
    return !!signedInUserId;
  };

  ref.onAuth(function(authData) {
    if (authData) {
      console.log("Authenticated with uid:", authData.uid);
      signedInUserId = authData.uid;
      ref.child("users").child(signedInUserId).on("value", function(snapshot) {
        signedInUser = snapshot.val();
      });
    } else {
      console.log("Client unauthenticated.")
      signedInUserId = null;
      signedInUserUser = null;
    }
  });

  function getSignedInUser() {
    return signedInUser;
  };

  function generateUsername( name ) {
    return ( name || "" ).replace(/\ /,"").toLowerCase(); // TODO: remove nonalpha characters
  };

  function generateFaceUrl(name, username) {
    var colorScheme = _.sample([
      { background: "DD4747", foreground: "FFFFFF"},
      { background: "ED6D54", foreground: "FFFFFF"},
      { background: "FFBE5B", foreground: "FFFFFF"},
      { background: "FFE559", foreground: "FFFFFF"}
    ]);
    var sourceOfInitials = name;
    if (s.isBlank(sourceOfInitials)) {
      sourceOfInitials = username;
    }
    var firstLetters = sourceOfInitials.match(/\b\w/g);
    var initials = firstLetters[0];
    if (firstLetters.length > 1) {
      initials = initials + firstLetters[firstLetters.length-1];
    }
    initials = initials.toUpperCase();
    return "http://dummyimage.com/100x100/" + colorScheme.background + "/" + colorScheme.foreground + "&text=" + initials;
  };

  function createUser(user, callback) {
    ref.createUser({
      email    : user.email,
      password : user.password
    }, function(error, userData) {
      if (error) {
        console.log(error);
        if (callback) {
          callback(error);
        }
        return;
      }
      console.log("Successfully created user account with uid:", userData.uid);
      user.face = user.face || generateFaceUrl(user.name, user.username);
      user.admin = user.admin ? true : false;
      user.addedAt = user.addedAt || (new Date());
      user.addedAt = user.addedAt.getTime();
      user.foo = "123"

      ref.child("users").child(userData.uid).set(user, function(error) {
        if (error) {
          console.log('error saving profile data', error);
        } else {
          console.log('successfully saved profile data');
        }
        if (callback) {
          callback(error);
        }
      })
    });
  };

  function recentDate() {
    var n = ( new Date()) - (Math.random() * 5 * 24 * 60 * 60 * 1000 );
    return new Date(n);
  }

  function reSeedDatabase() {
    console.log("about to re-seed database");

    ref.child("users").once("value", function(snapshot) {

      ref.child("users").remove();
      ref.child("messages").remove();
      console.log("removed everything!");

      var SEED_USER_COUNT = 25
      var SEED_POST_COUNT = 150

      var usersArray = [];
      _.each(_.range(SEED_USER_COUNT), function() {
        usersArray.push({
          email: faker.directive('email')(),
          name: faker.directive('firstName')() + ' ' + faker.directive('lastName')(),
          phone: "+1" + faker.directive('phone')().replace(/\D/g,'').replace(/^(\d{10}).*/,'$1')
        });
      });

      usersArray = usersArray.concat([
        { email: "jreitano@gmail.com", name: "John Reitano", phone: "+16196746211", admin: true },
        { email: "sarmadhbokhari@gmail.com", name: "Sarmad Bokhari", phone: "+16196746211", admin: true },
        { email: "jasminereitano7@gmail.com", name: "Jasmine Reitano", phone: "+16196746211" },
        { email: "jreitano+nicolo@gmail.com", name: "Nicolo Reitano", phone: "+16196746211" },
        { email: "jreitano+giovanni@gmail.com", name: "Giovanni Reitano", phone: "+16196746211" },
        { email: "jreitano+alessandra@gmail.com", name: "Alessandra Reitano", phone: "+16196746211" },
        { email: "gabrielreitano06@gmail.com", name: "Gabriel Reitano", phone: "+16196746211"  },
        { email: "crisdavid0925@gmail.com", name: "Cristian Ramirez", phone: "+16196746211",  },
        { email: "jack@black.com", name: "Jack Black", phone: "+16196746211"  }
      ]);
      var userCountdown = usersArray.length;
      _.each(usersArray, function(user) {
        _.extend(user, {
          password: "123",
          username: generateUsername(user.name),
          addedAt: recentDate()
        });

        ref.removeUser({email: user.email, password: "123"}, function(error) {
          if (error) {
            if (!/The specified user does not exist/.test(error)) {
              console.log("unable to remove user", error);
              return;
            }
          }

          createUser(user, function(error) {
            if (error) {
              userCountdown = -1;
            }

            --userCountdown;

            console.log("user countdown is now", userCountdown);

            if (userCountdown != 0) {
              return;
            }

            console.log("all users created!")

            ref.child("users").once("value", function(snapshot) {
              var users = snapshot.val() || {};
              _.each(users, function(user, uid) {

                // set up listeners and listenees
                var otherUserIds = _.without(_.sample(_.keys(users),5),uid);

                _.each(otherUserIds,function(otherUserId) {

                  var listenersRef = ref.child("users").child(uid).child("listeners");
                  listenersRef.child(otherUserId).set({addedAt: user.addedAt});

                  var listeneesRef = ref.child("users").child(otherUserId).child("listenees");
                  listeneesRef.child(uid).set({addedAt: user.addedAt});

                });

                var x = 7;

                // TODO: author some messages
                //      2 for with this user as the subject
                //      chooose 5 random users, make two messages on each of their profiles
                //      adjust profileMessages, feedMessages appropriately (use callbacks)

                // var messagesRef = ref.child("messages");
                // _.each(_.range(SEED_POST_COUNT), function() {
                //
                //   messagesRef.push({
                //     authorUserId: _.sample(users,1)[0]._id,
                //     subjectUserId: _.sample(users,1)[0]._id,
                //     text: faker.directive('lorem')('%w',40),
                //     photo: "http://lorempixel.com/100/100/",
                //     addedAt: recentDate()
                //   });
                // });
                //
                // users = {
                //   91: {
                //     username: "joeb",
                //     profileMessages: {
                //       5: {
                //         addedAt: "xxx"
                //       }
                //     },
                //     feedMessages: {
                //       5: {
                //         addedAt: "xxx"
                //       }
                //     },
                //     listenees: {
                //       7: {
                //         addedAt: "xxx"
         //       }
                //     },
                //     listeners: {
                //       9: {
                //         addedAt: "xxx"
         //       },
                //       10: {
                //         addedAt: "xxx"
         //       }
                //     }
                //   }
                // };

              });

              console.log("database successfully re-seeded");
            });
          });
        });
      });
    });
  };

  return {
    ref: ref,
    signedIn: signedIn,
    signedInUserId: signedInUserId,
    signedInUser: signedInUser,
    createUser: createUser,
    generateUsername: generateUsername,
    reSeedDatabase: reSeedDatabase
  };

})

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
        $state.go('app.profile', {id: authData.uid});
      }
    });
  };

  ctrl.resetPassword = function() {
    // TODO: add this
  }

  ctrl.signOut = function() {
    if (Fireb.signedIn()) {
      Fireb.ref.unauth();
    }
    $location.path('/sign-in');
  };

  ctrl.signUp = function() {
    if (Fireb.signedIn()) {
      Fireb.ref.unauth();
    }      email: ctrl.email,

    Fireb.createUser({
      email: ctrl.email,
      password: ctrl.password,
      phone: ctrl.phone,
      name: ctrl.name,
      username: ctrl.username
    }, function(error) {
      if (error) {
        ctrl.errorMessage = error.message;
      } else {
        ctrl.signIn();
      }
    });
  };

  ctrl.generateUsernameOnTheFly($scope, 'mainForm');

})

;
