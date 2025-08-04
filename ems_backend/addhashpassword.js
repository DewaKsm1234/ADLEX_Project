const bcrypt = require('bcrypt');

bcrypt.hash('Super123', 10, function(err, hash) {
  console.log(hash);  // Copy this output
});
