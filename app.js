// Trạng thái ứng dụng
let firebaseUrl = (localStorage.getItem('cc_firebase_url') || APP_CONFIG.DEFAULT_FIREBASE_URL).replace(/\/$/, '');
let problems = JSON.parse(localStorage.getItem('cc_problems')) || DEFAULT_PROBLEMS;
let submissions = JSON.parse(localStorage.getItem('cc_subs')) ||;
let studentName = localStorage.getItem('cc_student') || '';
let isTeacherUnlocked = false;
let currentProblem = null;

async function init() {
  if (!studentName) {
    const inputName = prompt('Chào mừng em! Nhập Họ tên & Lớp của em để bắt đầu (VD: Nguyễn Văn A - 11A1):');
    studentName = (inputName && inputName.trim()) ? inputName.trim() : 'Học sinh ẩn danh';
    localStorage.setItem('cc_student', studentName);
  }

  document.getElementById('firebaseUrlInput').value = firebaseUrl;
  updateCloudBadge();
  updateStudentUI();
  renderProblemList();
  renderSubmissions();
  renderLeaderboard();
  loadIdeTemplate();

  // Hỗ trợ phím Tab trong trình soạn thảo code
  ['codeInput', 'ideCode'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
      }
    });
  });

  if (firebaseUrl) {
    await syncFromFirebase();
    setInterval(syncFromFirebase, 8000);
  }
}

function updateCloudBadge() {
  const badge = document.getElementById('cloudBadge');
  if (firebaseUrl) {
    badge.className = 'cloud-status cloud-on';
    badge.innerText = '● Đã kết nối Firebase Cloud';
  } else {
    badge.className = 'cloud-status cloud-off';
    badge.innerText = '○ Chế độ Offline';
  }
}

async function syncFromFirebase() {
  if (!firebaseUrl) return;
  try {
    const probRes = await fetch(`${firebaseUrl}/problems.json`);
    if (probRes.ok) {
      const cloudProbs = await probRes.json();
      if (cloudProbs && Array.isArray(cloudProbs) && cloudProbs.length > 0) {
        problems = cloudProbs;
        localStorage.setItem('cc_problems', JSON.stringify(problems));
        renderProblemList();
      }
    }

    const subRes = await fetch(`${firebaseUrl}/submissions.json`);
    if (subRes.ok) {
      const cloudSubsObj = await subRes.json();
      if (cloudSubsObj) {
        const list = Object.values(cloudSubsObj);
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        submissions = list;
        localStorage.setItem('cc_subs', JSON.stringify(submissions));
      } else {
        submissions =;
      }
      renderSubmissions();
      renderLeaderboard();
      updateStudentUI();
      renderProblemList();
    }
  } catch (err) {
    console.warn('Lỗi đồng bộ Firebase:', err);
  }
}

function getMySolvedIds() {
  const solved = new Set();
  submissions.forEach(s => {
    if (s.student === studentName && s.verdict === 'Accepted' && s.probId) {
      solved.add(s.probId);
    }
  });
  return Array.from(solved);
}

function updateStudentUI() {
  document.getElementById('currentUserDisplay').innerText = studentName;
  document.getElementById('sideStudentName').innerText = studentName;

  const mySolved = getMySolvedIds();
  document.getElementById('solvedCount').innerText = mySolved.length;
  document.getElementById('totalCount').innerText = problems.length;

  let score = 0;
  mySolved.forEach(id => {
    const p = problems.find(item => item.id === id);
    if (p) score += Number(p.diff || 100);
  });
  document.getElementById('studentScore').innerText = score;
}

function changeStudentName() {
  const name = prompt('Nhập Họ tên & Lớp của học sinh:', studentName);
  if (name && name.trim()) {
    studentName = name.trim();
    localStorage.setItem('cc_student', studentName);
    updateStudentUI();
    renderProblemList();
    renderLeaderboard();
    renderSubmissions();
  }
}

