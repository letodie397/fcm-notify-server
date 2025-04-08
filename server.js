require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const app = express();

// Inicializa o Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
  databaseURL: 'https://appteste-dc435-default-rtdb.firebaseio.com/',
});

app.use(bodyParser.json());

// Endpoint para inscrever token no tópico "todos"
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

const db = admin.database();
const churchesRef = db.ref('churches');

let knownChurches = {};

// Observa mudanças no Firebase Realtime Database
churchesRef.on('value', (snapshot) => {
  const data = snapshot.val() || {};

  for (const [id, igreja] of Object.entries(data)) {
    const anterior = knownChurches[id];

    // Nova igreja
    if (!anterior) {
      console.log('📌 Igreja adicionada:', igreja);

      admin.messaging().send({
        topic: 'todos',
        notification: {
          title: 'Nova Igreja!',
          body: 'Uma igreja nova foi adicionada!',
        },
        data: {
          tipo: 'nova_igreja',
          igrejaId: id || '',
          nome: igreja.nome || ''
        }
      })
      .then(response => {
        console.log('✅ Notificação enviada:', response);
      })
      .catch(error => {
        console.error('❌ Erro ao enviar notificação:', error);
      });
    }

    // Mudança no autorizadoFilippi
    else {
      const antes = anterior.autorizadoFilippi || '';
      const depois = igreja.autorizadoFilippi || '';

      if (antes !== depois) {
        console.log(`🔄 Status de "${igreja.nome}" mudou de "${antes}" para "${depois}"`);

        let msg = '';
        if (depois === 'AUTORIZADO') {
          msg = 'Uma igreja foi AUTORIZADA!';
        } else if (depois === 'NEGADA') {
          msg = 'Uma igreja foi NEGADA!';
        }

        if (msg) {
          admin.messaging().send({
            topic: 'todos',
            notification: {
              title: 'Status Atualizado!',
              body: msg,
            },
            data: {
              tipo: 'status_atualizado',
              status: depois,
              igrejaId: id || '',
              nome: igreja.nome || ''
            }
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
