exports.up = function(knex) {
  return knex.schema.createTable('webauthn_credentials', function(table) {
    table.string('id').primary(); // credential ID
    table.integer('user_id').unsigned().notNullable();
    table.text('public_key').notNullable();
    table.integer('counter').defaultTo(0);
    table.text('transports'); // JSON array
    table.text('device_name').nullable();
    table.datetime('created_at').defaultTo(knex.fn.now());
    table.datetime('last_used_at').nullable();

    table.index('user_id');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('webauthn_credentials');
};