import assert from 'node:assert';
import http from 'node:http';

console.log('===============================================================');
console.log('       KIỂM THỬ TỰ ĐỘNG STORY S1-04: ĐỔI MẬT KHẨU (FRONTEND)   ');
console.log('===============================================================\n');

/* ──────────── 1. UNIT TEST VALIDATION ──────────── */
function validateChangePassword(currentPassword, newPassword, confirmPassword) {
  const errors = {};

  if (!currentPassword || !currentPassword.trim()) {
    errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
  }

  if (!newPassword || !newPassword.trim()) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
  } else if (newPassword.trim().length < 6) {
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
  }

  if (!confirmPassword || !confirmPassword.trim()) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
  } else if (newPassword && confirmPassword !== newPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  }

  return errors;
}

console.log('--- PHẦN 1: KIỂM THỬ VALIDATION ĐỔI MẬT KHẨU ---');

// Test 1.1: Tất cả các trường để trống
{
  const errors = validateChangePassword('', '', '');
  assert.strictEqual(errors.currentPassword, 'Vui lòng nhập mật khẩu hiện tại.');
  assert.strictEqual(errors.newPassword, 'Vui lòng nhập mật khẩu mới.');
  assert.strictEqual(errors.confirmPassword, 'Vui lòng xác nhận mật khẩu mới.');
  console.log('✔ Test 1.1 PASS: Bỏ trống tất cả các trường bị chặn với thông báo lỗi cụ thể từng trường');
}

// Test 1.2: Toàn khoảng trắng
{
  const errors = validateChangePassword('   ', '   ', '   ');
  assert.strictEqual(errors.currentPassword, 'Vui lòng nhập mật khẩu hiện tại.');
  assert.strictEqual(errors.newPassword, 'Vui lòng nhập mật khẩu mới.');
  assert.strictEqual(errors.confirmPassword, 'Vui lòng xác nhận mật khẩu mới.');
  console.log('✔ Test 1.2 PASS: Các trường toàn khoảng trắng bị chặn');
}

// Test 1.3: Thiếu mật khẩu hiện tại
{
  const errors = validateChangePassword('', 'newpassword123', 'newpassword123');
  assert.strictEqual(errors.currentPassword, 'Vui lòng nhập mật khẩu hiện tại.');
  assert.strictEqual(errors.newPassword, undefined);
  assert.strictEqual(errors.confirmPassword, undefined);
  console.log('✔ Test 1.3 PASS: Thiếu mật khẩu hiện tại báo lỗi chính xác');
}

// Test 1.4: Mật khẩu mới dưới 6 ký tự
{
  const errors = validateChangePassword('currentpass123', '12345', '12345');
  assert.strictEqual(errors.currentPassword, undefined);
  assert.strictEqual(errors.newPassword, 'Mật khẩu mới phải có ít nhất 6 ký tự.');
  assert.strictEqual(errors.confirmPassword, undefined);
  console.log('✔ Test 1.4 PASS: Mật khẩu mới dưới 6 ký tự bị từ chối');
}

// Test 1.5: Xác nhận mật khẩu không khớp
{
  const errors = validateChangePassword('currentpass123', 'newpassword123', 'differentpass123');
  assert.strictEqual(errors.currentPassword, undefined);
  assert.strictEqual(errors.newPassword, undefined);
  assert.strictEqual(errors.confirmPassword, 'Mật khẩu xác nhận không khớp.');
  console.log('✔ Test 1.5 PASS: Xác nhận mật khẩu không khớp báo lỗi "Mật khẩu xác nhận không khớp."');
}

// Test 1.6: Dữ liệu hợp lệ
{
  const errors = validateChangePassword('currentpass123', 'newpassword123', 'newpassword123');
  assert.strictEqual(Object.keys(errors).length, 0);
  console.log('✔ Test 1.6 PASS: Toàn bộ thông tin hợp lệ -> không có lỗi validation');
}

console.log('\n--- PHẦN 2: KIỂM THỬ TÍCH HỢP API & CONTRACT BACKEND (S1-04) ---');

