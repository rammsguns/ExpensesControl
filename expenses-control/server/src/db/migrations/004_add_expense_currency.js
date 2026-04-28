exports.up = function(knex) {
  return knex.schema.table('expenses', function(table) {
    table.string('currency').defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.table('expenses', function(table) {
    table.dropColumn('currency');
  });
};
