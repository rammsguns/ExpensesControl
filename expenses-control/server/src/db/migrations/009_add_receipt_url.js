exports.up = function(knex) {
  return knex.schema.table('expenses', function(table) {
    table.string('receipt_url');
  });
};

exports.down = function(knex) {
  return knex.schema.table('expenses', function(table) {
    table.dropColumn('receipt_url');
  });
};
