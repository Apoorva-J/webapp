import app from '../server.js';
import request from 'supertest';
import {expect} from 'chai';

describe("GET /healthz", () => {
  it("It should respond with status 200", async () => {
    const response = await request(app).get("/v1/healthz");
    expect(response.status).equal(204);
  });
});