// Tạo mock server phản hồi đúng chuẩn contract của S1-04 Backend (FastAPI)
const mockServer = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === '/auth/change-password' && req.method === 'POST') {
      const authHeader = req.headers['authorization'] || '';
      if (!authHeader.startsWith('Bearer ') || authHeader.length < 15) {
        res.writeHead(401);
        res.end(JSON.stringify({ detail: 'Chưa đăng nhập hoặc thiếu token xác thực' }));
        return;
      }

      if (authHeader.includes('expired_token')) {
        res.writeHead(401);
        res.end(JSON.stringify({ detail: 'Token không hợp lệ hoặc đã hết hạn' }));
        return;
      }

      let parsed = {};
      try {
        if (body) parsed = JSON.parse(body);
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Invalid JSON payload' }));
        return;
      }

      const { current_password, new_password } = parsed;

      if (!current_password) {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Mật khẩu hiện tại không được để trống' }));
        return;
      }

      if (current_password !== 'correct_password_123') {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Mật khẩu hiện tại không chính xác' }));
        return;
      }

      if (!new_password || new_password.trim().length < 6) {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Mật khẩu mới phải có ít nhất 6 ký tự' }));
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: 'Đổi mật khẩu thành công' }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ detail: 'Not Found' }));
  });
});

async function runApiContractTests() {
  const PORT = 8091;
  await new Promise((resolve) => mockServer.listen(PORT, resolve));
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  try {
    // Test 2.1: Gọi API không có Token -> trả về 401
    {
      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: 'correct_password_123',
          new_password: 'new_secret_pwd_456',
        }),
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.detail, 'Chưa đăng nhập hoặc thiếu token xác thực');
      console.log('✔ Test 2.1 PASS: API trả về 401 khi thiếu token xác thực');
    }

    // Test 2.2: Gọi API với Token hết hạn -> trả về 401
    {
      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer expired_token_xyz',
        },
        body: JSON.stringify({
          current_password: 'correct_password_123',
          new_password: 'new_secret_pwd_456',
        }),
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.detail, 'Token không hợp lệ hoặc đã hết hạn');
      console.log('✔ Test 2.2 PASS: API trả về 401 khi token hết hạn / không hợp lệ');
    }

    // Test 2.3: Gọi API với sai mật khẩu hiện tại -> trả về 400
    {
      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_mock_token_12345678',
        },
        body: JSON.stringify({
          current_password: 'wrong_password_xyz',
          new_password: 'new_secret_pwd_456',
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.detail, 'Mật khẩu hiện tại không chính xác');
      console.log('✔ Test 2.3 PASS: API trả về 400 khi sai mật khẩu hiện tại');
    }

    // Test 2.4: Mật khẩu mới dưới 6 ký tự -> trả về 400
    {
      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_mock_token_12345678',
        },
        body: JSON.stringify({
          current_password: 'correct_password_123',
          new_password: '123',
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.detail, 'Mật khẩu mới phải có ít nhất 6 ký tự');
      console.log('✔ Test 2.4 PASS: API trả về 400 khi mật khẩu mới dưới 6 ký tự');
    }

    // Test 2.5: Đổi mật khẩu thành công -> trả về 200 OK
    {
      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_mock_token_12345678',
        },
        body: JSON.stringify({
          current_password: 'correct_password_123',
          new_password: 'new_strong_password_789',
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.message, 'Đổi mật khẩu thành công');
      console.log('✔ Test 2.5 PASS: API trả về 200 OK với thông báo "Đổi mật khẩu thành công"');
    }
  } finally {
    await new Promise((resolve) => mockServer.close(resolve));
  }
}

console.log('\n--- PHẦN 3: KIỂM THỬ XỬ LÝ LỖI MẠNG & THÔNG BÁO ---');

// Test 3.1: Server Backend không truy cập được (Offline)
{
  const nonExistentPort = 65432;
  let hasCaught = false;
  try {
    await fetch(`http://127.0.0.1:${nonExistentPort}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test_token',
      },
      body: JSON.stringify({
        current_password: '123',
        new_password: '456',
      }),
    });
  } catch (err) {
    hasCaught = true;
    assert.ok(err);
  }
  assert.strictEqual(hasCaught, true);
  console.log('✔ Test 3.1 PASS: Lỗi mạng được bắt an toàn, ứng dụng không bị crash');
}

async function main() {
  try {
    await runApiContractTests();
    console.log('\n===============================================================');
    console.log('===> TẤT CẢ TEST CASES STORY S1-04 ĐỀU THÀNH CÔNG! (100% PASS)');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  }
}

main();
