import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './modules';

describe('API integration', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('thingworx verify mock', async () => {
    const res = await request(app.getHttpServer()).post('/thingworx/verify').send({ baseUrl: 'http://localhost:3000/mock-thingworx', appKey: '12345678' });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  it('rag query returns citations', async () => {
    const auth = await request(app.getHttpServer()).get('/auth/callback');
    const cookie = auth.headers['set-cookie'][0];
    const res = await request(app.getHttpServer()).post('/rag/query').set('Cookie', cookie).send({ query: 'ThingWorx service?' });
    expect(res.status).toBe(201);
    expect(res.body.citations.length).toBeGreaterThan(0);
  });

  afterAll(async () => { await app.close(); });
});
