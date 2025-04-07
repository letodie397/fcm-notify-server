require('dotenv').config(); // 🔐 Carrega variáveis do .env
const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const app = express();

// 🔑 Inicializa Firebase Admin com a chave do .env
admin.initializeApp({
  credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
  databaseURL: 'https://appteste-dc435-default-rtdb.firebaseio.com/',
});

app.use(bodyParser.json());

// 🔔 Endpoint para inscrever token no tópico "todos"
app.post('/inscrever-no-topico', (req, res) => {
  const token = req.body.token;

  admin.messaging().subscribeToTopic([token], 'todos')
    .then(() => {
      console.log('✅ Token inscrito no tópico com sucesso');
      res.status(200).send('Inscrito no tópico com sucesso');
    })
    .catch((error) => {
      console.error('❌ Erro ao inscrever no tópico:', error);
      res.status(500).send('Erro ao inscrever no tópico');
    });
});

// 🔁 Monitoramento do Firebase Realtime Database
const db = admin.database();
const churchesRef = db.ref('churches');

let knownChurches = {};

churchesRef.on('value', (snapshot) => {
  const data = snapshot.val() || {};

  for (const [id, igreja] of Object.entries(data)) {
    if (!knownChurches[id]) {
      console.log('📌 Igreja adicionada:', igreja);

      admin.messaging().send({
        topic: 'todos',
        notification: {
          title: 'Nova Igreja!',
          body: 'Uma igreja nova foi adicionada!',
        },
      })
      .then(response => {
        console.log('✅ Notificação enviada:', response);
      })
      .catch(error => {
        console.error('❌ Erro ao enviar notificação:', error);
      });
    } else {
      const statusAntes = knownChurches[id].autorizadofilippi;
      const statusDepois = igreja.autorizadofilippi;

      if (statusAntes !== statusDepois) {
        console.log('🔄 Igreja alterada:', igreja.nome);

        let msg = '';
        if (statusDepois === 'AUTORIZADO') {
          msg = 'Uma igreja foi AUTORIZADA!';
        } else if (statusDepois === 'NEGADA') {
          msg = 'Uma igreja foi NEGADA!';
        }

        if (msg) {
          admin.messaging().send({
            topic: 'todos',
            notification: {
              title: 'Status Atualizado!',
              body: msg,
            },
          })
          .then(response => {
            console.log('✅ Notificação enviada:', response);
          })
          .catch(error => {
            console.error('❌ Erro ao enviar notificação:', error);
          });
        }
      }
    }
  }

  knownChurches = data;
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
