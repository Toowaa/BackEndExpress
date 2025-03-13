
import productsRoutes from './routes/products.routes.js';
import orderRoutes from './routes/order.routes.js';
import express from 'express';
import cors from 'cors';

const app = express();
const port = 8000;

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://mi-dominio.com'], // Especifica los dominios permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api', productsRoutes);
app.use('/api', orderRoutes);



app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get('/api', (req, res) => {
    const query = req.query;
    res.send(`Hello World! ${query.name}`);
});

app.post('/api', (req, res) => {
    const body = req.body;
    res.send(`Hello World! ${body.name}`);
});