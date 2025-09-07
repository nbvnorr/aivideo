import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('/auth/register (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user.email).toBe('test@example.com');
          authToken = res.body.token;
          userId = res.body.user.id;
        });
    });

    it('/auth/login (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('/auth/login (POST) - invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Videos', () => {
    beforeAll(async () => {
      // Register and login to get auth token
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'videouser',
          email: 'video@example.com',
          password: 'password123',
        });
      
      authToken = registerResponse.body.token;
      userId = registerResponse.body.user.id;
    });

    it('/videos (POST) - create video', () => {
      return request(app.getHttpServer())
        .post('/videos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Video',
          script: 'This is a test video script',
          hashtags: ['test', 'video'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('video');
          expect(res.body.video.title).toBe('Test Video');
          expect(res.body.video.status).toBe('draft');
        });
    });

    it('/videos (GET) - get user videos', () => {
      return request(app.getHttpServer())
        .get('/videos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('videos');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(Array.isArray(res.body.videos)).toBe(true);
        });
    });

    it('/videos (GET) - unauthorized access', () => {
      return request(app.getHttpServer())
        .get('/videos')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });

    it('should handle validation errors', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: '', // Invalid: empty username
          email: 'invalid-email', // Invalid: malformed email
          password: '123', // Invalid: too short
        })
        .expect(400);
    });
  });
});
