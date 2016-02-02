angular.module('Publicapp.sharedMethods', [])

.service('SharedMethods', function($timeout, $state, Fireb){

  return {
    reSeedDatabase: reSeedDatabase,
    signedInUserId: signedInUserId,
    signedInUser: signedInUser,
    signedIn: signedIn,
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

    var nextStep;
    var remainingItemsInStep;
    var newUsers = {};

    step1();

    function step1() {
      Fireb.ref.child("users").once("value", function(snapshot) {

        var oldUsers = snapshot.val();
        if (!oldUsers) {
          step2();
          return;
        }

        nextStep = step2;
        remainingItemsInStep = _.keys(oldUsers).length;

        _.each(oldUsers, function(oldUser, userId) {
          Fireb.ref.removeUser({email: oldUser.emailCopy, password: "123"}, function(error) {
            if (error && !/The specified user does not exist/.test(error)) {
              console.log("unable to remove user!", error);
              // return;
            } else {
              console.log("successfully removed user with email " + oldUser.email);
            }
            nextStepIfDone();
          });
        });
      });
    }

    function nextStepIfDone() {
      remainingItemsInStep--;
      if (remainingItemsInStep <= 0) {
        nextStep();
      }
    };

    function step2() {
      console.log("removed all users!");
      Fireb.ref.child("users").remove();
      Fireb.ref.child("messages").remove(); // TODO: remove this

      var userDataRecords = [];
      _.each(_.range(3), function() {
        userDataRecords.push({
          email: faker.directive('email')(),
          name: faker.directive('firstName')() + ' ' + faker.directive('lastName')(),
          phone: "+1" + faker.directive('phone')().replace(/\D/g,'').replace(/^(\d{10}).*/,'$1')
        });
      });

      userDataRecords = userDataRecords.concat([
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

      nextStep = step3;
      remainingItemsInStep = userDataRecords.length;

      _.each(userDataRecords, function(userDataRecord) {
        _.extend(userDataRecord, {
          password: "123",
          username: generateUsername(userDataRecord.name),
          createdAt: recentDate()
        });

        createUser(userDataRecord, function(error, userId) {
          if (error) {
            console.log("got error creating user", error)
          } else {
            newUsers[userId] = userDataRecord;
          }
          nextStepIfDone();
        });
      });
    };

    function step3() {

      nextStep = step4;
      remainingItemsInStep = _.keys(newUsers).length;

      console.log("created " + remainingItemsInStep.length + " users")

      _.each(newUsers, function(user, userId) {

        var otherUserIds = _.sample(_.without(_.keys(newUsers),userId), 5);
        var subjectUserIds = [userId].concat(otherUserIds);
        var subjects = _.pick(newUsers, subjectUserIds);

        _.each(subjects, function(subject, subjectUserId) {
          var mentionedUserId = _.sample(_.without(_.keys(newUsers),[userId, subjectUserId]));
          var mentionedUser = newUsers[mentionedUserId];

          createMessage({
            author: user,
            authorUserId: userId,
            subject: subject,
            subjectUserId: subjectUserId,
            text: "I'm a big fan of " + mentionedUser.username + " " + faker.directive('lorem')('%w',40),
            createdAt: recentDate()
          }, function(error) {
            if (error) {
              console.log("got error", error);
            }
            nextStepIfDone();
          });
        });
      });
    };

    function step4() {
      console.log("database successfully re-seeded");
    };

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

  function showProfile(user, event) {
    if (user) {
      $state.go( "app.profile", { id: user.$id } );
    }
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }
  };

  function showListenButton(user) {
    return !isListeningTo(user) && user.$id != signedInUserId();
  };

  function showUnlistenButton(user) {
    return isListeningTo(user) && user.$id != signedInUserId();
  };

  function isListeningTo(user) {
    if (signedInUser()) {
      var keys = _.keys(signedInUser().listenees);
      return keys.indexOf(user.$id) != -1
    } else {
      return false;
    }
  };

  function startListeningTo(targetUser, event) {
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }

    startListeningToTargetBySource(signedInUser(), targetUser, Date.now());
  }

  function startListeningToTargetBySource(sourceUser, targetUser, addedAt) {
    sourceUserId = sourceUser.$id || sourceUser.userId || signedInUserId();
    targetUserId = targetUser.$id || targetUser.userId

    // add new listenee to source user
    listeneeRecord = {addedAt: addedAt, name: targetUser.name, username: targetUser.username, face: targetUser.face};
    var sourceUserRef = Fireb.ref.child("users").child(sourceUserId);
    sourceUserRef.child("listenees").child(targetUserId).set(listeneeRecord);

    // add new listener to target user
    listenerRecord = {addedAt: addedAt, name: sourceUser.name, username: sourceUser.username, face: sourceUser.face};
    var targetUserRef = Fireb.ref.child("users").child(targetUserId);
    targetUserRef.child("listeners").child(sourceUserId).set(listenerRecord);
  };

  function stopListeningTo(targetUser, event) {
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }

    // remove listenee from signed-in user
    var signedInUserRef = Fireb.ref.child("users").child(signedInUserId());
    signedInUserRef.child("listenees").child(targetUser.$id).remove();

    // remove listener from target user
    var targetUserRef = Fireb.ref.child("users").child(targetUser.$id);
    targetUserRef.child("listeners").child(signedInUserId()).remove();
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
    return ionic.Platform.isWebView() ? 'app.people.contacts' : 'app.people.listenees';
  };

  function createMessage(message, callback) {

    var mentionedUsernames = message.text.match(/(@\w+)/g) || [];
    var mentionedUsers = {};
    var existingUsernames = [];
    var numUsernamesLeftToProcess = mentionedUsernames.length;

    if (mentionedUsernames.length > 0) {
      processExistingMentionedUsers();
    } else {
      storeMessage();
    }

    ////

    function processExistingMentionedUsers() {
      var usersRef = Fireb.ref.child("users");
      for (var i = 0; i < mentionedUsernames.length; i++ ) {
        var mentionedUsername = mentionedUsernames[i];
        usersRef.orderByChild("username").equalTo(mentionedUsername).once("value", function(snapshot) {
          var matchingUsers = snapshot.val();
          if (matchingUsers && _.keys(matchingUsers).length > 0) {
            if (_.keys(matchingUsers).length > 1) {
              console.log("matching user count unexpectedly " + _.keys(matchingUsers).length);
              matchingUsers = _.pick(matchingUsers, _.keys(matchingUsers).slice(0,1)); // only user first match
            }
            _.extend(mentionedUsers, matchingUsers);
            existingUsernames.push(mentionedUsername);
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
        createUser(newUser, function(error, uid) {
          if (error) {
            console.log("got an error creating users");
          } else {
            mentionedUsers[uid] = newUser;
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
      // convert usernames to profile-link tags
      _.each(mentionedUsers, function(mentionedUser, mentionedUserId) {
        var re = new RegExp(mentionedUser.username, 'ig');
        var nameAndUsername = s.isBlank(mentionedUser.name) ? mentionedUser.name + " " + mentionedUser.username : mentionedUser.username;
        var linkText = "<profile-link uid='" + mentionedUserId + "'>" + nameAndUsername + "</profile-link>";
        message.text = message.text.replace( re, linkText);
      });

      message.createdAt = message.createdAt || Date.now();
      if (message.author) {
        message.author.userId = message.authorUserId;
      } else {
        message.author = signedInUser();
        message.author.userId = message.signedInUserId();
      }
      message.subject.userId = message.subjectUserId;

      messageFields = [ "author", "subject", "text", "createdAt"];
      message = _.pick(message, messageFields);
      _.each(messageFields, function(field) {
        if (!message[field]) {
          console.log("error: field " + field + " missing from message");
        }
      });

      userFields = ["name", "username", "face", "userId"];
      message.author = _.pick(message.author, userFields);
      _.each(userFields, function(field) {
        if (!message.author[field]) {
          console.log("error: field " + field + " missing from message author");
        }
      });
      message.subject = _.pick(message.subject, userFields);
      _.each(userFields, function(field) {
        if (!message.subject[field]) {
          console.log("error: field " + field + " missing from message subject");
        }
      });

      var usersRef = Fireb.ref.child("users");
      var ref = usersRef.child(message.author.userId).child("profileMessages").push({});
      var messageId = ref.key();

      var mentionedUserIds = _.keys(mentionedUsers);
      var associatedUserIds = _.uniq([message.author.userId, message.subject.userId].concat(mentionedUserIds));
      _.each(associatedUserIds, function(associatedUserId, index) {
        usersRef.child(associatedUserId).child("profileMessages").child(messageId).set(message);
      });

      if (message.author.userId != message.subject.userId) {
        startListeningToTargetBySource(message.author, message.subject, message.createdAt);
      }

      console.log("Succesfully added messages for user profiles " + associatedUserIds.join());
      if (callback) {
        callback();
      }
    };

  };

  function createUser(user, callback) {
    user.email = s.isBlank(user.email) ? username.replace(/\@/,'') + "@users.getpublic.co" : user.email;
    user.password = s.isBlank(user.password) ? Math.random().toString().slice(2,12) : user.password;
    Fireb.ref.createUser(user, function(error, userData) {
      if (error) {
        console.log(error);
        callback(error, null);
        return;
      }
      console.log("Successfully created user account with uid:", userData.uid);

      user.username = s.isBlank(user.username) ? generateUsername(user.name) : user.username;
      user.face = s.isBlank(user.face) ?  generateFaceUrl(user.name, user.username) : user.face;
      user.admin = user.admin ? true : false;
      user.createdAt = user.createdAt || Date.now();
      user.emailCopy = user.email
      fields = [ "admin", "createdAt", "name", "username", "face", "phone", "emailCopy"];
      var sanitizedUUser = _.pick(user, fields);
      _.each(fields, function(field) {
        if (_.isUndefined(sanitizedUUser[field]) || _.isNull(sanitizedUUser[field])) {
          console.log("error: field " + field + " missing from user");
        }
      });

      Fireb.ref.child("users").child(userData.uid).set(sanitizedUUser, function(error) {
        if (error) {
          console.log('error saving profile data', error);
        } else {
          console.log('successfully saved profile data');
        }
        callback(error, userData.uid);
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
