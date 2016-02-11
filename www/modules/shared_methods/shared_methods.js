  angular.module('Publicapp.sharedMethods', [])

.service('SharedMethods', function($timeout, $state, Fireb, $ionicPopup, $ionicLoading, $ionicPopup, $firebaseObject, Fireb, $ionicModal) {

  return {
    createMessage: createMessage,
    createPasswordAuthAndUserObject: createPasswordAuthAndUserObject,
    isCurrentState: isCurrentState,
    isListeningTo: isListeningTo,
    reSeedDatabase: reSeedDatabase,
    showListenButton: showListenButton,
    showProfile: showProfile,
    showUnlistenButton: showUnlistenButton,
    signedIn: signedIn,
    signedInUser: signedInUser,
    signedInUserId: signedInUserId,
    startListeningTo: startListeningTo,
    startListeningToTargetBySource: startListeningToTargetBySource,
    stopListeningTo: stopListeningTo,
    toggleListeningTo: toggleListeningTo,
    showSpinner: showSpinner,
    hideSpinner: hideSpinner,
    goHome: goHome,
    primaryName: primaryName,
    paddedSecondaryName: paddedSecondaryName,
    search: search,
    identifier: identifier,
    generateUsernameOnTheFly: generateUsernameOnTheFly,
    openBlankAddUserModal: openBlankAddUserModal,
    closeAddUserModal: closeAddUserModal,
    placeholderMessage: placeholderMessage,
    addUserWithMessage: addUserWithMessage,
    authenticateAndAddUserWithMessage: authenticateAndAddUserWithMessage,
    authenticateAndGo: authenticateAndGo,
    firstNameOrUsername: firstNameOrUsername
  };

  // public methods

  function openBlankAddUserModal() {
    var ctrl = this;

    ctrl.sharedScope.vm = ctrl.sharedScope.vm || ctrl;
    $ionicModal.fromTemplateUrl('modules/people/add_user_modal.html', {
      scope: ctrl.sharedScope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      ctrl.modal = modal;
      ctrl.name = '';
      ctrl.email = '';
      ctrl.phone = '';
      ctrl.message = '';
      ctrl.modal.show();
      ctrl.sharedScope.$on('$destroy', function() {
        ctrl.modal.remove();
      });

    });
    ctrl.generateUsernameOnTheFly(ctrl.sharedScope);
  };

  function closeAddUserModal() {
    var ctrl = this;

    ctrl.name = '';
    ctrl.email = '';
    ctrl.phone = '';
    ctrl.message = '';
    ctrl.modal.hide();
  };

  function placeholderMessage() {
    var ctrl = this;

    return "Say something" + s.isBlank(ctrl.name) ? '' : 'to ' + ctrl.name.trim();
  };

  function authenticateAndGo(targetState) {
    var ctrl = this;

    if (ctrl.signedIn()) {
      $state.go(targetState);
    } else {
      // ask use if he wants to sign up or sign in
      ctrl.targetState = targetState
      var signUpOrSignInPopup = $ionicPopup.show({
        cssClass: 'popup-outer auth-view',
        templateUrl: 'modules/auth/sign_up_or_sign_in_popup.html',
        scope: ctrl.sharedScope,
        title: 'Please sign up with Public',
        buttons: [{
          text: '',
          type: 'close-popup ion-ios-close-outline'
        }]
      });

      ctrl.sharedScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        if (toState.name == ctrl.targetState) {
          if (signUpOrSignInPopup) {
            signUpOrSignInPopup.close();
          }
        }
      });
    }
  };

  function authenticateAndAddUserWithMessage() {
    var ctrl = this;

    ctrl.explanation = "In order to finish adding this user, you'll need to join Public."
    ctrl.authenticateAndGo("app.addingUser")

    // wait until authentication is complete to add the user
    ctrl.sharedScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      if (toState.name == 'app.addingUser') {
        if (ctrl.signUpOrSignInPopup) {
          ctrl.signUpOrSignInPopup.close();
          ctrl.signUpOrSignInPopup = null;
        }
        ctrl.addUserWithMessage();
      }
    });
  }

  function addUserWithMessage() {
    var ctrl = this;

    var user = {
      name: ctrl.name,
      email: ctrl.email,
      phone: ctrl.phone
    };
    Fireb.createUserObject(user, function(error, subject) {
      if (error) {
        console.log("got an error creating user", error);
        ctrl.errorMessage = error;
        return;
      }
      ctrl.startListeningTo(subject);
      ctrl.createMessage({
        subject: subject,
        text: ctrl.message
      }, function(error) {
        if (error) {
          console.log("got an error creating message", error);
        }
        ctrl.closeAddUserModal();
        $state.go( "app.profile.messages", { id: subject.id } );
      });
    });
  };

  function generateUsernameOnTheFly(scope) {
    var ctrl = this;

    ctrl.form = {};
    scope.$watch('vm.name', function() {
      form = ctrl.form;
      if (form.username && form.username.$pristine && !s.isBlank(ctrl.name)) {
        ctrl.username = Fireb.generateUsername(ctrl.name);
      }
    }, true);
  };

  function identifier(user) {
    if (s.isBlank(user.name) && s.isBlank(user.username)) {
      return 'this user';
    } if (s.isBlank(user.name)) {
      return user.username;
    } else if (s.isBlank(user.username)) {
      return user.name;
    } else {
      return user.name + " (" + user.username + ")";
    }
  };

  function firstNameOrUsername(user) {
    if (s.isBlank(user.name)) {
      return user.username;
    } else {
      return user.name.split(/ /)[0];
    }
  };

  function search() {
    var ctrl = this;

    ctrl.showSearchResults = false;
    ctrl.showSpinner("Searching...");
    var searchText = s.trim(ctrl.searchText).replace(/ +/g,' ').replace(/\@/,'').toLowerCase();
    var searchTextParts = searchText.split(/ /);
    if (searchTextParts.length == 0) {
      ctrl.errorMessage = "Please try again with more characters";
      ctrl.hideSpinner();
    } else if (searchTextParts.length == 1) {
      // do an partial search on username
      queryStart = "@" + searchTextParts[0];
      queryEnd = queryStart + "z";
      Fireb.ref().child("users").orderByChild("username").startAt(queryStart).endAt(queryEnd).once("value", function(snapshot) {
        ctrl.searchResults = _.values(snapshot.val());
        ctrl.showSearchResults = true;
        ctrl.hideSpinner();
      });
    } else {
      // do a partial search on searchableName
      queryStart = searchText;
      queryEnd = queryStart + "z";
      Fireb.ref().child("users").orderByChild("searchableName").startAt(queryStart).endAt(queryEnd).once("value", function(snapshot) {
        ctrl.searchResults = _.values(snapshot.val());
        ctrl.showSearchResults = true;
        ctrl.hideSpinner();
      });
    }
  };


  function primaryName(user) {
    return s.isBlank(user.name) ? user.username : user.name;
  };

  function paddedSecondaryName(user) {
    return s.isBlank(user.name) ? '' : ' ' + user.username;
  };

  function showSpinner(spinnerMessage) {
    $ionicLoading.show({
      template: '<ion-spinner icon="android"></ion-spinner><p style="margin: 5px 0 0 0;">' + spinnerMessage + '</p>'
    });
  };

  function hideSpinner() {
    $ionicLoading.hide();
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
      var usersRef = Fireb.ref().child("users");
      for (var i = 0; i < mentionedUsernames.length; i++) {
        var mentionedUsername = mentionedUsernames[i];
        usersRef.orderByChild("username").equalTo(mentionedUsername).once("value", function(snapshot) {
          var matchingUsers = snapshot.val();
          if (matchingUsers && _.keys(matchingUsers).length > 0) {
            if (_.keys(matchingUsers).length > 1) {
              console.log("matching user count unexpectedly " + _.keys(matchingUsers).length);
              matchingUsers = _.pick(matchingUsers, _.keys(matchingUsers).slice(0, 1)); // only user first match
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
      for (var i = 0; i < newMentionedUsernames.length; i++) {
        Fireb.createUserObject({
          username: newMentionedUsernames[i]
        }, function(error, newUser) {
          if (error) {
            console.log("got an error creating user with username", newMentionedUsernames[i]);
          } else {
            mentionedUsers[newUser.id] = newUser;
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
        var linkText = "<a profile-link='" + mentionedUserId + "'>" + nameAndUsername + "</a>";
        message.text = message.text.replace(re, linkText);
      });

      message.createdAt = message.createdAt || Date.now();
      if (!message.author) {
        message.author = signedInUser();
        if (!message.author) {
          console.log("signed in user is not set!!!!!!!!!!!");
        }
      }

      message = ensureCorrectFieldsPresent(message, ["author", "subject", "text", "createdAt"]);
      message.author = ensureCorrectFieldsPresent(message.author, ["name", "face", "id"], ["username"]);
      message.subject = ensureCorrectFieldsPresent(message.subject, ["name", "face", "id"], ["username"]);
      if (!message.author.id) {
        throw "message author needs an id!"
      }
      if (!message.subject.id) {
        throw "message subject needs an id!"
      }

      var usersRef = Fireb.ref().child("users");
      var ref = usersRef.child(message.author.id).child("profileMessages").push({});
      var messageId = ref.key();

      // add message to profiles of all users associated with this message
      var associatedUserIds = _.uniq([message.author.id, message.subject.id].concat(_.keys(mentionedUsers)));
      _.each(associatedUserIds, function(userId, index) {
        usersRef.child(userId).child("profileMessages").child(messageId).setWithPriority(message, 0 - message.createdAt);
      });

      // have author start listening to all other users associated with this message
      var otherUsers = _.uniq([message.subject].concat(_.values(mentionedUsers)), false, function(user) { return user.id; });
      _.each(otherUsers, function(otherUser) {
        startListeningToTargetBySource(message.author, otherUser, message.createdAt);
      });

      console.log("Succesfully added messages for user profiles " + associatedUserIds.join());
      if (callback) {
        callback();
      }
    };

  };

  function createPasswordAuthAndUserObject(user, callback) {
    user.email = s.isBlank(user.email) ? username.replace(/\@/, '') + "@users.getpublic.co" : user.email;
    user.password = s.isBlank(user.password) ? Math.random().toString().slice(2, 12) : user.password;

    Fireb.ref().createUser(user, function(error, userData) {
      if (error) {
        console.log(error);
        callback(error, null);
      } else {
        user.authId = userData.uid
        user.authProvider = "password"
        Fireb.createUserObject(user, callback);
      }
    });
  };

  function isCurrentState(stateName) {
    return $state.current.name == stateName;
  };

  function isListeningTo(user) {
    if (signedInUser()) {
      var keys = _.keys(signedInUser().listenees);
      return keys.indexOf(user.id) != -1
    } else {
      return false;
    }
  };


  function reSeedDatabase(fakeData) {
    if (!signedIn() || !signedInUser().admin) {
      console.log("only admins can re-seed the db!");
      return;
    }
    console.log("about to re-seed database");

    var nextStep;
    var remainingItemsInStep;
    var oldUsers;
    var newUsers = {};

    step1();

    function step1() {
      Fireb.ref().child("users").once("value", function(snapshot) {

        oldUsers = snapshot.val();
        nextStep = step2;
        remainingItemsInStep = _.keys(oldUsers).length;

        if (remainingItemsInStep == 0) {
          step2();
          return;
        }
        _.each(oldUsers, function(oldUser, userId) {
          if (s.isBlank(oldUser.email)) {
            nextStepIfDone();
          } else {
            Fireb.ref().removeUser({
              email: oldUser.email,
              password: "123"
            }, function(error) {
              if (error && !/The specified user does not exist/.test(error)) {
                console.log("unable to remove user auth!", error);
                // return;
              } else {
                console.log("successfully removed user auth with email " + oldUser.email);
              }
              nextStepIfDone();
            });
          }
        });
      });
    }

    function nextStepIfDone() {
      remainingItemsInStep--;
      if (remainingItemsInStep == 0) {
        nextStep();
      }
    };

    function step2() {
      console.log("removed all user auth records");
      Fireb.ref().child("users").remove();
      console.log("removed all user objects");

      var userDataRecords = [];

      // if (fakeData) {
      //   _.each(_.range(10), function() {
      //     userDataRecords.push({
      //       email: faker.directive('email')(),
      //       name: faker.directive('firstName')() + ' ' + faker.directive('lastName')(),
      //       phone: "+1" + faker.directive('phone')().replace(/\D/g, '').replace(/^(\d{10}).*/, '$1')
      //     });
      //   });
      // }
      //
      userDataRecords = userDataRecords.concat([{
          email: "jreitano@gmail.com",
          name: "John Reitano",
          phone: "+16196746211",
          admin: true
        }, {
          email: "sarmadhbokhari@gmail.com",
          name: "Sarmad Bokhari",
          phone: "+16196746211",
          admin: true
        }, {
          email: "jasminereitano7@gmail.com",
          name: "Jenny Rellis",
          phone: "+16196746211"
        }, {
          email: "jack@black.com",
          name: "Jack Black",
          phone: "+16196746211"
        }
      ]);

      nextStep = step3;
      remainingItemsInStep = userDataRecords.length;

      _.each(userDataRecords, function(userDataRecord) {
        _.extend(userDataRecord, {
          password: "123",
          username: Fireb.generateUsername(userDataRecord.name),
          createdAt: recentDate()
        });

        createPasswordAuthAndUserObject(userDataRecord, function(error, newUser) {
          if (error) {
            console.log("got error creating user", error)
          } else {
            if (newUsers[newUser.id]) {
              var x = 7;
            }
            newUsers[newUser.id] = newUser;
          }
          nextStepIfDone();
        });
      });
    };

    function step3() {
      if (!fakeData) {
        step4();
        return;
      }

      nextStep = step4;
      remainingItemsInStep = _.keys(newUsers).length;

      console.log("created " + remainingItemsInStep + " users")

      _.each(newUsers, function(user) {

        var otherUserIds = _.sample(_.without(_.keys(newUsers), user.id), 5);
        var subjectUserIds = [user.id].concat(otherUserIds);
        var subjects = _.pick(newUsers, subjectUserIds);

        _.each(subjects, function(subject, subjectUserId) {
          var mentionedUserId = _.sample(_.without(_.keys(newUsers), [user.id, subjectUserId]));
          var mentionedUser = newUsers[mentionedUserId];

          createMessage({
            author: user,
            subject: subject,
            text: "I'm a big fan of " + mentionedUser.username + " " + faker.directive('lorem')('%w', 40),
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

  function showListenButton(user) {
    return signedIn() && !isListeningTo(user) && user.id != signedInUserId();
  };

  function showProfile(user, event) {
    if (user) {
      $state.go("app.profile", {
        id: user.id
      });
    }
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }
  };

  function goHome(event) {
    if (event) {
      event.stopPropagation();
    }
    if (Fireb.signedIn()) {
      $state.go("app.profile.feed", {id: Fireb.signedInUserId(), reload: true});
    } else {
      $state.go("app.landing", {reload: true});
    }
  };

  function showUnlistenButton(user) {
    return signedIn() && isListeningTo(user) && user.id != signedInUserId();
  };

  function signedIn() {
    return Fireb.signedIn();
  };

  function signedInUser() {
    return Fireb.signedInUser();
  };

  function signedInUserId() {
    return Fireb.signedInUserId();
  };

  function toggleListeningTo(targetUser, event) {
    if (isListeningTo(targetUser, event)) {
      stopListeningTo(targetUser, event);
    } else {
      startListeningTo(targetUser, event);
    }
  };

  function startListeningTo(targetUser, event) {
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }

    startListeningToTargetBySource(signedInUser(), targetUser, Date.now());
  }

  function startListeningToTargetBySource(sourceUser, targetUser, addedAt) {
    // add new listenee to source user
    listeneeRecord = {
      id: targetUser.id,
      addedAt: addedAt,
      face: targetUser.face
    };
    if (!s.isBlank(targetUser.name)) {
      listeneeRecord.name = targetUser.name;
    }
    if (!s.isBlank(targetUser.username)) {
      listeneeRecord.username = targetUser.username;
    }
    var sourceUserRef = Fireb.ref().child("users").child(sourceUser.id);
    sourceUserRef.child("listenees").child(targetUser.id).set(listeneeRecord);

    // add new listener to target user
    listenerRecord = {
      id: sourceUser.id,
      addedAt: addedAt,
      face: sourceUser.face
    };
    if (!s.isBlank(sourceUser.name)) {
      listenerRecord.name = sourceUser.name;
    }
    if (!s.isBlank(sourceUser.username)) {
      listenerRecord.username = sourceUser.username;
    }
    var targetUserRef = Fireb.ref().child("users").child(targetUser.id);
    targetUserRef.child("listeners").child(sourceUser.id).set(listenerRecord);
  };

  function stopListeningTo(targetUser, event) {
    if (event) {
      event.stopPropagation(); // prevent ng-click of enclosing item from being processed
    }

    // remove listenee from signed-in user
    var signedInUserRef = Fireb.ref().child("users").child(signedInUserId());
    signedInUserRef.child("listenees").child(targetUser.id).remove();

    // remove listener from target user
    var targetUserRef = Fireb.ref().child("users").child(targetUser.id);
    targetUserRef.child("listeners").child(signedInUserId()).remove();
  };

  function ensureCorrectFieldsPresent(object, requiredKeys, optionalKeys) {

    var allowableKeys = requiredKeys.concat( optionalKeys );
    object = _.extendOwn({},object);
    object = _.pick(object, allowableKeys);
    _.each(requiredKeys, function(fieldName) {
      if (_.isUndefined(object[fieldName]) || _.isNull(object[fieldName])) {
        console.log("error: field " + fieldName + " missing from object", object);
      }
    });
    return object;
  };

  function recentDate() {
    return Date.now() - (Math.random() * 5 * 24 * 60 * 60 * 1000);
  };





})

;
