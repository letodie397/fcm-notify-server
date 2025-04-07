const admin = require('firebase-admin');
const serviceAccount = require('./appteste-dc435-firebase-adminsdk-fbsvc-c8919342b5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const fcm = admin.messaging();

const message = {
  notification: {
    title: 'Teste direto!',
    body: 'Essa é uma notificação enviada manualmente ao tópico "todos".'
  },
  topic: 'todos'
};

fcm.send(message)
  .then(response => {
    console.log('✅ Notificação enviada:', response);
  })
  .catch(error => {
    console.error('❌ Erro ao enviar:', error);
  });
