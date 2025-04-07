const admin = require('firebase-admin');
const serviceAccount = require('./appteste-dc435-firebase-adminsdk-fbsvc-c8919342b5.json');

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://appteste-dc435-default-rtdb.firebaseio.com'
});

const db = admin.database();
const fcm = admin.messaging();

// Envia notificação para o tópico "todos"
function enviarNotificacao(title, body) {
  const message = {
    notification: {
      title,
      body
    },
    topic: 'todos'
  };

  fcm.send(message)
    .then(response => {
      console.log('✅ Notificação enviada:', response);
    })
    .catch(error => {
      console.error('❌ Erro ao enviar notificação:', error);
    });
}

// Detecta igreja nova
db.ref('churches').on('child_added', snapshot => {
  const dados = snapshot.val();
  console.log('📌 Igreja adicionada:', dados);
  enviarNotificacao('Igreja Nova!', 'Uma igreja nova foi adicionada!');
});

// Detecta mudança no autorizadofilippi
db.ref('churches').on('child_changed', snapshot => {
  const dados = snapshot.val();
  const status = dados.autorizadofilippi;

  console.log('🔄 Igreja alterada:', dados.nome || 'sem nome');

  if (status === 'AUTORIZADO') {
    enviarNotificacao('Igreja Alterada!', 'Uma igreja foi AUTORIZADA!');
  } else if (status === 'NEGADA') {
    enviarNotificacao('Igreja Alterada!', 'Uma igreja foi NEGADA!');
  }
});
