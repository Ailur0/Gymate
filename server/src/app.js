import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import profileRouter from './routes/profile.routes.js';
import matchRouter from './routes/match.routes.js';
import likeRouter from './routes/like.routes.js';
import chatRouter from './routes/chat.routes.js';
import blockRouter from './routes/block.routes.js';
import moderationRouter from './routes/moderation.routes.js';
import analyticsRouter from './routes/analytics.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/profiles', profileRouter);
app.use('/api/matches', matchRouter);
app.use('/api/swipes', likeRouter);
app.use('/api/chats', chatRouter);
app.use('/api/blocks', blockRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/analytics', analyticsRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err); // eslint-disable-line no-console
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

export default app;
