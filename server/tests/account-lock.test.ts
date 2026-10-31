import assert from 'node:assert/strict';
import test from 'node:test';
import { userController } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { db } from '../models/db.js';
import { generateAccessToken } from '../utils/jwt.js';
import type { IUser } from '../types/index.js';

function createResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    }
  };
}

test('Admin khóa và mở khóa tài khoản có hiệu lực với token đang tồn tại', async () => {
  const originalUsers = db.users;
  const originalSyncUser = db.syncUser;
  const admin: IUser = {
    ...originalUsers.find(user => user.role === 'ADMIN')!,
    id: 'admin_lock_test',
    isActive: true
  };
  const target: IUser = {
    ...originalUsers.find(user => user.role === 'USER')!,
    id: 'user_lock_test',
    isActive: true
  };

  db.users = [admin, target];
  db.syncUser = async (user: IUser) => {
    const index = db.users.findIndex(item => item.id === user.id);
    if (index >= 0) db.users[index] = user;
  };

  try {
    const token = generateAccessToken(target);
    const lockResponse = createResponse();
    await userController.toggleUserStatus({
      params: { id: target.id },
      body: { status: 'LOCKED' },
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
    } as never, lockResponse as never);

    assert.equal(lockResponse.statusCode, 200);
    assert.equal(db.users.find(user => user.id === target.id)?.isActive, false);

    const blockedResponse = createResponse();
    let blockedRequestContinued = false;
    authenticateToken({ headers: { authorization: `Bearer ${token}` } } as never, blockedResponse as never, () => {
      blockedRequestContinued = true;
    });
    assert.equal(blockedResponse.statusCode, 403);
    assert.equal(blockedRequestContinued, false);

    const unlockResponse = createResponse();
    await userController.toggleUserStatus({
      params: { id: target.id },
      body: { status: 'ACTIVE' },
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
    } as never, unlockResponse as never);

    assert.equal(unlockResponse.statusCode, 200);
    assert.equal(db.users.find(user => user.id === target.id)?.isActive, true);

    const activeResponse = createResponse();
    let activeRequestContinued = false;
    authenticateToken({ headers: { authorization: `Bearer ${token}` } } as never, activeResponse as never, () => {
      activeRequestContinued = true;
    });
    assert.equal(activeRequestContinued, true);
  } finally {
    db.users = originalUsers;
    db.syncUser = originalSyncUser;
  }
});
