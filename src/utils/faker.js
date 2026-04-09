const { faker } = require('@faker-js/faker');

// We wrap faker here so we can potentially add deterministic seeding logic later
// E.g., setting the seed based on an incoming request parameter.

module.exports = { faker };
