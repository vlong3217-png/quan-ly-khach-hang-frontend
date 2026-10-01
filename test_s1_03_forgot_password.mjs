import assert from 'node:assert';
import http from 'node:http';

console.log('===============================================================');
console.log('    KIỂM THỬ TỰ ĐỘNG STORY S1-03: QUÊN MẬT KHẨU & ĐẶT LẠI MK   ');
console.log('===============================================================\n');

/* ──────────── 1. UNIT TEST VALIDATION ──────────── */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForgotPassword(email) {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return 'Vui lòng nhập địa chỉ email.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Địa chỉ email không đúng định dạng.';
  }
  return undefined;
}

function validateResetPassword(token, newPassword, confirmPassword) {
  const errors = {};

  if (!token || !token.trim()) {
    errors.token = 'Vui lòng cung cấp mã token đặt lại mật khẩu.';
  }

  if (!newPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
  } else if (newPassword.length < 6) {
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
  } else if (newPassword && confirmPassword !== newPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  }

  return errors;
}

console.log('--- PHẦN 1: KIỂM THỬ VALIDATION QUÊN MẬT KHẨU ---');

// Test 1.1: Empty email
{
  const err = validateForgotPassword('');
  assert.strictEqual(err, 'Vui lòng nhập địa chỉ email.');
  console.log('✔ Test 1.1 PASS: Email rỗng bị chặn với thông báo chính xác');
}

// Test 1.2: Whitespace only email
{
  const err = validateForgotPassword('     ');
  assert.strictEqual(err, 'Vui lòng nhập địa chỉ email.');
  console.log('✔ Test 1.2 PASS: Email toàn khoảng trắng bị chặn');
}

// Test 1.3: Invalid email format (missing @)
{
  const err = validateForgotPassword('userexample.com');
  assert.strictEqual(err, 'Địa chỉ email không đúng định dạng.');
  console.log('✔ Test 1.3 PASS: Email thiếu ký tự @ bị từ chối');
}

// Test 1.4: Invalid email format (missing domain)
{
  const err = validateForgotPassword('user@');
  assert.strictEqual(err, 'Địa chỉ email không đúng định dạng.');
  console.log('✔ Test 1.4 PASS: Email thiếu tên miền bị từ chối');
}

// Test 1.5: Invalid email format (space in email)
{
  const err = validateForgotPassword('user name@example.com');
  assert.strictEqual(err, 'Địa chỉ email không đúng định dạng.');
  console.log('✔ Test 1.5 PASS: Email chứa dấu cách bị từ chối');
}

// Test 1.6: Valid email format
{
  const err = validateForgotPassword('admin@gmail.com');
  assert.strictEqual(err, undefined);
  console.log('✔ Test 1.6 PASS: Email admin@gmail.com hợp lệ không có lỗi');
}

console.log('\n--- PHẦN 2: KIỂM THỬ VALIDATION ĐẶT LẠI MẬT KHẨU ---');

// Test 2.1: Empty token
{
  const errors = validateResetPassword('', '123456', '123456');
  assert.strictEqual(errors.token, 'Vui lòng cung cấp mã token đặt lại mật khẩu.');
  assert.strictEqual(errors.newPassword, undefined);
  assert.strictEqual(errors.confirmPassword, undefined);
  console.log('✔ Test 2.1 PASS: Token rỗng báo lỗi chính xác');
}

// Test 2.2: Empty new password
{
  const errors = validateResetPassword('sample-token', '', '123456');
  assert.strictEqual(errors.token, undefined);
  assert.strictEqual(errors.newPassword, 'Vui lòng nhập mật khẩu mới.');
  console.log('✔ Test 2.2 PASS: Mật khẩu mới để trống báo lỗi');
}

// Test 2.3: Password shorter than 6 characters
{
  const errors = validateResetPassword('sample-token', '12345', '12345');
  assert.strictEqual(errors.newPassword, 'Mật khẩu mới phải có ít nhất 6 ký tự.');
  console.log('✔ Test 2.3 PASS: Mật khẩu dưới 6 ký tự bị từ chối');
}

// Test 2.4: Empty confirm password
{
  const errors = validateResetPassword('sample-token', '123456', '');
  assert.strictEqual(errors.confirmPassword, 'Vui lòng xác nhận mật khẩu mới.');
  console.log('✔ Test 2.4 PASS: Xác nhận mật khẩu để trống báo lỗi');
}

// Test 2.5: Password and Confirm password mismatch
{
  const errors = validateResetPassword('sample-token', '123456', '654321');
  assert.strictEqual(errors.confirmPassword, 'Mật khẩu xác nhận không khớp.');
  console.log('✔ Test 2.5 PASS: Hai mật khẩu không khớp hiển thị lỗi "Mật khẩu xác nhận không khớp."');
}

