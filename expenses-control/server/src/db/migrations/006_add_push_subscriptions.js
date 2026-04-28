exports.up = function(knex) {
  return knex.schema.createTable('push_subscriptions', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.text('endpoint').notNullable().unique();
    table.text('p256dh').notNullable();
    table.text('auth').notNullable();
    table.datetime('created_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('push_subscriptions');
};
