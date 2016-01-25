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
  var ref = new Firebase("https//publicapp.firebaseio.com");
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
        console.log("Error creating user:", error);
        if (callback) {
          callback(error);
        }
        return;
      }
      console.log("Successfully created user account with uid:", userData.uid);
      ref.child("users").child(userData.uid).set({
        phone: user.phone,
        name: user.name,
        username: user.username,
        face: user.face || generateFaceUrl(user.name, user.username),
        admin: user.admin ? true : false
      }, function(error) {
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

  function reSeedDatabase() {
    console.log( "abuot to re-seed database" );
    ref.child("users").remove();
    ref.child("messages").remove();

    var SEED_USER_COUNT = 25
    var SEED_POST_COUNT = 150

    var testUsers = [
      [ "jreitano@gmail.com", "John Reitano", true ],
      [ "sarmadhbokhari@gmail.com", "Sarmad Bokhari", true ],
      [ "jasminereitano7@gmail.com", "Jasmine Reitano" ],
      [ "jreitano+nicolo@gmail.com", "Nicolo Reitano" ],
      [ "jreitano+giovanni@gmail.com", "Giovanni Reitano" ],
      [ "jreitano+alessandra@gmail.com", "Alessandra Reitano" ],
      [ "crisdavid0925@gmail.com", "Cristian Ramirez" ],
      [ "jack@black.com", "Jack Black" ]
    ];

    _.each(testUsers, function(testUser) {
      createUser({
        email: testUser[0],
        password: "123",
        phone: "4445556666",
        name: testUser[1],
        username: generateUsername(testUser[1]),
        admin: testUser[2]
      });
    });

    _.each(_.range(SEED_USER_COUNT), function() {
      name = faker.directive('firstName')() + ' ' + faker.directive('lastName')();
      createUser({
        email: faker.directive('email')(),
        password: "123",
        phone: "+1" + faker.directive('phone')().replace(/\D/g,'').replace(/^(\d{10}).*/,'$1'),
        name: name,
        username: generateUsername(name)
      });
    });

    var usersRef = ref.child("users");

    function recentDate() {
      var n = ( new Date()) - (Math.random() * 5 * 24 * 60 * 60 * 1000 );
      return new Date(n);
    }

    usersRef.once("value", function(snapshot) {
      var users = snapshot.val();
      _.each(users, function(user, uid) {
        var randomeUserIds = _.sample(_.keys(users),5);
        usersRef.child(uid).set({listeneeUserIds: _.without(randomeUserIds,uid)});
      });

      var messagesRef = ref.child("messages");
      _.each(_.range(SEED_POST_COUNT), function() {

        messagesRef.push({
          authorUserId: _.sample(users,1)[0]._id,
          subjectUserId: _.sample(users,1)[0]._id,
          text: faker.directive('lorem')('%w',40),
          photo: "http://lorempixel.com/100/100/",
          createdAt: recentDate()
        });
      });

      console.log("database successfully re-seeded");
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
      username: ctrl.username,
      username: ctrl.username,
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
