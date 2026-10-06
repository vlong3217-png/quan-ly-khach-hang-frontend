import assert from 'node:assert';

console.log('===============================================================');
console.log('    KIỂM THỬ TỰ ĐỘNG STORY S3-05: CÔNG TY MẸ - CÔNG TY CON     ');
console.log('===============================================================\n');

// Mock data & In-memory simulation of customerService parent-child logic
const mockCustomers = [
  { id: 'c-1', code: 'KH-001', name: 'Tập đoàn Hòa Bình', status: 'ACTIVE_CUSTOMER' },
  { id: 'c-2', code: 'KH-002', name: 'Công ty CP Xây dựng Alpha (Con)', status: 'ACTIVE_CUSTOMER' },
  { id: 'c-3', code: 'KH-003', name: 'Công ty CP Bất động sản Beta (Con)', status: 'IN_TRANSACTION' },
  { id: 'c-4', code: 'KH-004', name: 'Công ty Độc lập Gamma', status: 'POTENTIAL' },
];

const mockDeals = [
  { id: 'd-1', customer_id: 'c-1', value: 100_000_000, status: 'CLOSED_WON' },
  { id: 'd-2', customer_id: 'c-2', value: 50_000_000, status: 'CLOSED_WON' },
  { id: 'd-3', customer_id: 'c-3', value: 30_000_000, status: 'CLOSED_WON' },
  { id: 'd-4', customer_id: 'c-3', value: 20_000_000, status: 'OPEN' }, // Không tính vì chưa CLOSED_WON
  { id: 'd-5', customer_id: 'c-4', value: 40_000_000, status: 'CLOSED_WON' },
];

let relations = [];

function isDescendant(targetId, potentialAncestorId) {
  const queue = relations.filter((r) => r.parent_id === potentialAncestorId).map((r) => r.child_id);
  const visited = new Set();
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === targetId) return true;
    if (!visited.has(current)) {
      visited.add(current);
      const nextChildren = relations.filter((r) => r.parent_id === current).map((r) => r.child_id);
      queue.push(...nextChildren);
    }
  }
  return false;
}

function setParentCompany(childId, parentId) {
  if (childId === parentId) {
    throw new Error('Một công ty không thể tự làm công ty mẹ của chính nó!');
  }
  const parent = mockCustomers.find((c) => c.id === parentId);
  const child = mockCustomers.find((c) => c.id === childId);
  if (!parent || !child) {
    throw new Error('Không tìm thấy thông tin công ty mẹ hoặc con!');
  }
  if (isDescendant(parentId, childId)) {
    throw new Error(`Không thể chọn "${parent.name}" làm công ty mẹ vì công ty này đang trực thuộc nhánh của "${child.name}"!`);
  }

  relations = relations.filter((r) => r.child_id !== childId);
  const newRel = {
    parent_id: parentId,
    child_id: childId,
    parent_name: parent.name,
    child_name: child.name,
    established_at: new Date().toISOString(),
  };
  relations.push(newRel);
  return newRel;
}

function removeParentCompany(childId) {
  relations = relations.filter((r) => r.child_id !== childId);
}

function getGroupContractTotal(parentId) {
  const childIds = relations.filter((r) => r.parent_id === parentId).map((r) => r.child_id);
  const children = mockCustomers.filter((c) => childIds.includes(c.id));

  const parentDeals = mockDeals.filter((d) => d.customer_id === parentId && d.status === 'CLOSED_WON');
  const parentWonValue = parentDeals.reduce((sum, d) => sum + d.value, 0);

  const childrenBreakdown = children.map((c) => {
    const cDeals = mockDeals.filter((d) => d.customer_id === c.id && d.status === 'CLOSED_WON');
    return {
      customer: c,
      wonValue: cDeals.reduce((sum, d) => sum + d.value, 0),
      dealsCount: cDeals.length,
    };
  });

  const childrenTotalWon = childrenBreakdown.reduce((sum, item) => sum + item.wonValue, 0);
  const totalValue = parentWonValue + childrenTotalWon;

  return {
    totalValue,
    parentWonValue,
    childrenCount: children.length,
    children,
    childrenBreakdown,
  };
}

function filterByCorporateStructure(list, structure) {
  if (!structure || structure === 'ALL') return list;
  const parentIds = new Set(relations.map((r) => r.parent_id));
  const childIds = new Set(relations.map((r) => r.child_id));

  if (structure === 'PARENT') {
    return list.filter((c) => parentIds.has(c.id));
  } else if (structure === 'CHILD') {
    return list.filter((c) => childIds.has(c.id));
  } else if (structure === 'INDEPENDENT') {
    return list.filter((c) => !parentIds.has(c.id) && !childIds.has(c.id));
  }
  return list;
}