function renderLeaderboard() {
  const userMap = {};
  submissions.forEach(s => {
    if (!s.student) return;
    if (!userMap[s.student]) {
      userMap[s.student] = { name: s.student, solvedSet: new Set(), score: 0 };
    }
    if (s.verdict === 'Accepted' && s.probId && !userMap[s.student].solvedSet.has(s.probId)) {
      userMap[s.student].solvedSet.add(s.probId);
      const p = problems.find(item => item.id === s.probId);
      userMap[s.student].score += p ? Number(p.diff || 100) : 100;
    }
  });

  const ranking = Object.values(userMap).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.solvedSet.size - a.solvedSet.size;
  });

  const tbody = document.getElementById('leaderboardBody');
  if (ranking.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Chưa có dữ liệu nộp bài</td></tr>';
    return;
  }

  tbody.innerHTML = ranking.map((r, i) => {
    const cls = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
    return `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td><span class="${cls}">${r.name}</span></td>
        <td class="text-center">${r.solvedSet.size}</td>
        <td class="text-center"><b>${r.score}</b></td>
      </tr>
    `;
  }).join('');
}

function showTab(tabName) {
  ['problemset', 'submissions', 'custom', 'teacher'].forEach(t => {
    document.getElementById('tab-' + t).style.display = (t === tabName) ? 'block' : 'none';
    const nav = document.getElementById('nav-' + t);
    if (nav) nav.classList.toggle('active', t === tabName);
  });
  document.getElementById('problem-detail').style.display = 'none';
}

function renderProblemList() {
  const mySolved = getMySolvedIds();
  const tbody = document.getElementById('problemListBody');
  tbody.innerHTML = problems.map(p => {
    const isSolved = mySolved.includes(p.id);
    return `
      <tr class="${isSolved ? 'solved-row' : ''}">
        <td class="text-center"><a onclick="openProblem('${p.id}')"><b>${p.id}</b></a></td>
        <td>
          <a onclick="openProblem('${p.id}')">${p.title}</a>
          <span class="tag">${p.tag || 'thuật toán'}</span>
        </td>
        <td class="text-center">${p.diff}</td>
        <td class="text-center">${p.tests.length} test</td>
      </tr>
    `;
  }).join('');
}

function filterProblems() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#problemListBody tr').forEach(r => {
    r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
  });
}

function openProblem(id) {
  currentProblem = problems.find(p => p.id === id);
  if (!currentProblem) return;

  document.getElementById('tab-problemset').style.display = 'none';
  document.getElementById('problem-detail').style.display = 'block';
  document.getElementById('quickRunBox').style.display = 'none';

  document.getElementById('detail-breadcrumb').innerText = `Kho bài tập » ${currentProblem.id}`;
  document.getElementById('p-title').innerText = `${currentProblem.id}. ${currentProblem.title}`;
  document.getElementById('p-desc').innerText = currentProblem.desc;
  document.getElementById('p-input').innerText = currentProblem.inputDesc;
  document.getElementById('p-output').innerText = currentProblem.outputDesc;
  document.getElementById('p-sample-in').innerText = currentProblem.tests?.in || '';
  document.getElementById('p-sample-out').innerText = currentProblem.tests?.out || '';

  loadTemplateCode();
}

function loadTemplateCode() {
  const lang = document.getElementById('langSelect').value;
  document.getElementById('codeInput').value = CODE_TEMPLATES[lang];
}

function loadIdeTemplate() {
  const lang = document.getElementById('ideLang').value;
  document.getElementById('ideCode').value = CODE_TEMPLATES[lang];
}

function copyText(elId) {
  navigator.clipboard.writeText(document.getElementById(elId).innerText);
  alert('Đã sao chép Input mẫu!');
}

