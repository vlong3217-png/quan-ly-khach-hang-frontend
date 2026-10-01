import assert from 'node:assert';

function validateForm(data) {
  const errors = {};

  if (!data.email.trim()) {
    errors.email = 'Vui lòng nhập email hoặc tên đăng nhập.';
  }

  if (!data.password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  }

  return errors;
}

console.log('--- BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG FRONTEND VALIDATION ---');

// Test 1: Empty email and password
{
  const errors = validateForm({ email: '', password: '', rememberMe: false });
  assert.strictEqual(errors.email, 'Vui lòng nhập email hoặc tên đăng nhập.');
  assert.strictEqual(errors.password, 'Vui lòng nhập mật khẩu.');
  console.log('✔ Test 1 PASS: Form rỗng hiển thị đủ 2 lỗi email và mật khẩu');
}

// Test 2: Whitespace email
{
  const errors = validateForm({ email: '   ', password: '123' });
  assert.strictEqual(errors.email, 'Vui lòng nhập email hoặc tên đăng nhập.');
  assert.strictEqual(errors.password, undefined);
  console.log('✔ Test 2 PASS: Email toàn dấu cách bị từ chối');
}

// Test 3: Username input
{
  const errors = validateForm({ email: 'admin', password: 'password123' });
  assert.strictEqual(Object.keys(errors).length, 0);
  console.log('✔ Test 3 PASS: Nhập tên đăng nhập (username) hợp lệ');
}

// Test 4: Email input
{
  const errors = validateForm({ email: 'admin@gmail.com', password: 'password123' });
  assert.strictEqual(Object.keys(errors).length, 0);
  console.log('✔ Test 4 PASS: Nhập email hợp lệ');
}

// Test 5: Missing password
{
  const errors = validateForm({ email: 'admin', password: '' });
  assert.strictEqual(errors.password, 'Vui lòng nhập mật khẩu.');
  assert.strictEqual(errors.email, undefined);
  console.log('✔ Test 5 PASS: Thiếu mật khẩu hiển thị thông báo lỗi chính xác');
}

console.log('===> TOÀN BỘ 5 TEST CASES FRONTEND VALIDATION ĐÃ VƯỢT QUA! (PASSED)\n');