/* ──────────── TEST SUITE ──────────── */

// Test 1: AC 1 - Gắn một khách hàng làm công ty con của khách hàng khác
{
  relations = [];
  const rel1 = setParentCompany('c-2', 'c-1');
  const rel2 = setParentCompany('c-3', 'c-1');
  assert.strictEqual(relations.length, 2);
  assert.strictEqual(rel1.parent_name, 'Tập đoàn Hòa Bình');
  assert.strictEqual(rel2.child_name, 'Công ty CP Bất động sản Beta (Con)');
  console.log('✔ Test 1 PASS: (AC 1) Gắn thành công 2 công ty con vào Tập đoàn Hòa Bình');
}

// Test 2: AC 2 - Trang công ty mẹ hiển thị tổng giá trị hợp đồng của cả nhóm công ty
{
  const group = getGroupContractTotal('c-1');
  // c-1 có 100M, c-2 có 50M, c-3 có 30M => Tổng phải là 180,000,000đ
  assert.strictEqual(group.childrenCount, 2);
  assert.strictEqual(group.parentWonValue, 100_000_000);
  assert.strictEqual(group.totalValue, 180_000_000);
  assert.strictEqual(group.childrenBreakdown.length, 2);
  console.log(`✔ Test 2 PASS: (AC 2) Tổng giá trị hợp đồng tập đoàn chính xác: ${group.totalValue.toLocaleString('vi-VN')} đ (Mẹ: 100M + Các con: 80M)`);
}

// Test 3: Không tính các hợp đồng chưa chốt (OPEN) vào tổng giá trị đã ký
{
  const beta = mockCustomers.find((c) => c.id === 'c-3');
  const group = getGroupContractTotal('c-1');
  const betaBreakdown = group.childrenBreakdown.find((b) => b.customer.id === 'c-3');
  assert.strictEqual(betaBreakdown.wonValue, 30_000_000); // Bỏ qua deal 20M OPEN
  console.log('✔ Test 3 PASS: Chỉ tính hợp đồng CLOSED_WON, loại trừ các cơ hội chưa chốt');
}

// Test 4: Chặn một công ty tự làm mẹ của chính mình
{
  assert.throws(
    () => setParentCompany('c-1', 'c-1'),
    /Một công ty không thể tự làm công ty mẹ của chính nó/
  );
  console.log('✔ Test 4 PASS: Hệ thống chặn không cho công ty tự chọn chính mình làm công ty mẹ');
}

// Test 5: Chống lặp vòng phân cấp (Circular Hierarchy Protection)
{
  // c-2 đang là con của c-1. Thử gán c-1 làm con của c-2 => phải bị ném lỗi
  assert.throws(
    () => setParentCompany('c-1', 'c-2'),
    /trực thuộc nhánh/
  );
  console.log('✔ Test 5 PASS: Chặn vòng lặp phân cấp cha-con (A -> B -> A)');
}

// Test 6: Gỡ bỏ liên kết công ty con (Trở về công ty độc lập)
{
  removeParentCompany('c-2');
  const groupAfter = getGroupContractTotal('c-1');
  assert.strictEqual(groupAfter.childrenCount, 1);
  assert.strictEqual(groupAfter.totalValue, 130_000_000); // 100M + 30M
  console.log('✔ Test 6 PASS: Gỡ thành công công ty con khỏi tập đoàn, tính toán tự động cập nhật');
}

// Test 7: Lọc danh sách khách hàng theo cơ cấu tổ chức
{
  // Lúc này: c-1 là PARENT, c-3 là CHILD, c-2 và c-4 là INDEPENDENT
  const parents = filterByCorporateStructure(mockCustomers, 'PARENT');
  const children = filterByCorporateStructure(mockCustomers, 'CHILD');
  const independent = filterByCorporateStructure(mockCustomers, 'INDEPENDENT');

  assert.strictEqual(parents.length, 1);
  assert.strictEqual(parents[0].id, 'c-1');
  assert.strictEqual(children.length, 1);
  assert.strictEqual(children[0].id, 'c-3');
  assert.strictEqual(independent.length, 2);
  console.log('✔ Test 7 PASS: Bộ lọc theo cơ cấu (PARENT / CHILD / INDEPENDENT) hoạt động chính xác');
}

console.log('\n===============================================================');
console.log('    TOÀN BỘ 7 TEST CASES STORY S3-05 ĐÃ VƯỢT QUA THÀNH CÔNG!    ');
console.log('===============================================================\n');
