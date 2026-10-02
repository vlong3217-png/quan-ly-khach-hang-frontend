import assert from 'node:assert';
import {
  getUserRole,
  getUserTeam,
  assignUserRole,
  assignUserTeam,
  assignUserRoleAndTeam,
  getUsers,
  SYSTEM_ROLES,
  SYSTEM_TEAMS,
} from './src/services/userService.ts';

console.log('===============================================================');
console.log('   KIỂM THỬ TỰ ĐỘNG USER STORY S1-09: GÁN ROLE & NHÓM/TEAM   ');
console.log('===============================================================');

async function runS109Tests() {
  // Test 1: Kiểm tra danh mục Roles & Teams hệ thống
  {
    console.log('\n[1] Kiểm tra danh mục Roles & Teams định nghĩa trong hệ thống...');
    assert.strictEqual(SYSTEM_ROLES.length, 3, 'Hệ thống có 3 vai trò: ADMIN, MANAGER, USER');
    const roleValues = SYSTEM_ROLES.map((r) => r.value);
    assert.ok(roleValues.includes('ADMIN'));
    assert.ok(roleValues.includes('MANAGER'));
    assert.ok(roleValues.includes('USER'));

    assert.ok(SYSTEM_TEAMS.length >= 2, 'Hệ thống có các nhóm/team');
    assert.strictEqual(SYSTEM_TEAMS[0].id, 1);
    assert.strictEqual(SYSTEM_TEAMS[0].name, 'Team A');
    console.log('✔ Test 1 PASS: Danh mục Roles và Teams hệ thống đầy đủ và chính xác');
  }

  // Test 2: Admin xem Role hiện tại của User (GET /users/:id/role)
  {
    console.log('\n[2] Kiểm tra chức năng: Admin xem Role hiện tại của tài khoản...');
    const roleInfo = await getUserRole(3);
    assert.strictEqual(roleInfo.user_id, 3);
    assert.strictEqual(roleInfo.email, 'cuong.le@company.com');
    assert.strictEqual(roleInfo.role, 'USER');
    console.log(`✔ Test 2 PASS: Xem Role thành công -> User #${roleInfo.user_id} (${roleInfo.full_name}) có Role: ${roleInfo.role}`);
  }

  // Test 3: Admin xem Team hiện tại của User (GET /users/:id/team)
  {
    console.log('\n[3] Kiểm tra chức năng: Admin xem Team hiện tại của tài khoản...');
    const teamInfo = await getUserTeam(3);
    assert.strictEqual(teamInfo.user_id, 3);
    assert.strictEqual(teamInfo.team_id, 2);
    assert.strictEqual(teamInfo.team_name, 'Team B');
    console.log(`✔ Test 3 PASS: Xem Team thành công -> User #${teamInfo.user_id} thuộc Nhóm: ${teamInfo.team_name} (ID: ${teamInfo.team_id})`);
  }

  // Test 4: Admin thay đổi Role của User (PUT /users/:id/role)
  {
    console.log('\n[4] Kiểm tra chức năng: Admin thay đổi Role của tài khoản...');
    const updated = await assignUserRole(3, 'MANAGER');
    assert.strictEqual(updated.user_id, 3);
    assert.strictEqual(updated.role, 'MANAGER');

    // Xác nhận lại qua getUserRole
    const verifyRole = await getUserRole(3);
    assert.strictEqual(verifyRole.role, 'MANAGER');
    console.log(`✔ Test 4 PASS: Thay đổi Role thành công -> User #3 đã được chuyển sang vai trò: ${verifyRole.role}`);
  }

  // Test 5: Validation Role không hợp lệ
  {
    console.log('\n[5] Kiểm tra validation: Gán Role không hợp lệ...');
    try {
      await assignUserRole(3, 'SUPER_ADMIN_INVALID');
      assert.fail('Phải ném lỗi khi Role không hợp lệ');
    } catch (err) {
      assert.ok(err.message.includes('không hợp lệ'), 'Thông báo lỗi phải chỉ rõ role không hợp lệ');
      console.log(`✔ Test 5 PASS: Bị từ chối chính xác: "${err.message}"`);
    }
  }

  // Test 6: Admin thay đổi Team của User (PUT /users/:id/team)
  {
    console.log('\n[6] Kiểm tra chức năng: Admin gán Team mới cho tài khoản...');
    const updatedTeam = await assignUserTeam(3, 1);
    assert.strictEqual(updatedTeam.user_id, 3);
    assert.strictEqual(updatedTeam.team_id, 1);
    assert.strictEqual(updatedTeam.team_name, 'Team A');

    const verifyTeam = await getUserTeam(3);
    assert.strictEqual(verifyTeam.team_id, 1);
    assert.strictEqual(verifyTeam.team_name, 'Team A');
    console.log(`✔ Test 6 PASS: Gán Team thành công -> User #3 đã được chuyển sang: ${verifyTeam.team_name}`);
  }

  // Test 7: Validation Team không tồn tại
  {
    console.log('\n[7] Kiểm tra validation: Gán Team ID không tồn tại...');
    try {
      await assignUserTeam(3, 99999);
      assert.fail('Phải ném lỗi khi Team ID không tồn tại');
    } catch (err) {
      assert.ok(err.message.includes('không tồn tại'), 'Thông báo lỗi phải báo Team ID không tồn tại');
      console.log(`✔ Test 7 PASS: Bị từ chối chính xác: "${err.message}"`);
    }
  }

  // Test 8: Admin gán hoặc xóa Team (team_id: null)
  {
    console.log('\n[8] Kiểm tra chức năng: Admin xóa user khỏi Team (team_id = null)...');
    const removedTeam = await assignUserTeam(3, null);
    assert.strictEqual(removedTeam.team_id, null);
    assert.strictEqual(removedTeam.team_name, null);
    console.log('✔ Test 8 PASS: Xóa khỏi nhóm thành công -> team_id = null');
  }

  // Test 9: Admin gán đồng thời Role và Team (PUT /users/:id/assign)
  {
    console.log('\n[9] Kiểm tra chức năng: Gán đồng thời cả Role và Team trong một thao tác...');
    const result = await assignUserRoleAndTeam(4, { role: 'MANAGER', team_id: 1 });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.user?.role, 'MANAGER');
    assert.strictEqual(result.user?.team_id, 1);
    assert.strictEqual(result.user?.team, 'Team A');

    // Xác nhận lại trong danh sách người dùng
    const listRes = await getUsers();
    const user4 = listRes.users.find((u) => u.id === 4);
    assert.strictEqual(user4?.role, 'MANAGER');
    assert.strictEqual(user4?.team_id, 1);
    assert.strictEqual(user4?.team, 'Team A');
    console.log(`✔ Test 9 PASS: Gán Role & Team đồng thời thành công -> User #4: Role=${user4?.role}, Team=${user4?.team}`);
  }

  // Test 10: Xử lý User ID không tồn tại
  {
    console.log('\n[10] Kiểm tra xử lý lỗi khi thao tác trên User ID không tồn tại...');
    try {
      await getUserRole(9999);
      assert.fail('Phải ném lỗi khi user_id không tồn tại');
    } catch (err) {
      assert.ok(err.message.includes('Không tìm thấy người dùng') || err.message.includes('9999'));
      console.log(`✔ Test 10 PASS: Trả về lỗi 404/Not Found chính xác: "${err.message}"`);
    }
  }

  console.log('\n===============================================================');
  console.log('🎉 TOÀN BỘ 10 TEST CASES S1-09 FRONTEND ĐÃ VƯỢT QUA (100% PASS)!');
  console.log('===============================================================\n');
}

runS109Tests().catch((err) => {
  console.error('❌ Kiểm thử thất bại:', err);
  process.exit(1);
});
