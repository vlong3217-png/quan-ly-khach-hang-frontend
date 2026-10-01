import assert from 'node:assert';
import {
  getUsers,
  updateUserStatus,
  getUserAssignedData,
  handoverUserData,
} from './src/services/userService.ts';

console.log('========================================================================');
console.log('   KIỂM THỬ TỰ ĐỘNG USER STORY S1-10: KHÓA TÀI KHOẢN + BÀN GIAO DỮ LIỆU  ');
console.log('========================================================================');

async function runS110Tests() {
  // Test 1: Kiểm tra danh sách hiển thị trạng thái 'active' và 'locked'
  {
    console.log('\n[1] Kiểm tra danh sách hiển thị rõ ràng trạng thái Đang hoạt động / Đã khóa...');
    const res = await getUsers();
    assert.ok(res.success, 'Lấy danh sách người dùng thành công');
    assert.ok(res.users.length > 0, 'Danh sách không được rỗng');

    const activeUser = res.users.find((u) => u.status === 'active');
    const lockedUser = res.users.find((u) => u.status === 'locked');

    assert.ok(activeUser, 'Có tài khoản trạng thái active (Đang hoạt động)');
    assert.ok(lockedUser, 'Có tài khoản trạng thái locked (Đã khóa)');
    console.log(`✔ Test 1 PASS: User #${activeUser.id} (${activeUser.full_name}) trạng thái: ${activeUser.status}`);
    console.log(`              User #${lockedUser.id} (${lockedUser.full_name}) trạng thái: ${lockedUser.status}`);
  }

  // Test 2: Khóa tài khoản thành công (không kèm bàn giao)
  {
    console.log('\n[2] Kiểm tra chức năng: Khóa tài khoản (không kèm bàn giao dữ liệu)...');
    const targetUserId = 2; // Manager Trần Thị Bình
    const result = await updateUserStatus(targetUserId, 'LOCKED');

    assert.strictEqual(result.id, targetUserId);
    assert.strictEqual(result.status, 'LOCKED');
    assert.strictEqual(result.is_active, false);
    assert.ok(result.message.includes('Đã khóa tài khoản thành công'));
    assert.strictEqual(result.handover, null);

    // Xác nhận lại qua danh sách người dùng
    const list = await getUsers();
    const updatedUser = list.users.find((u) => u.id === targetUserId);
    assert.strictEqual(updatedUser?.status, 'locked');
    console.log(`✔ Test 2 PASS: Đã khóa thành công tài khoản #${targetUserId}. Trạng thái cập nhật: ${updatedUser?.status}`);
  }

  // Test 3: Mở khóa tài khoản thành công
  {
    console.log('\n[3] Kiểm tra chức năng: Mở khóa tài khoản đã bị khóa...');
    const targetUserId = 2;
    const result = await updateUserStatus(targetUserId, 'ACTIVE');

    assert.strictEqual(result.id, targetUserId);
    assert.strictEqual(result.status, 'ACTIVE');
    assert.strictEqual(result.is_active, true);
    assert.ok(result.message.includes('Đã mở khóa tài khoản thành công'));

    const list = await getUsers();
    const updatedUser = list.users.find((u) => u.id === targetUserId);
    assert.strictEqual(updatedUser?.status, 'active');
    console.log(`✔ Test 3 PASS: Đã mở khóa thành công tài khoản #${targetUserId}. Trạng thái cập nhật: ${updatedUser?.status}`);
  }

  // Test 4: Lấy danh sách dữ liệu/khách hàng đang phụ trách
  {
    console.log('\n[4] Kiểm tra chức năng: Truy vấn dữ liệu khách hàng do user phụ trách...');
    const itemsUser3 = await getUserAssignedData(3);
    assert.ok(Array.isArray(itemsUser3));
    assert.strictEqual(itemsUser3.length, 2, 'User 3 phụ trách 2 khách hàng');
    assert.strictEqual(itemsUser3[0].name, 'Công ty TNHH Ánh Dương');
    assert.strictEqual(itemsUser3[1].name, 'Tập đoàn Công nghệ Sao Mai');
    console.log(`✔ Test 4 PASS: User #3 đang phụ trách ${itemsUser3.length} khách hàng: "${itemsUser3[0].name}", "${itemsUser3[1].name}"`);
  }

  // Test 5: Khóa tài khoản kèm Bàn giao dữ liệu sang nhân viên khác
  {
    console.log('\n[5] Kiểm tra chức năng: Khóa tài khoản CÓ BÀN GIAO DỮ LIỆU sang nhân viên khác...');
    const sourceUserId = 3; // Lê Hoàng Cường (đang giữ 2 khách hàng)
    const targetUserId = 5; // Hoàng Thị Em (đang active)

    const result = await updateUserStatus(sourceUserId, 'LOCKED', targetUserId);
    assert.strictEqual(result.id, sourceUserId);
    assert.strictEqual(result.status, 'LOCKED');
    assert.strictEqual(result.is_active, false);
    assert.ok(result.handover, 'Phải có kết quả bàn giao dữ liệu');
    assert.strictEqual(result.handover?.success, true);
    assert.strictEqual(result.handover?.source_user_id, sourceUserId);
    assert.strictEqual(result.handover?.target_user_id, targetUserId);
    assert.strictEqual(result.handover?.transferred_items_count, 2);

    // Kiểm tra dữ liệu sau bàn giao: User 3 còn 0, User 5 nhận đủ
    const itemsUser3After = await getUserAssignedData(sourceUserId);
    const itemsUser5After = await getUserAssignedData(targetUserId);

    assert.strictEqual(itemsUser3After.length, 0, 'User 3 sau khi bàn giao còn 0 khách hàng');
    assert.ok(itemsUser5After.some((item) => item.name === 'Công ty TNHH Ánh Dương'));
    assert.ok(itemsUser5After.some((item) => item.name === 'Tập đoàn Công nghệ Sao Mai'));
    console.log(`✔ Test 5 PASS: Khóa user #${sourceUserId} và bàn giao thành công 2 khách hàng sang user #${targetUserId}`);
  }

  // Test 6: Bàn giao dữ liệu độc lập (Service handoverUserData)
  {
    console.log('\n[6] Kiểm tra dịch vụ bàn giao dữ liệu độc lập (handoverUserData)...');
    const resHandover = await handoverUserData(2, 7); // Từ user 2 sang user 7 (Đặng Thùy Giang)
    assert.strictEqual(resHandover.success, true);
    assert.strictEqual(resHandover.source_user_id, 2);
    assert.strictEqual(resHandover.target_user_id, 7);
    console.log(`✔ Test 6 PASS: Bàn giao dữ liệu độc lập thành công (${resHandover.transferred_items_count} mục chuyển giao)`);
  }

  // Test 7: Validation không thể bàn giao cho tài khoản đang bị khóa
  {
    console.log('\n[7] Kiểm tra validation: Chặn bàn giao dữ liệu cho tài khoản đang bị khóa...');
    try {
      // User 6 (Võ Đức Phúc) đang bị locked
      await handoverUserData(7, 6);
      assert.fail('Phải báo lỗi khi bàn giao cho tài khoản đang bị khóa');
    } catch (err) {
      assert.ok(err.message.includes('đang bị khóa'));
      console.log(`✔ Test 7 PASS: Bị từ chối chính xác: "${err.message}"`);
    }
  }

  // Test 8: Validation không thể bàn giao cho chính mình
  {
    console.log('\n[8] Kiểm tra validation: Chặn bàn giao dữ liệu cho chính mình...');
    try {
      await updateUserStatus(7, 'LOCKED', 7);
      assert.fail('Phải báo lỗi khi bàn giao cho chính mình');
    } catch (err) {
      assert.ok(err.message.includes('chính tài khoản này'));
      console.log(`✔ Test 8 PASS: Bị từ chối chính xác: "${err.message}"`);
    }
  }

  // Test 9: Xử lý User ID không tồn tại
  {
    console.log('\n[9] Kiểm tra xử lý lỗi khi thao tác trên User ID không tồn tại...');
    try {
      await updateUserStatus(9999, 'LOCKED');
      assert.fail('Phải báo lỗi khi user id không tồn tại');
    } catch (err) {
      assert.ok(err.message.includes('Không tìm thấy tài khoản') || err.message.includes('9999'));
      console.log(`✔ Test 9 PASS: Báo lỗi chính xác: "${err.message}"`);
    }
  }

  console.log('\n========================================================================');
  console.log('🎉 TOÀN BỘ 9 TEST CASES S1-10 FRONTEND ĐÃ VƯỢT QUA (100% PASS)!');
  console.log('========================================================================\n');
}

runS110Tests().catch((err) => {
  console.error('❌ Kiểm thử thất bại:', err);
  process.exit(1);
});
