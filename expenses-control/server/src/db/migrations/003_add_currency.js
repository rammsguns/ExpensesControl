exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.string('currency').defaultTo('USD');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('currency');
  });
};
