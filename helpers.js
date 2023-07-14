const getUserByEmail = function (email, database) {
  for (const userID in database) {
    if (database[userID].email === email) {
      return database[userID];
    }
  }
  return undefined;
};

module.exports = {getUserByEmail};