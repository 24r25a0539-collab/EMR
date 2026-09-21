import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function assert(condition, message, detail = '') {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`, detail);
    process.exit(1);
  }
  console.log(`✅ ${message}`, detail ? `(${detail})` : '');
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 VERIFYING FIND DOCTORS DEDUPLICATION & INTEGRITY');
  console.log('====================================================');

  // TEST 1: Initial Load - GET /api/doctors
  console.log('\n--- TEST 1: Initial Load (All Approved Doctors) ---');
  const allRes = await axios.get(`${API_BASE}/doctors`);
  assert(allRes.status === 200 && allRes.data.success, 'GET /api/doctors successful');
  const allDoctors = allRes.data.doctors;
  console.log(`Total Approved Doctors returned: ${allDoctors.length}`);
  allDoctors.forEach(d => {
    console.log(`  - [${d.id}] ${d.fullName} | ${d.specialization} | Reg: ${d.registrationNumber}`);
  });

  // Verify uniqueness of Doctor IDs
  const idSet = new Set(allDoctors.map(d => d.id));
  assert(idSet.size === allDoctors.length, 'All Doctor IDs are 100% unique in API response', `Unique IDs: ${idSet.size}`);

  // Count occurrences of Dr. Joe Peterson
  const joeDocs = allDoctors.filter(d => d.fullName.toLowerCase().includes('joe') || d.fullName.toLowerCase().includes('peterson'));
  assert(joeDocs.length === 1, 'Dr. Joe Peterson appears exactly ONCE on initial load', `Count: ${joeDocs.length}`);
  console.log(`  Canonical Joe Peterson ID: ${joeDocs[0].id}`);

  // Count occurrences of other doctors
  const sharmaDocs = allDoctors.filter(d => d.fullName.toLowerCase().includes('sharma'));
  assert(sharmaDocs.length === 1, 'Dr. Ananya Sharma appears exactly ONCE', `Count: ${sharmaDocs.length}`);

  const vermaDocs = allDoctors.filter(d => d.fullName.toLowerCase().includes('verma'));
  assert(vermaDocs.length === 1, 'Dr. Rajesh Verma appears exactly ONCE', `Count: ${vermaDocs.length}`);

  const smithDocs = allDoctors.filter(d => d.fullName.toLowerCase().includes('smith'));
  assert(smithDocs.length === 1, 'Dr. Sarah Smith appears exactly ONCE', `Count: ${smithDocs.length}`);

  // TEST 2: Search "Joe"
  console.log('\n--- TEST 2: Search "Joe" ---');
  const searchJoeRes = await axios.get(`${API_BASE}/doctors?search=Joe`);
  assert(searchJoeRes.status === 200, 'Search "Joe" succeeds');
  const searchJoeDocs = searchJoeRes.data.doctors;
  assert(searchJoeDocs.length === 1, 'Search "Joe" returns exactly 1 doctor', `Count: ${searchJoeDocs.length}`);
  assert(searchJoeDocs[0].fullName === 'Dr. Joe Peterson', 'Search "Joe" returns Dr. Joe Peterson', searchJoeDocs[0].fullName);

  // TEST 3: Search "Joe Peterson"
  console.log('\n--- TEST 3: Search "Joe Peterson" ---');
  const searchJoePetersonRes = await axios.get(`${API_BASE}/doctors?search=Joe%20Peterson`);
  const searchJoePetersonDocs = searchJoePetersonRes.data.doctors;
  assert(searchJoePetersonDocs.length === 1, 'Search "Joe Peterson" returns exactly 1 doctor', `Count: ${searchJoePetersonDocs.length}`);

  // TEST 4: Search "John" then "Joe" again (Repeated Search Idempotency)
  console.log('\n--- TEST 4: Repeated Search Idempotency ---');
  const searchJohnRes = await axios.get(`${API_BASE}/doctors?search=John`);
  console.log(`  Search "John" results count: ${searchJohnRes.data.doctors.length}`);
  const searchJoeAgainRes = await axios.get(`${API_BASE}/doctors?search=Joe`);
  assert(searchJoeAgainRes.data.doctors.length === 1, 'Search "Joe" again returns exactly 1 doctor', `Count: ${searchJoeAgainRes.data.doctors.length}`);

  // TEST 5: Specialization Filters
  console.log('\n--- TEST 5: Specialization Filters ---');
  const cardioRes = await axios.get(`${API_BASE}/doctors?specialization=Cardiology`);
  assert(cardioRes.status === 200, 'Cardiology filter succeeds');
  const cardioDocs = cardioRes.data.doctors;
  const cardioIds = new Set(cardioDocs.map(d => d.id));
  assert(cardioIds.size === cardioDocs.length, 'Cardiology results have unique IDs', `Count: ${cardioDocs.length}`);

  const neuroRes = await axios.get(`${API_BASE}/doctors?specialization=Neurology`);
  assert(neuroRes.status === 200, 'Neurology filter succeeds');
  const neuroDocs = neuroRes.data.doctors;
  const neuroIds = new Set(neuroDocs.map(d => d.id));
  assert(neuroIds.size === neuroDocs.length, 'Neurology results have unique IDs', `Count: ${neuroDocs.length}`);

  // TEST 6: Hospital Filter
  console.log('\n--- TEST 6: Hospital Filter ---');
  const hospRes = await axios.get(`${API_BASE}/doctors?hospital=Care`);
  assert(hospRes.status === 200, 'Hospital Care filter succeeds');
  const hospDocs = hospRes.data.doctors;
  const hospIds = new Set(hospDocs.map(d => d.id));
  assert(hospIds.size === hospDocs.length, 'Hospital results have unique IDs', `Count: ${hospDocs.length}`);

  // TEST 7: Single Doctor Lookup
  console.log('\n--- TEST 7: Single Doctor Lookup by ID ---');
  const singleDoc = await axios.get(`${API_BASE}/doctors/${joeDocs[0].id}`);
  assert(singleDoc.status === 200 && singleDoc.data.doctor.id === joeDocs[0].id, 'GET /doctors/:id resolves canonical doctor', singleDoc.data.doctor.fullName);

  console.log('\n====================================================');
  console.log('🎉 ALL DEDUPLICATION & INTEGRITY TESTS PASSED!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
