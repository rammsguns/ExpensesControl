exports.seed = async function(knex) {
  // Check if settings already exist
  const existing = await knex('app_settings').where('key', 'monthly_expense_limit').first();
  if (existing) {
    console.log('Settings already seeded, skipping...');
    return;
  }

  await knex('app_settings').insert([
    { key: 'monthly_expense_limit', value: '100' }
  ]);
  console.log('Seeded app_settings with monthly_expense_limit=100');
};
