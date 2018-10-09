import { Server } from './server';

/* tslint:disable-next-line no-unused-expression */
new Server(process.env.SCRIPTS_REPO || 'localhost');
