
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { 
    title: 'Taller Peter', 
    body: 'Tienes una nueva notificación de mantenimiento.' 
  };

  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/1048/1048339.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/1048/1048339.png',
    vibrate: [200, 100, 200],
    data: {
      url: self.location.origin
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
