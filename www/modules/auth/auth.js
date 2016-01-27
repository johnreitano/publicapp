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
  var _signedInUserId = null;
  var _signedInUser = null;

  function signedIn() {
    return !!_signedInUserId;
  };

  function signedInUserId() {
    return _signedInUserId;
  };

  function signedInUser() {
    return _signedInUser;
  };

  ref.onAuth(function(authData) {
    if (authData) {
      console.log("Authenticated with uid:", authData.uid);
      _signedInUserId = authData.uid;
      ref.child("users").child(_signedInUserId).on("value", function(snapshot) {
        _signedInUser = snapshot.val();
      });
    } else {
      console.log("Client unauthenticated.")
      _signedInUserId = null;
      _signedInUserUser = null;
      // TODO: detach on() hook above
    }
  });

  function generateUsername( name ) {
    return "@" + ( name || "" ).replace(/[\ \@]/g,"").toLowerCase(); // TODO: remove nonalpha characters
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
      user.createdAt = user.createdAt || (new Date());
      user.createdAt = user.createdAt.getTime();

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
          createdAt: recentDate()
        });

        ref.removeUser({email: user.email, password: "123"}, function(error) {
          if (error && !/The specified user does not exist/.test(error)) {
            console.log("unable to remove user", error);
            return;
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

            var usersRef = ref.child("users");
            var messagesRef = ref.child("messages");

            function createMessage(message) {
              var messageRef = ref.child("messages").push();
              var messageId = id.key();
              messageRef.set(message, function(error) {
                if (error) {
                  console.log("could not set message");
                  return;
                }

                // set up foreign key references with form /users/5/profileMessageStubs/addedAt/1453776597238
                var authorUserRef = ref.child("users").child(message.authorUserId);
                authorUserRef.child("profileMessageStubs").child(messageId).set({createdAt: message.createdAt});
                authorUserRef.child("feedMessageStubs").child(messageId).set({createdAt: message.createdAt});

                // set up foreign key references with form /users/5/feedMessageStubs/addedAt/1453776597238
                var subjectUserRef = ref.child("users").child(message.subjectUserId);
                subjectUserRef.child("profileMessageStubs").child(messageId).set({createdAt: message.createdAt});
                subjectUserRef.child("feedMessageStubs").child(messageId).set({createdAt: message.createdAt});

              });
            };

            usersRef.once("value", function(snapshot) {
              var users = snapshot.val();
              _.each(users, function(user, uid) {

                // create 3 messages by user on his own profile
                for (var i; i < 3; i++) {
                  createMessage({
                    authorUserId: uid,
                    subjectUserId: uid,
                    text: faker.directive('lorem')('%w',40),
                    createdAt: recentDate()
                  });
                }

                // set up items linked to other users
                var otherUserIds = _.without(_.sample(_.keys(users),5),uid);

                _.each(otherUserIds,function(otherUserId) {

                  var otherUser = users[otherUserId];
                  var addedAt = Math.max(user.createdAt, otherUser.createdAt);

                  // create items such as:
                  //    /users/5/listenerStubs/10/addedAt/1453776597238
                  //    /users/5/listeneeStubs/10/addedAt/1453776597238
                  var listenerStubsRef = ref.child("users").child(uid).child("listenerStubs");
                  listenerStubsRef.child(otherUserId).set({addedAt: addedAt});
                  var listeneeStubsRef = ref.child("users").child(otherUserId).child("listeneeStubs");
                  listeneeStubsRef.child(uid).set({addedAt: addedAt});

                  // create 3 messages by user on this other user's profile
                  for (var i; i < 3; i++) {
                    createMessage({
                      authorUserId: uid,
                      subjectUserId: otherUserId,
                      text: faker.directive('lorem')('%w',40),
                      createdAt: recentDate()
                    });
                  }
                });
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
