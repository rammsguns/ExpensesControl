exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.integer('max_groups').defaultTo(10);
    table.integer('max_members_per_group').defaultTo(2);
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('max_groups');
    table.dropColumn('max_members_per_group');
  });
};
