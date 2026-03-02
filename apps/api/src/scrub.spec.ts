import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './modules';

describe('scrub', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  it('redacts secrets', async () => {
    const res = await request(app.getHttpServer()).post('/telemetry/crash').send({ token: 'abcdefghijklmnop123456' });
    expect(res.body.scrubbed).toContain('[REDACTED]');
  });
  afterAll(async () => app.close());
});
