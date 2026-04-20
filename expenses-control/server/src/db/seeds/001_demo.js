const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Clean up
  await knex('settlements').del();
  await knex('expense_splits').del();
  await knex('expenses').del();
  await knex('group_members').del();
  await knex('groups').del();
  await knex('users').del();

  const password = await bcrypt.hash('demo123', 10);

  // Create users
  const [aliceId] = await knex('users').insert({ name: 'Alice', email: 'alice@example.com', password });
  const [bobId] = await knex('users').insert({ name: 'Bob', email: 'bob@example.com', password });
  const [carlosId] = await knex('users').insert({ name: 'Carlos', email: 'carlos@example.com', password });

  // Create group
  const [groupId] = await knex('groups').insert({
    name: 'Trip to Cancún',
    description: 'Beach vacation expenses',
    created_by: aliceId
  });

  // Add members
  await knex('group_members').insert([
    { group_id: groupId, user_id: aliceId },
    { group_id: groupId, user_id: bobId },
    { group_id: groupId, user_id: carlosId }
  ]);

  // Expense 1: Dinner $90, Alice paid, equal split
  const [exp1] = await knex('expenses').insert({
    group_id: groupId, description: 'Dinner at La Parilla', amount: 90,
    paid_by: aliceId, split_type: 'equal'
  });
  await knex('expense_splits').insert([
    { expense_id: exp1, user_id: aliceId, amount: 30 },
    { expense_id: exp1, user_id: bobId, amount: 30 },
    { expense_id: exp1, user_id: carlosId, amount: 30 }
  ]);

  // Expense 2: Groceries $60, Alice paid, equal split
  const [exp2] = await knex('expenses').insert({
    group_id: groupId, description: 'Groceries for the Airbnb', amount: 60,
    paid_by: aliceId, split_type: 'equal'
  });
  await knex('expense_splits').insert([
    { expense_id: exp2, user_id: aliceId, amount: 20 },
    { expense_id: exp2, user_id: bobId, amount: 20 },
    { expense_id: exp2, user_id: carlosId, amount: 20 }
  ]);

  // Expense 3: Taxi $30, Bob paid, exact split (Bob 5, Carlos 25)
  const [exp3] = await knex('expenses').insert({
    group_id: groupId, description: 'Taxi from airport', amount: 30,
    paid_by: bobId, split_type: 'exact'
  });
  await knex('expense_splits').insert([
    { expense_id: exp3, user_id: bobId, amount: 5 },
    { expense_id: exp3, user_id: carlosId, amount: 25 }
  ]);

  // Expense 4: Hotel $210, Alice paid, shares split (Alice 2, Bob 1, Carlos 1)
  const [exp4] = await knex('expenses').insert({
    group_id: groupId, description: 'Hotel for 2 nights', amount: 210,
    paid_by: aliceId, split_type: 'shares'
  });
  await knex('expense_splits').insert([
    { expense_id: exp4, user_id: aliceId, amount: 105 },
    { expense_id: exp4, user_id: bobId, amount: 52.5 },
    { expense_id: exp4, user_id: carlosId, amount: 52.5 }
  ]);

  // Settlement: Bob pays Alice $25
  await knex('settlements').insert({
    group_id: groupId, from_user_id: bobId, to_user_id: aliceId, amount: 25
  });
};