angular.module('Publicapp.sharedMethods', [])

.service('SharedMethods', function($timeout, $state, Fireb){

  return {
    reSeedDatabase: reSeedDatabase,
    signedInUserId: signedInUserId,
    signedInUser: signedInUser,
    signedIn: signedIn,
    createdAtRelative: createdAtRelative,
    isListeningTo: isListeningTo,
    showListenButton: showListenButton,
    showUnlistenButton: showUnlistenButton,
    startListeningTo: startListeningTo,
    stopListeningTo: stopListeningTo,
    showProfile: showProfile,
    generateUsernameOnTheFly: generateUsernameOnTheFly,
    generateUsername: generateUsername,
    isCurrentState: isCurrentState,
    peopleLink: peopleLink,
    createUser: createUser,
    createMessage: createMessage
  };

  function reSeedDatabase() {
    console.log("about to re-seed database");

    Fireb.ref.child("users").once("value", function(snapshot) {

      Fireb.ref.child("users").remove();
      Fireb.ref.child("messages").remove();
      console.log("removed everything!");

      var SEED_USER_COUNT = 3
      var SEED_MESSAGE_COUNT = 3

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

        Fireb.ref.removeUser({email: user.email, password: "123"}, function(error) {
          if (error && !/The specified user does not exist/.test(error)) {
            console.log("unable to remove user!", error);
            // return;
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

            var messagesRef = Fireb.ref.child("messages");

            Fireb.ref.child("users").once("value", function(snapshot) {
              var users = snapshot.val();
              _.each(users, function(user, uid) {

                // create messages by user on his own profile
                for (var i = 0; i < SEED_MESSAGE_COUNT; i++) {
                  createMessage({
                    authorUserId: uid,
                    subjectUserId: uid,
                    text: faker.directive('lorem')('%w',40),
                    createdAt: recentDate()
                  }, function(error) {
                    console.log("got error");
                  });
                }

                // set up items linked to other users
                var listenees = _.without(_.sample(_.keys(users),6),uid);
                _.each(listenees,function(listeneeUserId) {

                  // set up listener and listenee info, such as:
                  //    /users/5/listenerStubs/10/addedAt/1453776597238
                  //    /users/5/listeneeStubs/10/addedAt/1453776597238
                  var listenee = users[listeneeUserId];
                  var addedAt = Math.max(user.createdAt, listenee.createdAt);
                  var listeneeStubsRef = Fireb.ref.child("users").child(uid).child("listeneeStubs");
                  listeneeStubsRef.child(listeneeUserId).set({addedAt: addedAt});
                  var listenerStubsRef = Fireb.ref.child("users").child(listeneeUserId).child("listenerStubs");
                  listenerStubsRef.child(uid).set({addedAt: addedAt});
                });

                var subjects = listenees.slice(0,3).concat([uid])
                _.each(subjects,function(subjectUserId) {

                  // create messages on the subjects profile
                  for (var i = 0; i < SEED_MESSAGE_COUNT; i++) {
                    createMessage({
                      authorUserId: uid,
                      subjectUserId: subjectUserId,
                      text: faker.directive('lorem')('%w',40),
                      createdAt: recentDate()
                    }, function(error) {
                      console.log("got error");
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

  function signedInUserId() {
    return Fireb.signedInUserId();
  };

  function signedInUser() {
    return Fireb.signedInUser();
  };

  function signedIn() {
    return Fireb.signedIn();
  };

  function createdAtRelative(message) {
    return moment(message.createdAt).fromNow();
  };

  function showProfile(user, event) {
    if (user) {
      $state.go( "app.profile", { id: user.$id } );
    }
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }
  };

  function showListenButton(userStub) {
    return !isListeningTo(userStub) && userStub.$id != signedInUserId();
  };

  function showUnlistenButton(userStub) {
    return isListeningTo(userStub) && userStub.$id != signedInUserId();
  };

  function isListeningTo(userStub) {
    if (signedInUser()) {
      var keys = _.keys(signedInUser().listeneeStubs);
      return keys.indexOf(userStub.$id) != -1
    } else {
      return false;
    }
  };

  function startListeningTo(targetUser, event) {
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }

    // add new listenee to signed-in user
    var signedInUserRef = Fireb.ref.child("users").child(signedInUserId());
    signedInUserRef.child("listeneeStubs").child(targetUser.$id).set({addedAt: Date.now()});

    // add new listener to target user
    var targetUserRef = Fireb.ref.child("users").child(targetUser.$id);
    targetUserRef.child("listenerStubs").child(signedInUserId()).set({addedAt: Date.now()});
  };

  function stopListeningTo(targetUser, event) {
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }

    // remove listenee from signed-in user
    var signedInUserRef = Fireb.ref.child("users").child(signedInUserId());
    signedInUserRef.child("listeneeStubs").child(targetUser.$id).remove();

    // remove listener from target user
    var targetUserRef = Fireb.ref.child("users").child(targetUser.$id);
    targetUserRef.child("listenerStubs").child(signedInUserId()).remove();
  };


  function generateUsernameOnTheFly(scope, formName) {
    var ctrl = this;

    ctrl[formName] = {};
    scope.$watch('vm.name', function() {
      form = ctrl[formName];
      if (form.username && form.username.$pristine && !s.isBlank(ctrl.name)) {
        ctrl.username = ctrl.generateUsername(ctrl.name);
      }
    }, true);
  };

  function isCurrentState(stateName) {
    return $state.current.name == stateName;
  };

  function peopleLink() {
    return window.isCordova ? 'app.people.contacts' : 'app.people.listenees';
  };

  function createMessage(message, callback) {

    var mentionedUsernames = message.text.match(/(@\w+)/g) || [];
    var mentionedUserIds = [];
    var existingUsernames = [];
    var numUsernamesLeftToProcess = mentionedUsernames.length;

    if (mentionedUsernames.length > 0) {
      processExistingMentionedUsers();
    } else {
      storeMessage();
    }

    ////

    function processExistingMentionedUsers() {
      for (var i = 0; i < mentionedUsernames.length; i++ ) {
        var mentionedUsername = mentionedUsernames[i];
        usersRef = Fireb.ref.child("users").orderByChild("username").startAt(mentionedUsername).endAt(mentionedUsername);
        usersRef.once("value", function(snapshot) {
          var matchingUsers = snapshot.val();
          if (matchingUsers) {
            if (_.keys(matchingUsers).length != 1) {
              console.log("matching user count unexpectedly " + _.keys(matchingUsers).length);
            } else {
              var matchingUserId = _.keys(matchingUsers)[0];
              mentionedUserIds.push(matchingUserId);
              existingUsernames.push(mentionedUsername);
            }
          }
          processNewMentionedUsersIfReady();
        });
      }
    };

    function processNewMentionedUsersIfReady() {
      numUsernamesLeftToProcess--;
      if (numUsernamesLeftToProcess == 0) {
        processNewMentionedUsers();
      }
    }

    function processNewMentionedUsers() {
      newMentionedUsernames = _.difference(mentionedUsernames, existingUsernames);
      if (newMentionedUsernames.length == 0) {
        storeMessage();
        return;
      }
      numUsernamesLeftToProcess = newMentionedUsernames.length;
      for (var i = 0; i < newMentionedUsernames.length; i++ ) {
        mentionedUsername = newMentionedUsernames[i];
        var newUser = {
          username: mentionedUsername
        };
        createUser(newUser, function(error) {
          if (error) {
            console.log("got an error creating users");
          } else {
            mentionedUserIds.push(newUser.$id);
          }
          storeMessageIfReady();
        });
      }
    };

    function storeMessageIfReady() {
      numUsernamesLeftToProcess--;
      if (numUsernamesLeftToProcess == 0) {
        storeMessage();
      }
    };

    function storeMessage() {
      message = _.defaults(message, {
        authorUserId: signedInUserId(),
        createdAt: Date.now()
      });
      var messageRef = Fireb.ref.child("messages").push(message);
      var messageId = messageRef.key();

      createAssociatedMessageStubs(messageId);

      console.log("Succesfully created message with id " + messageId);
      if (callback) {
        callback();
      }
    };

    function createAssociatedMessageStubs(messageId) {
      var associatedUserIds = _.clone(mentionedUserIds);
      associatedUserIds.push(message.authorUserId);
      if (message.authorUserId != message.subjectUserId) {
        associatedUserIds.push(message.subjectUserId);
      }
      _.each(associatedUserIds, function(associatedUserId) {
        var profileMessageStubRef = Fireb.ref.child("users").child(associatedUserId).child("profileMessageStubs").child(messageId);
        profileMessageStubRef.set({createdAt: message.createdAt});
      });
      console.log("Succesfully added message stub for user profiles " + associatedUserIds.join());
    };

  };

  function createUser(user, callback) {
    user.email = s.isBlank(user.email) ? username.replace(/\@/,'') + "@users.getpublic.co" : user.email;
    user.password = s.isBlank(user.password) ? Math.random().toString().slice(2,12) : user.password;
    Fireb.ref.createUser(user, function(error, userData) {
      if (error) {
        console.log(error);
        callback(error);
        return;
      }
      console.log("Successfully created user account with uid:", userData.uid);

      user.username = s.isBlank(user.username) ? generateUsername(user.name) : user.username;
      user.face = s.isBlank(user.face) ?  generateFaceUrl(user.name, user.username) : user.face;
      user.admin = user.admin ? true : false;
      user.createdAt = user.createdAt || Date.now();

      Fireb.ref.child("users").child(userData.uid).set(user, function(error) {
        if (error) {
          console.log('error saving profile data', error);
        } else {
          console.log('successfully saved profile data');
        }
        user.$id = userData.uid;
        callback(error);
      })
    });
  };

  ////

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
    return "https://dummyimage.com/100x100/" + colorScheme.background + "/" + colorScheme.foreground + "&text=" + initials;
  };

  function recentDate() {
    return Date.now() - (Math.random() * 5 * 24 * 60 * 60 * 1000 );
  }

})

;
