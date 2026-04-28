exports.up = function(knex) {
  return knex.schema.createTable('group_invites', table => {
    table.increments('id');
    table.integer('group_id').notNullable().references('groups.id').onDelete('CASCADE');
    table.integer('created_by').notNullable().references('users.id');
    table.string('token', 16).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.integer('max_uses').defaultTo(10);
    table.integer('used_count').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('group_invites');
};
