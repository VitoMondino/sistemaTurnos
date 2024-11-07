const express = require('express');
const cors = require('cors');
const reservasRoutes = require('./routes/reservas');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use('/api/reservas', reservasRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});