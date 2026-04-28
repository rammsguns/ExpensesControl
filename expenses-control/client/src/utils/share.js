export function canShare() {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

export async function shareExpense(expense, t, language) {
  const date = expense.date
    ? new Date(expense.date).toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const text = `${expense.description}: $${parseFloat(expense.amount).toFixed(2)} ${expense.currency || 'MXN'} ${t('paid_by')?.toLowerCase() || 'paid by'} ${expense.paid_by_name || 'Unknown'} ${language === 'es' ? 'el' : 'on'} ${date}`;

  if (canShare()) {
    try {
      await navigator.share({
        title: expense.description,
        text,
      });
      return { shared: true };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }

  // Fallback to clipboard
  const copied = await copyToClipboard(text);
  return { shared: false, copied };
}

export async function shareGroup(group, inviteLink, t, language) {
  const title = group?.name || (language === 'es' ? 'Invitación a grupo' : 'Group invite');
  const text = language === 'es'
    ? `Únete a mi grupo "${group?.name}" en ExpensesControl: ${inviteLink}`
    : `Join my group "${group?.name}" on ExpensesControl: ${inviteLink}`;

  if (canShare()) {
    try {
      await navigator.share({ title, text });
      return { shared: true };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }

  // Fallback to clipboard
  const copied = await copyToClipboard(text);
  return { shared: false, copied };
}

export async function shareApp(language) {
  const title = language === 'es' ? 'ExpensesControl' : 'ExpensesControl';
  const text = language === 'es'
    ? 'Organiza y divide gastos con amigos con ExpensesControl. ¡Descárgala aquí: https://expensescontrol.app!'
    : 'Split expenses with friends using ExpensesControl. Get it here: https://expensescontrol.app!';

  if (canShare()) {
    try {
      await navigator.share({ title, text });
      return { shared: true };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }

  // Fallback to clipboard
  const copied = await copyToClipboard(text);
  return { shared: false, copied };
}
