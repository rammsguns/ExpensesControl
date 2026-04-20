exports.up = function(knex) {
  return knex.schema
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.string('two_factor_secret');
      table.boolean('two_factor_enabled').defaultTo(false);
      table.timestamps(true, true);
    })
    .createTable('groups', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('description');
      table.string('type').defaultTo('other'); // home, trip, couple, other
      table.integer('created_by').unsigned().references('users.id').onDelete('CASCADE');
      table.timestamps(true, true);
    })
    .createTable('group_members', function(table) {
      table.increments('id').primary();
      table.integer('group_id').unsigned().references('groups.id').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE');
      table.unique(['group_id', 'user_id']);
    })
    .createTable('expenses', function(table) {
      table.increments('id').primary();
      table.integer('group_id').unsigned().references('groups.id').onDelete('CASCADE');
      table.integer('paid_by').unsigned().references('users.id').onDelete('CASCADE');
      table.string('description').notNullable();
      table.decimal('amount', 14, 2).notNullable();
      table.string('split_type').notNullable(); // 'equal', 'percentage', 'shares', 'exact'
      table.timestamps(true, true);
    })
    .createTable('expense_splits', function(table) {
      table.increments('id').primary();
      table.integer('expense_id').unsigned().references('expenses.id').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE');
      table.decimal('amount', 14, 2).notNullable();
      table.decimal('share_value', 14, 2); // For percentage or shares
    })
    .createTable('settlements', function(table) {
      table.increments('id').primary();
      table.integer('group_id').unsigned().references('groups.id').onDelete('CASCADE');
      table.integer('from_user_id').unsigned().references('users.id').onDelete('CASCADE');
      table.integer('to_user_id').unsigned().references('users.id').onDelete('CASCADE');
      table.decimal('amount', 14, 2).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('settlements')
    .dropTableIfExists('expense_splits')
    .dropTableIfExists('expenses')
    .dropTableIfExists('group_members')
    .dropTableIfExists('groups')
    .dropTableIfExists('users');
};
