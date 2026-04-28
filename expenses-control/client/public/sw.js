self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {
    title: 'ExpensesControl',
    body: 'New notification',
    icon: '/vite.svg',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/vite.svg',
      badge: '/vite.svg',
      data: data.data || {},
    }),
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'complete' === client.readyState) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    }),
  );
});
