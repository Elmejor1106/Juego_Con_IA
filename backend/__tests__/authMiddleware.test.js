const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

const { authenticateToken } = require('../middleware/authMiddleware');

function mockReq(headers = {}) {
	return { headers };
}

function mockRes() {
	return {
		statusCode: 200,
		status(code) {
			this.statusCode = code; return this;
		},
		json(payload) {
			this.payload = payload; return this;
		}
	};
}

function mockNext() {
	const fn = jest.fn();
	return fn;
}

describe('authenticateToken middleware', () => {
	beforeEach(() => jest.clearAllMocks());

	test('responds 401 when no Authorization header', () => {
		const req = mockReq();
		const res = mockRes();
		const next = mockNext();

		authenticateToken(req, res, next);

		expect(res.statusCode).toBe(401);
		expect(next).not.toHaveBeenCalled();
	});

	test('responds 403 when token invalid', () => {
		const req = mockReq({ authorization: 'Bearer invalid' });
		const res = mockRes();
		const next = mockNext();

		jwt.verify.mockImplementation((token, secret, cb) => cb(new Error('invalid')));

		authenticateToken(req, res, next);

		expect(res.statusCode).toBe(403);
		expect(next).not.toHaveBeenCalled();
	});

	test('calls next when token valid', () => {
		const req = mockReq({ authorization: 'Bearer valid' });
		const res = mockRes();
		const next = mockNext();

		jwt.verify.mockImplementation((token, secret, cb) => cb(null, { id: 1, email: 'a@a.com' }));

		authenticateToken(req, res, next);

		expect(res.statusCode).toBe(200);
		expect(req.user).toEqual({ id: 1, email: 'a@a.com' });
		expect(next).toHaveBeenCalled();
	});
});


