const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    console.log("Returned User:", user);
    assert.equal(user.id, expectedUserID);
  });
  it('should return undefined with an invalid email', function() {
    const user = getUserByEmail("user1828472@msn.com", testUsers)
    const expectedUserID = "userRandomID";
    console.log("Returned User:", user);
    assert.isUndefined(user);
    });
  });