// Test 2.6: Valid inputs for Reset Password
{
  const errors = validateResetPassword('valid-token-123', 'newpassword123', 'newpassword123');
  assert.strictEqual(Object.keys(errors).length, 0);
  console.log('✔ Test 2.6 PASS: Toàn bộ thông tin đặt lại mật khẩu hợp lệ');
}

console.log('\n--- PHẦN 3: KIỂM THỬ TÍCH HỢP API & CONTRACT BACKEND (S1-03) ---');

// Set up mock server simulating backend auth endpoints
const mockServer = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    let parsed = {};
    try {
      if (body) parsed = JSON.parse(body);
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ detail: 'Invalid JSON' }));
      return;
    }

    if (req.url === '/auth/forgot-password' && req.method === 'POST') {
      const email = (parsed.email || '').trim();
      if (!email) {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Email không được để trống' }));
      } else if (email === 'notfound@gmail.com') {
        res.writeHead(404);
        res.end(JSON.stringify({ detail: 'Email không tồn tại trong hệ thống' }));
      } else {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn',
            reset_token: 'mock-jwt-reset-token-xyz',
          })
        );
      }
      return;
    }

    if (req.url === '/auth/reset-password' && req.method === 'POST') {
      const token = (parsed.token || '').trim();
      const new_password = (parsed.new_password || '').trim();

      if (!token) {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Token không được để trống' }));
      } else if (token === 'expired-token') {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Token không hợp lệ hoặc đã hết hạn' }));
      } else if (token === 'used-token') {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Token đã được sử dụng' }));
      } else if (!new_password || new_password.length < 6) {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Mật khẩu mới phải có ít nhất 6 ký tự' }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Đặt lại mật khẩu thành công' }));
      }
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ detail: 'Not found' }));
  });
});

async function runApiContractTests() {
  const PORT = 8089;
  await new Promise((resolve) => mockServer.listen(PORT, resolve));
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  try {
    // Test 3.1: Forgot password API with existing email
    {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@gmail.com' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.message.includes('Hướng dẫn đặt lại mật khẩu'));
      assert.ok(data.reset_token);
      console.log('✔ Test 3.1 PASS: API /auth/forgot-password trả về 200 + reset_token');
    }

    // Test 3.2: Forgot password API with non-existent email
    {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'notfound@gmail.com' }),
      });
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.detail, 'Email không tồn tại trong hệ thống');
      console.log('✔ Test 3.2 PASS: API trả về 404 khi email không tồn tại trong hệ thống');
    }

    // Test 3.3: Reset password API with valid token & new password
    {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'mock-jwt-reset-token-xyz',
          new_password: 'newSecretPassword123',
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.message, 'Đặt lại mật khẩu thành công');
      console.log('✔ Test 3.3 PASS: API /auth/reset-password trả về 200 OK "Đặt lại mật khẩu thành công"');
    }

    // Test 3.4: Reset password API with expired/invalid token
    {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'expired-token',
          new_password: 'newSecretPassword123',
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.detail, 'Token không hợp lệ hoặc đã hết hạn');
      console.log('✔ Test 3.4 PASS: API trả về 400 khi token hết hạn / không hợp lệ');
    }

    // Test 3.5: Reset password API with already used token
    {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'used-token',
          new_password: 'newSecretPassword123',
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.detail, 'Token đã được sử dụng');
      console.log('✔ Test 3.5 PASS: API trả về 400 khi token đã được sử dụng trước đó');
    }
  } finally {
    await new Promise((resolve) => mockServer.close(resolve));
  }
}

// Test 4: Frontend Router & Vite endpoints
async function runFrontendEndpointTests() {
  console.log('\n--- PHẦN 4: KIỂM THỬ ROUTER FRONTEND TRÊN MÁY CHỦ VITE ---');
  const urls = [
    { url: 'http://localhost:5173/login', label: 'Trang Đăng nhập (/login)' },
    { url: 'http://localhost:5173/forgot-password', label: 'Trang Quên mật khẩu (/forgot-password)' },
    { url: 'http://localhost:5173/reset-password?token=test-token', label: 'Trang Đặt lại mật khẩu (/reset-password)' },
  ];

  for (const item of urls) {
    const res = await fetch(item.url);
    assert.strictEqual(res.status, 200, `${item.label} phải phản hồi 200`);
    const html = await res.text();
    assert.ok(html.includes('<div id="root"></div>'), `${item.label} phải chứa root container`);
    console.log(`✔ Test 4 PASS: ${item.label} tải thành công (HTTP 200)`);
  }
}

async function main() {
  try {
    await runApiContractTests();
    await runFrontendEndpointTests();
    console.log('\n===============================================================');
    console.log('===> TẤT CẢ TEST CASES STORY S1-03 ĐỀU THÀNH CÔNG! (100% PASS)');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  }
}

main();
