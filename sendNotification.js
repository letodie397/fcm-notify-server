const admin = require('firebase-admin');
const serviceAccount = require('./appteste-dc435-firebase-adminsdk-fbsvc-c8919342b5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://appteste-dc435.firebaseio.com'
});

const db = admin.database();
const fcm = admin.messaging();

const enviarNotificacao = (titulo, corpo) => {
  const mensagem = {
    notification: {
      title: titulo,
      body: corpo,
    },
    topic: 'todos' // Envia para todos os dispositivos inscritos no tópico 'todos'
  };

  fcm.send(mensagem)
    .then(response => {
      console.log('Notificação enviada:', response);
    })
    .catch(error => {
      console.error('Erro ao enviar notificação:', error);
    });
};

// 1️⃣ Detectar nova igreja
db.ref('igrejas').on('child_added', snapshot => {
  const igreja = snapshot.val();
  console.log('Nova igreja:', igreja);
  enviarNotificacao('Igreja Nova!', 'Uma igreja nova foi adicionada!');
});

// 2️⃣ Detectar mudança no autorizadofilippi
db.ref('igrejas').on('child_changed', snapshot => {
  const igreja = snapshot.val();
  const autorizado = igreja.autorizadofilippi;

  if (autorizado === 'AUTORIZADO') {
    enviarNotificacao('Igreja Alterada!', 'Uma igreja foi AUTORIZADA!');
  } else if (autorizado === 'NEGADA') {
    enviarNotificacao('Igreja Alterada!', 'Uma igreja foi NEGADA!');
  }
});