async function executeRemoteCode(langKey, code, stdin) {
  const cfg = LANG_CONFIG[langKey];
  const res = await fetch(APP_CONFIG.PISTON_EXECUTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: cfg.language,
      version: cfg.version,
      files: [{ name: cfg.file, content: code }],
      stdin: stdin
    })
  });
  if (!res.ok) throw new Error('Máy chủ biên dịch tạm bận, vui lòng thử lại sau vài giây.');
  return await res.json();
}

function normalizeOutput(str) {
  return (str || '').trim().split('\n').map(line => line.trimEnd()).join('\n');
}

async function runSampleTest() {
  const code = document.getElementById('codeInput').value;
  const lang = document.getElementById('langSelect').value;
  const sampleIn = currentProblem.tests.in;
  const expectedOut = normalizeOutput(currentProblem.tests.out);

  const box = document.getElementById('quickRunBox');
  const statusEl = document.getElementById('quickRunStatus');
  const outEl = document.getElementById('quickRunOutput');

  box.style.display = 'block';
  statusEl.className = 'verdict-run';
  statusEl.innerText = '⏳ Đang gửi code lên máy chủ biên dịch và chạy thử...';
  outEl.innerText = '';

  try {
    const result = await executeRemoteCode(lang, code, sampleIn);
    if (result.compile && result.compile.code !== 0) {
      statusEl.className = 'verdict-ce';
      statusEl.innerText = '❌ Lỗi biên dịch (Compilation Error):';
      outEl.innerText = result.compile.stderr || result.compile.output;
      return;
    }
    if (result.run.code !== 0) {
      statusEl.className = 'verdict-wa';
      statusEl.innerText = '❌ Lỗi thực thi (Runtime Error):';
      outEl.innerText = result.run.stderr || 'Chương trình thoát với mã lỗi ' + result.run.code;
      return;
    }

    const actualOut = normalizeOutput(result.run.stdout);
    if (actualOut === expectedOut) {
      statusEl.className = 'verdict-ac';
      statusEl.innerText = '✔ Khớp với Ví dụ 1! Em có thể bấm "Nộp bài chấm điểm".';
    } else {
      statusEl.className = 'verdict-wa';
      statusEl.innerText = '✘ Sai kết quả ở Ví dụ 1 (Wrong Answer)';
    }
    outEl.innerText = `--- Output của em ---\n${actualOut}\n\n--- Output chuẩn ---\n${expectedOut}`;
  } catch (err) {
    statusEl.className = 'verdict-wa';
    statusEl.innerText = 'Lỗi: ' + err.message;
  }
}

async function submitRealCode() {
  const code = document.getElementById('codeInput').value.trim();
  const lang = document.getElementById('langSelect').value;
  if (!code) return alert('Vui lòng nhập mã nguồn trước khi nộp!');

  const subId = Math.floor(100000 + Math.random() * 900000);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const prob = currentProblem;

  const newSub = {
    id: subId,
    timestamp: Date.now(),
    timeStr: timeStr,
    student: studentName,
    probId: prob.id,
    problem: `${prob.id} - ${prob.title}`,
    lang: lang.toUpperCase(),
    verdict: 'Đang chấm...',
    statusClass: 'verdict-run',
    code: code
  };

  submissions.unshift(newSub);
  renderSubmissions();
  showTab('submissions');

  for (let i = 0; i < prob.tests.length; i++) {
    newSub.verdict = `Running on test ${i + 1}...`;
    renderSubmissions();

    try {
      const res = await executeRemoteCode(lang, code, prob.tests[i].in);

      if (res.compile && res.compile.code !== 0) {
        newSub.verdict = 'Compilation Error';
        newSub.statusClass = 'verdict-ce';
        await finalizeSubmission(newSub);
        return;
      }

      if (res.run.code !== 0) {
        newSub.verdict = `Runtime Error on test ${i + 1}`;
        newSub.statusClass = 'verdict-wa';
        await finalizeSubmission(newSub);
        return;
      }

      const actual = normalizeOutput(res.run.stdout);
      const expected = normalizeOutput(prob.tests[i].out);

      if (actual !== expected) {
        newSub.verdict = `Wrong answer on test ${i + 1}`;
        newSub.statusClass = 'verdict-wa';
        await finalizeSubmission(newSub);
        return;
      }
    } catch (e) {
      newSub.verdict = 'Judge Error (Lỗi mạng)';
      newSub.statusClass = 'verdict-ce';
      await finalizeSubmission(newSub);
      return;
    }
  }

  newSub.verdict = 'Accepted';
  newSub.statusClass = 'verdict-ac';
  await finalizeSubmission(newSub);
}

