exports.up = function(knex) {
  return knex.schema
    .createTable('app_settings', function(table) {
      table.string('key').primary();
      table.string('value').notNullable();
      table.timestamps(true, true);
    })
    .then(() => {
      return knex('app_settings').insert({
        key: 'monthly_expense_limit',
        value: '100'
      });
    })
    .then(() => {
      return knex.schema.table('users', function(table) {
        table.boolean('is_premium').defaultTo(false);
        table.integer('monthly_expense_limit').defaultTo(100);
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .table('users', function(table) {
      table.dropColumn('is_premium');
      table.dropColumn('monthly_expense_limit');
    })
    .then(() => knex.schema.dropTableIfExists('app_settings'));
};