async function finalizeSubmission(subObj) {
  localStorage.setItem('cc_subs', JSON.stringify(submissions));
  renderSubmissions();
  updateStudentUI();
  renderLeaderboard();
  renderProblemList();

  if (firebaseUrl) {
    try {
      await fetch(`${firebaseUrl}/submissions/${subObj.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subObj)
      });
    } catch (err) {
      console.error('Không thể gửi bài nộp lên Firebase:', err);
    }
  }
}

function renderSubmissions() {
  const tbody = document.getElementById('subHistory');
  if (submissions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có bài nộp nào.</td></tr>';
    return;
  }
  tbody.innerHTML = submissions.map((s, idx) => {
    const canView = isTeacherUnlocked || (s.student === studentName);
    const codeAction = canView
      ? `<a onclick="viewSubmittedCode(${idx})">Xem code</a>`
      : `<span style="color:#999; font-size:11px;">🔒 Ẩn</span>`;

    return `
      <tr>
        <td class="text-center">${s.id}</td>
        <td class="text-center">${s.timeStr || ''}</td>
        <td><b>${s.student}</b></td>
        <td>${s.problem}</td>
        <td class="text-center">${s.lang}</td>
        <td class="${s.statusClass}">${s.verdict}</td>
        <td class="text-center">${codeAction}</td>
      </tr>
    `;
  }).join('');
}

function viewSubmittedCode(idx) {
  const s = submissions[idx];
  if (!s) return;
  if (!isTeacherUnlocked && s.student !== studentName) {
    return alert('Chỉ Giáo viên mới có quyền xem mã nguồn của học sinh khác!');
  }
  document.getElementById('modalTitle').innerText = `Bài nộp #${s.id} — ${s.student}`;
  document.getElementById('modalInfo').innerText = `Bài: ${s.problem} | Ngôn ngữ: ${s.lang} | Kết quả: ${s.verdict}`;
  document.getElementById('modalCodeContent').innerText = s.code || '(Không có mã nguồn)';
  document.getElementById('codeModal').style.display = 'flex';
}

async function runCustomIDE() {
  const lang = document.getElementById('ideLang').value;
  const code = document.getElementById('ideCode').value;
  const input = document.getElementById('ideInput').value;
  const outEl = document.getElementById('ideOutput');

  outEl.value = '⏳ Đang biên dịch và thực thi trên máy chủ...';
  try {
    const res = await executeRemoteCode(lang, code, input);
    if (res.compile && res.compile.code !== 0) {
      outEl.value = 'LỖI BIÊN DỊCH:\n' + (res.compile.stderr || res.compile.output);
    } else if (res.run.code !== 0) {
      outEl.value = 'LỖI THỰC THI:\n' + (res.run.stderr || res.run.stdout);
    } else {
      outEl.value = res.run.stdout || '(Chương trình chạy xong, không có dữ liệu in ra)';
    }
  } catch (e) {
    outEl.value = 'Lỗi kết nối: ' + e.message;
  }
}

// ================= CỔNG GIÁO VIÊN =================
function unlockTeacher() {
  if (document.getElementById('teacherPass').value === APP_CONFIG.TEACHER_PASSWORD) {
    isTeacherUnlocked = true;
    document.getElementById('teacherLock').style.display = 'none';
    document.getElementById('teacherPanel').style.display = 'block';
    renderSubmissions(); // Mở khóa nút Xem code của toàn bộ học sinh
  } else {
    alert('Sai mật khẩu Giáo viên!');
  }
}

async function saveFirebaseConfig() {
  const url = document.getElementById('firebaseUrlInput').value.trim().replace(/\/$/, '');
  firebaseUrl = url;
  localStorage.setItem('cc_firebase_url', firebaseUrl);
  updateCloudBadge();

  if (firebaseUrl) {
    const check = await fetch(`${firebaseUrl}/problems.json`);
    const data = await check.json();
    if (!data) {
      await fetch(`${firebaseUrl}/problems.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(problems)
      });
    }
    await syncFromFirebase();
    alert('Đã kết nối Firebase thành công! Mọi dữ liệu của lớp đã được đồng bộ.');
  }
}

async function resetClassSubmissions() {
  if (!firebaseUrl) return alert('Chưa kết nối Firebase!');
  if (confirm('Xóa toàn bộ lịch sử bài nộp và điểm số của cả lớp trên Firebase để bắt đầu buổi học mới?')) {
    await fetch(`${firebaseUrl}/submissions.json`, { method: 'DELETE' });
    submissions =;
    localStorage.setItem('cc_subs', '');
    renderSubmissions();
    renderLeaderboard();
    updateStudentUI();
    renderProblemList();
    alert('Đã làm mới bảng điểm cả lớp!');
  }
}

function addTestcaseRow() {
  const container = document.getElementById('testcasesContainer');
  const idx = container.children.length + 1;
  const div = document.createElement('div');
  div.className = 'testcase-row';
  div.innerHTML = `
    <textarea class="tc-in" rows="2" placeholder="Input Test ${idx}"></textarea>
    <textarea class="tc-out" rows="2" placeholder="Output chuẩn Test ${idx}"></textarea>
    <span>Test ${idx}</span>
  `;
  container.appendChild(div);
}

async function saveNewProblem() {
  const id = document.getElementById('newId').value.trim().toUpperCase();
  const title = document.getElementById('newTitle').value.trim();
  const diff = Number(document.getElementById('newDiff').value) || 100;
  const tag = document.getElementById('newTag').value.trim() || 'bài tập';
  const desc = document.getElementById('newDesc').value.trim();
  const inputDesc = document.getElementById('newInputDesc').value.trim();
  const outputDesc = document.getElementById('newOutputDesc').value.trim();

  if (!id || !title || !desc) return alert('Vui lòng nhập đủ Mã bài, Tên bài và Đề bài!');

  const tests =;
  document.querySelectorAll('#testcasesContainer .testcase-row').forEach(row => {
    const tIn = row.querySelector('.tc-in').value;
    const tOut = row.querySelector('.tc-out').value;
    if (tOut.trim() !== '') tests.push({ in: tIn, out: tOut });
  });

  if (tests.length === 0) return alert('Cần ít nhất 1 bộ Test có Output chuẩn!');

  const existingIdx = problems.findIndex(p => p.id === id);
  const probObj = { id, title, diff, tag, desc, inputDesc, outputDesc, tests };
  if (existingIdx >= 0) problems[existingIdx] = probObj;
  else problems.push(probObj);

  localStorage.setItem('cc_problems', JSON.stringify(problems));

  if (firebaseUrl) {
    await fetch(`${firebaseUrl}/problems.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(problems)
    });
  }

  renderProblemList();
  updateStudentUI();
  alert(`Đã lưu bài ${id}${firebaseUrl ? ' và đồng bộ lên Cloud cho toàn bộ học sinh' : ''}!`);
  showTab('problemset');
}

function exportProblemsJSON() {
  const blob = new Blob([JSON.stringify(problems, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bo_de_tin_hoc.json';
  a.click();
}

init();
